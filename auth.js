import { CONFIG } from './config.js';

const GIS_URL = 'https://accounts.google.com/gsi/client';
const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const EMAIL_KEY = 'gymTracker.lastEmail';
const SESSION_KEY = 'gymTracker.session';
const REVOKE_TIMEOUT_MS = 3000;
// A reused token must outlast the next set, or its renewal popup would appear
// while the user is busy.
const REUSE_MARGIN_MS = 5 * 60 * 1000;

// The token lives in memory and in this tab's sessionStorage, never in
// localStorage. The shared <owner>.github.io origin means localStorage is
// readable by the owner's other sites in any tab, while sessionStorage reaches
// only a site running in this same tab, and only until it closes.
let token = null;
let expiresAt = 0;
let email = null;
let tokenClient = null;
let gisLoading = null;
// GIS reports results through callbacks on the client, not per request, so all
// callers share one in-flight request.
let pending = null;

function readRememberedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

function writeRememberedEmail(value) {
  try {
    if (value) localStorage.setItem(EMAIL_KEY, value);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Storage can be unavailable, for example in private browsing.
  }
}

function writeSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt, email }));
  } catch {
    // Storage can be unavailable; the token then lives in memory only.
  }
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function removeSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to remove if storage is unavailable.
  }
}

// Uses the stored token if it is for the remembered account and has more than
// REUSE_MARGIN_MS left. Any other entry is removed.
function restoreStoredSession() {
  const stored = readSession();
  if (!stored) {
    removeSession();
    return false;
  }
  const usable =
    typeof stored.token === 'string' &&
    stored.token !== '' &&
    typeof stored.email === 'string' &&
    stored.email === readRememberedEmail() &&
    Number(stored.expiresAt) - Date.now() > REUSE_MARGIN_MS;
  if (!usable) {
    removeSession();
    return false;
  }
  token = stored.token;
  expiresAt = Number(stored.expiresAt);
  email = stored.email;
  return true;
}

function rememberedEmail() {
  return readRememberedEmail() || email;
}

function loadGis() {
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        gisLoading = null;
        reject(new Error('Could not load Google sign-in.'));
      };
      document.head.append(script);
    });
  }
  return gisLoading;
}

function settle(fn, value) {
  const current = pending;
  pending = null;
  if (current) current[fn](value);
}

export async function init() {
  if (tokenClient) return;
  await loadGis();
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error || !response.access_token) {
        const error = new Error(response.error_description || response.error || 'Sign-in failed.');
        error.code = response.error;
        settle('reject', error);
        return;
      }
      token = response.access_token;
      expiresAt = Date.now() + Number(response.expires_in) * 1000;
      writeSession();
      settle('resolve', token);
    },
    error_callback: (error) => {
      const failure = new Error('Sign-in did not complete.');
      failure.code = error && error.type;
      settle('reject', failure);
    },
  });
}

// Must call requestAccessToken synchronously: a popup is only allowed while the
// user's tap is still fresh, so callers must not await anything before this.
function requestToken(options) {
  if (pending) return pending.promise;
  if (!tokenClient) return Promise.reject(new Error('Google sign-in is not loaded.'));
  const request = {};
  request.promise = new Promise((resolve, reject) => {
    request.resolve = resolve;
    request.reject = reject;
  });
  pending = request;
  try {
    tokenClient.requestAccessToken(options);
  } catch (error) {
    settle('reject', error);
  }
  return request.promise;
}

export function hasRememberedAccount() {
  return Boolean(readRememberedEmail());
}

export async function fetchEmail() {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const info = await response.json();
    if (info.email) {
      email = info.email;
      writeRememberedEmail(info.email);
      writeSession();
    }
  } catch {
    // The email stays unknown, but signing in does not fail because of it.
  }
}

export async function signIn() {
  const hint = rememberedEmail();
  // With a remembered account, an empty prompt skips Google's account chooser.
  // Without one, Google's default shows the chooser on purpose.
  await requestToken(hint ? { prompt: '', login_hint: hint } : {});
  await fetchEmail();
}

export function refreshToken() {
  const options = { prompt: '' };
  const hint = rememberedEmail();
  if (hint) options.login_hint = hint;
  return requestToken(options);
}

export async function trySilentSignIn() {
  if (restoreStoredSession()) return true;
  if (!hasRememberedAccount()) return false;
  try {
    await refreshToken();
    await fetchEmail();
    return true;
  } catch {
    return false;
  }
}

export function getToken() {
  return token;
}

export function getEmail() {
  return email;
}

// For an expired session: the remembered email and the grant are kept, so the
// next sign-in is one tap.
export function clearSession() {
  token = null;
  expiresAt = 0;
  email = null;
  removeSession();
}

// For a deliberate sign-out: revoke the whole grant and forget everything.
export async function signOut() {
  const current = token;
  if (current && typeof google !== 'undefined') {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, REVOKE_TIMEOUT_MS);
      google.accounts.oauth2.revoke(current, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  clearSession();
  writeRememberedEmail(null);
}
