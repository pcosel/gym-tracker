# Design

## Context

Every token reaches `auth.js` through one place: the `callback` passed to `initTokenClient` in `init()`, which sets the module variable `token`. `signIn()`, `refreshToken()` and `trySilentSignIn()` all go through the shared `requestToken()`, which opens Google's popup. `fetchEmail()` then sets the in-memory `email` and stores it under `gymTracker.lastEmail`. `boot()` in `app.js` runs `auth.init()` and then `auth.trySilentSignIn()`, and continues to the access check (`probeSpreadsheet()`) on success. `clearSession()` drops the token and email from memory when a session expires, and `signOut()` revokes the grant and also forgets the remembered email.

The archived connect-google-sheet design ("Token in memory; only the email is remembered") kept the token out of browser storage because the site shares the origin `https://<owner>.github.io` with the owner's other project sites. This design narrows that decision rather than dropping it. See proposal.md ("Why") for the motivation.

## Goals / Non-Goals

**Goals:**
- A reload in the same tab, within the token's lifetime, reaches the access check with no request to Google for a token, and so no popup. This also helps on a phone that blocks popups: such a reload no longer needs a tap.
- Keep the change inside `auth.js`. Its exports and their callers stay the same.
- If storage is unavailable or its content is unusable, behave exactly as today.

**Non-Goals:**
- Starting faster. `boot()` still waits for the GIS script before restoring, because a later tap on "Sign in with Google" and a renewal after a 401 both need the token client to be ready. The script is usually cached, and loading it opens no popup.
- Renewing the token before it expires. Expiry during use still goes through the existing renewal after a 401.

## Decisions

### `sessionStorage`, not `localStorage`
`sessionStorage` belongs to one tab of one origin. It survives a reload of that tab and is deleted when the tab closes. Another `<owner>.github.io` site can read it only by running in that same tab. `localStorage` is shared by every tab of the origin, so any of the owner's sites could read the token from any tab.
- *Alternative: `localStorage`.* It would also skip the popup in a new tab and after a home-screen relaunch. Once popups are allowed on the phone, those cases cost only a short popup flash, which doesn't justify exposing the token to every tab of the shared origin.
- *Alternative: encrypt the stored token with a non-extractable WebCrypto key kept in IndexedDB.* A same-origin script can load the same key from IndexedDB and decrypt the token in its own page, so this adds code without adding protection.
- *Alternative: stay memory-only and restore through a full-page redirect to Google with `prompt=none`.* It works without popups, but every reload becomes a visible trip through Google. It also means hand-rolling the OAuth flow and registering redirect URIs. The user preferred reusing a still-valid token.

### One entry: `gymTracker.session` = `{ token, expiresAt, email }`
The entry is a JSON object under `sessionStorage['gymTracker.session']`. The key follows the existing `gymTracker.` prefix.
- `expiresAt` is `Date.now() + Number(expires_in) * 1000`, computed when the token arrives. GIS reports `expires_in` in seconds, about 3600.
- `email` is the account the token was issued for. It does two jobs. On restore, it sets the in-memory email without a second `userinfo` request. It also ties the token to the remembered account: if `gymTracker.lastEmail` no longer matches, the entry is discarded. That happens when the user signed out, or switched accounts, in another tab.

### Writing: when a token arrives, and again when the email is learned
A private `storeSession()` writes `{ token, expiresAt, email }` from the module's current values. It runs in two places:
- in the token callback in `init()`, right after `token` is set. Sign-in, silent restore and renewal all pass through there.
- at the end of a successful `fetchEmail()`.

On a first sign-in, the entry briefly has `email: null` until `fetchEmail()` fills it in. If `fetchEmail()` fails, the email stays `null` and the entry is never reused, so the next reload falls back to today's silent restore. That is the safe direction.

### Reading: inside `trySilentSignIn()`, before any popup
`trySilentSignIn()` first calls a private `restoreStoredSession()`. The entry is usable only when all of these hold:
- it parses, and `token` is a non-empty string;
- `email` equals `gymTracker.lastEmail`;
- `expiresAt - Date.now()` is more than five minutes (`REUSE_MARGIN_MS`).

