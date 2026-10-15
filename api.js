import { CONFIG } from './config.js';
import { getToken, refreshToken } from './auth.js';
import { quoteTab, rangeFor } from './sheet-format.js';

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

function spreadsheetUrl() {
  return `${SHEETS_URL}/${encodeURIComponent(CONFIG.SPREADSHEET_ID)}`;
}

// The field mask keeps cell data out of the response: the title proves access,
// and the tab titles tell whether this year's tab exists.
export async function probeSpreadsheet() {
  const data = await apiFetch(`${spreadsheetUrl()}?fields=properties.title,sheets.properties.title`);
  return {
    title: data.properties.title,
    tabs: (data.sheets || []).map((sheet) => sheet.properties.title),
  };
}

// The whole tab as Google Sheets displays it (so a reps cell stored as a date
// reads "10, 8, 07"). Rows are arrays of strings, with trailing empty cells
// and rows trimmed: index i is sheet row i + 1.
export async function readTab(title) {
  const range = encodeURIComponent(quoteTab(title));
  const data = await apiFetch(`${spreadsheetUrl()}/values/${range}`);
  return data.values || [];
}

// Writes cells as plain text (RAW), so Google Sheets never turns "12, 10, 10"
// into a date. Each write is { row, col, values }: the strings go into
// consecutive cells of one row, starting at column index `col`. An empty
// string empties the cell. Nothing else is touched.
export async function writeCells(tab, writes) {
  const data = writes.map(({ row, col, values }) => ({
    range: rangeFor(tab, row, col, col + values.length - 1),
    values: [values],
  }));
  await apiFetch(`${spreadsheetUrl()}/values:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valueInputOption: 'RAW', data }),
  });
}
