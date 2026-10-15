# Proposal

## Why

On the phone, the user has allowed popups for the site in Chrome. That makes the silent restore on reload work, but every reload still opens Google's popup for about a second. The token from before the reload was usually still valid for most of an hour, but it lived only in page memory, so the app had no way to know that and asked Google again. Reloads happen by accident during a gym session, and each one now flashes a Google page.

## What Changes

- Keep the access token in the tab's `sessionStorage`, together with its expiry time and the email it was issued for, under a key specific to Gym Tracker. It survives a reload of the same tab and nothing else: it is not shared with other tabs, and it is gone when the tab closes.
- On page load, reuse that stored token when it belongs to the remembered account and has more than five minutes left. The app then goes straight to the access check without contacting Google for a token, so no popup opens. Otherwise the existing silent restore runs unchanged.
- Replace the stored token whenever a new one arrives (sign-in, silent restore, renewal after a 401). Remove it on sign-out and when a session expires.
- The token is still never written to `localStorage`, IndexedDB or cookies. **This relaxes the "Access token is held in memory only" requirement**, which was there because the site shares its origin with the owner's other project sites. `sessionStorage` is scoped to one tab, so another site on that origin could read the token only if it ran in the same tab within the hour.
- Update `README.md`: the token-storage rationale in "How it works", the "Sessions" section, and the `auth.js` row in "Files". "Sessions" also gains the phone setup that makes silent restore and renewal work: allowing popups for the site in Chrome.

**Out of scope:** reusing the token across tabs or after a home-screen relaunch (that needs `localStorage`, which every site on the shared origin can read), renewing the token before it expires, a redirect-based sign-in flow, and preventing accidental reloads (for example disabling pull-to-refresh).

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `google-sign-in`: The token-storage requirement changes from "memory only" to "memory, plus the tab's `sessionStorage` until it expires or the user signs out". The session-restore requirement gains a first step that reuses a still-valid stored token without contacting Google.

## Impact

- **Modified files**: `auth.js` writes, reads and removes the stored token. Its exports and their callers stay the same, so `app.js` and `api.js` are expected to need no change. `README.md` is updated as listed above.
- **Browser storage**: A new `sessionStorage` entry under a Gym Tracker key. `localStorage` still holds only the remembered email.
- **Security**: A same-origin script running in the same tab within the token's lifetime can now read the token. Before, only a script running in this page could. The token still covers all of the user's spreadsheets, still expires after about an hour, and is still revoked on sign-out.
- **External services**: None. The Google Cloud project, OAuth client and scopes stay as they are.
- **Phone setup**: The user's manual step of allowing popups for the site in Chrome is documented, not automated.