A usable entry sets `token` and `email` in memory, and `trySilentSignIn()` resolves `true` without contacting Google. Any other entry is removed, and the existing path runs unchanged: with a remembered email, `refreshToken()` and then `fetchEmail()`. The access check that follows is the real test of the token. If Google answers 401, `apiFetch` renews it once, as it already does.
- *Why five minutes:* a token reused with a minute left would expire during the next set, and the renewal popup would appear while the user is busy. Getting a new token on load, while the user is already waiting, is better. A five-minute margin leaves reuse working for about 55 minutes after a token was issued.
- *Alternative: no margin.* That means fewer popups on reload, but more renewals during use.
- *Alternative: ask Google's `tokeninfo` endpoint whether the token is valid.* That's an extra round trip, and the access check already gives the same answer.

### Removing: `clearSession()` and `signOut()`
`clearSession()` also removes `gymTracker.session`. `app.js` calls it when a request fails as `expired` or `unauthenticated`, and `signOut()` calls it after revoking. No caller changes.

### Storage failures fall back to today's behaviour
Every `sessionStorage` access is wrapped in `try/catch`, like the existing email helpers. If writing fails, nothing is stored. If reading fails, or the JSON doesn't parse, the app treats it as "no entry". Either way the app behaves as it does today.

### `auth.js` interface: changed rows only

| Export | Change |
|---|---|
| `trySilentSignIn()` | First reuses a usable `gymTracker.session` entry without contacting Google. Otherwise removes the entry and runs as before. It still resolves `true` or `false` and never throws. |
| `fetchEmail()` | On success, also updates the email in `gymTracker.session`. |
| `clearSession()` | Also removes `gymTracker.session`. |
| `signIn()`, `refreshToken()` | No change in code. The token they obtain is stored by the callback in `init()`. |
| `signOut()` | No change in code. It removes the entry through `clearSession()`. |

## Risks / Trade-offs

- **[A same-origin script in the same tab can read the token]** Before this change, only a script running in this page could. Now a page from another `<owner>.github.io` site could too, if it ran in the same tab within the token's lifetime and had a script-injection bug. → The entry lives at most about an hour, only in that tab, and is removed on sign-out and on expiry. It never goes into `localStorage`. The app has no links to other sites, and the only window it opens is Google's popup, which is a different origin. Chrome copies `sessionStorage` into a duplicated tab, but duplicating is the user's own action and stays within their own tabs.
- **[The stored token was revoked elsewhere]** For example, the grant was removed at myaccount.google.com. → The access check gets a 401 and renews once. With popups allowed, that happens silently. If the phone blocks popups, the user sees "Your session expired" and taps once. That's an error message where a blocked silent restore shows none, but it only happens after a revocation.
- **[Device clock changes between issue and reload]** A stale token can look valid and lead to a 401 and a renewal. A valid token can look expired and cause one unneeded popup. → Both are harmless.
- **[Popup setting is per browser and per device]** The renewal after an hour, and a restore in a new tab, still depend on popups being allowed. → The README documents the Chrome setting. Without it, the existing one-tap fallback still applies.

## Migration Plan

1. Implement in the git worktree `reuse-token-on-reload` (branch `worktree-reuse-token-on-reload`), forked from local `main`, and commit there.
2. Verify locally at `http://localhost:8000`, served from the worktree. The origin is already registered, so no Cloud console change is needed.
3. Fast-forward `main` to the worktree branch from the main checkout. The user pushes `main` by hand, which deploys the site.
4. Verify on the live site, on desktop and on the phone, then archive the change.

**Rollback:** Revert the commit on `main` and push. The old code never reads `gymTracker.session`. An entry left in an open tab is ignored and disappears when the tab closes.

## Open Questions

- When Android unloads Chrome's background tab and Chrome reloads it later, does `sessionStorage` survive? Chrome's session restore is expected to keep it, but that hasn't been observed on the user's phone. Either answer leaves the design unchanged: if the entry is lost, the reload behaves as it does today. The phone check in tasks.md records it if the user happens to see such a reload.
