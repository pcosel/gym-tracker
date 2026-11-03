import { ENVIRONMENT, CONFIG, missingConfigKeys } from './config.js';
import * as auth from './auth.js';
import { probeSpreadsheet, readTab } from './api.js';
import { dateOf, formatDate, sheetUrl } from './sheet-format.js';
import { initToday, showMissingTab, startWorkout, currentRows } from './today.js';
import { showHistory } from './history.js';

const SCREENS = ['config', 'signin', 'checking', 'denied', 'app'];
const SCREENS_WITH_ACCOUNT = ['app', 'denied'];

const $ = (id) => document.getElementById(id);

function showScreen(name) {
  for (const screen of SCREENS) {
    $(`screen-${screen}`).hidden = screen !== name;
  }
  $('account').hidden = !SCREENS_WITH_ACCOUNT.includes(name);
}

function showError(message) {
  $('error').textContent = message;
  $('error').hidden = false;
}

function clearError() {
  $('error').textContent = '';
  $('error').hidden = true;
}

function showChecking(text) {
  $('checking-text').textContent = text;
  showScreen('checking');
}

function showSignIn(errorMessage) {
  if (errorMessage) showError(errorMessage);
  showScreen('signin');
}

function signInMessage(error) {
  if (error && error.code === 'popup_failed_to_open') {
    return 'The sign-in popup was blocked. Allow popups for this site and try again.';
  }
  return (error && error.message) || 'Sign-in did not complete.';
}

function handleAccessError(error) {
  const email = auth.getEmail();
  switch (error.kind) {
    case 'forbidden':
    case 'not-found':
      $('account-email').textContent = email || '';
      $('denied-email').textContent = email || 'This account';
      showScreen('denied');
      break;
    case 'expired':
    case 'unauthenticated':
      auth.clearSession();
      showSignIn('Your session expired. Sign in again.');
      break;
    default:
      showSignIn(error.message || 'Something went wrong. Try again.');
  }
}

// The workout screen's page follows the URL hash: none is Today, `#history` is
// the History page, and `#history/<name>` is one exercise's detail. Every
// switch is a browser-history entry, so the back button walks back through them.
let workout = null; // { today } once the workout screen is shown

function showPage() {
  if (!workout) return;
  const hash = location.hash;
  let name;
  const onHistory = hash === '#history' || hash.startsWith('#history/');
  if (hash.startsWith('#history/')) {
    try {
      name = decodeURIComponent(hash.slice('#history/'.length));
    } catch {
      name = undefined; // a malformed % sequence shows the list
    }
  }
  if (onHistory) {
    // Leaving a focused field fires its change first, so the edit is counted
    // before the rows are read.
    const focused = document.activeElement;
    if (focused && focused.tagName === 'INPUT' && $('editor').contains(focused)) focused.blur();
    showHistory({ rows: currentRows(), today: workout.today, name });
  }
  $('today-view').hidden = onHistory;
  $('done-count').hidden = onHistory;
  $('history').hidden = !onHistory;
  for (const [id, current] of [['switch-today', !onHistory], ['switch-history', onHistory]]) {
    if (current) $(id).setAttribute('aria-current', 'page');
    else $(id).removeAttribute('aria-current');
  }
}

async function enterApp() {
  clearError();
  showChecking('Checking access…');
  try {
    const { title, tabs } = await probeSpreadsheet();
    const today = dateOf(new Date());
    const tab = String(today.y);
    $('account-email').textContent = auth.getEmail() || '';
    const yearTab = tabs.find((t) => t.title === tab);
    $('sheet-title').textContent = title;
    $('sheet-title').href = sheetUrl(CONFIG.SPREADSHEET_ID, yearTab && yearTab.sheetId);
    $('today-date').textContent = formatDate(today);
    if (!yearTab) {
      workout = null;
      showMissingTab(tab);
      showScreen('app');
      return;
    }
    showChecking('Loading today’s workout…');
    const rows = await readTab(tab);
    startWorkout({ tab, rows, today });
    // A reload always starts on Today.
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    workout = { today };
    showPage();
    showScreen('app');
  } catch (error) {
    handleAccessError(error);
  }
}

function onSignIn() {
  clearError();
  const button = $('sign-in');
  button.disabled = true;
  // signIn() reaches the token request without awaiting anything first, so the
  // tap still permits Google's popup. Keep it that way.
  auth.signIn().then(enterApp, (error) => showSignIn(signInMessage(error))).finally(() => {
    button.disabled = false;
  });
}

async function onSignOut(event) {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await auth.signOut();
    workout = null;
    clearError();
    $('account-email').textContent = '';
    showScreen('signin');
  } finally {
    button.disabled = false;
  }
}

async function boot() {
  const missing = missingConfigKeys();
  if (missing.length > 0) {
    $('config-name').textContent = ENVIRONMENT;
    const list = $('missing-keys');
    for (const key of missing) {
      const item = document.createElement('li');
      item.textContent = key;
      list.append(item);
    }
    showScreen('config');
    return;
  }

  initToday();
  window.addEventListener('hashchange', showPage);
  $('sign-in').addEventListener('click', onSignIn);
  $('sign-out').addEventListener('click', onSignOut);
  $('use-different-account').addEventListener('click', onSignOut);

  showChecking(auth.hasRememberedAccount() ? 'Restoring your session…' : 'Loading…');
  try {
    await auth.init();
  } catch (error) {
    showSignIn(error.message);
    return;
  }
  if (await auth.trySilentSignIn()) {
    await enterApp();
    return;
  }
  showSignIn();
}

boot();
