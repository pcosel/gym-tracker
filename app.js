import { missingConfigKeys } from './config.js';
import * as auth from './auth.js';
import { probeSpreadsheet } from './api.js';

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

async function enterApp() {
  clearError();
  showChecking('Checking access…');
  try {
    const { title } = await probeSpreadsheet();
    $('account-email').textContent = auth.getEmail() || '';
    $('sheet-title').textContent = title;
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
    const list = $('missing-keys');
    for (const key of missing) {
      const item = document.createElement('li');
      item.textContent = key;
      list.append(item);
    }
    showScreen('config');
    return;
  }

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
