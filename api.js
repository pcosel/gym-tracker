import { CONFIG } from './config.js';
import { getToken, refreshToken } from './auth.js';

const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class ApiError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

function kindForStatus(status) {
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429 || status >= 500) return 'transient';
  return 'unknown';
}

async function messageFor(response, kind) {
  if (kind === 'transient') return 'Google is unavailable, try again shortly.';
  try {
    const data = await response.json();
    if (data && data.error && data.error.message) return data.error.message;
  } catch {
    // The body was not JSON, so fall through to the generic message.
  }
  return `The request failed (HTTP ${response.status}).`;
}

async function send(url, { method, headers, body }) {
  const token = getToken();
  if (!token) throw new ApiError('unauthenticated', 'You are not signed in.');
  try {
    return await fetch(url, {
      method,
      headers: { ...headers, Authorization: `Bearer ${token}` },
      body,
    });
  } catch {
    throw new ApiError('unknown', 'Could not reach Google. Check your connection.');
  }
}

export async function apiFetch(url, options = {}) {
  let response = await send(url, options);
  if (response.status === 401) {
    // Renew once and retry once, so a bad token can never loop.
    try {
      await refreshToken();
    } catch {
      throw new ApiError('expired', 'Your session expired.', 401);
    }
    response = await send(url, options);
    if (response.status === 401) throw new ApiError('expired', 'Your session expired.', 401);
  }
  if (!response.ok) {
    const kind = kindForStatus(response.status);
    throw new ApiError(kind, await messageFor(response, kind), response.status);
  }
  return response.status === 204 ? null : response.json();
}

// The field mask keeps cell data out of the response: the title is all the
// connected screen shows, and it proves access.
export async function probeSpreadsheet() {
  const id = encodeURIComponent(CONFIG.SPREADSHEET_ID);
  const data = await apiFetch(`${SHEETS_URL}/${id}?fields=properties.title`);
  return { title: data.properties.title };
}
