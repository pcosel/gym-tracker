# Tasks

Worktree: reuse-token-on-reload

Groups 1–2 are implemented in the git worktree above (branch `worktree-reuse-token-on-reload`), forked from local `main`. Serve the worktree with `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`. For the checks that need a blocked popup or a rejected request, use a scripted browser (for example Playwright): force `window.open` to return `null`, or answer requests at the network level. `apiFetch` can't tell a patched `window.fetch` apart from a real response.

## 1. Store and reuse the token

- [x] 1.1 In `auth.js`, add the `gymTracker.session` entry from design.md ("One entry" and "Writing"):
  - the constants `SESSION_KEY` and `REUSE_MARGIN_MS` (five minutes);
  - private helpers to write, read and remove the entry, each wrapped in `try/catch`;
  - a call to `storeSession()` in the `init()` callback, right after `token` is set, with `expiresAt` computed from `response.expires_in`;
  - a call to `storeSession()` at the end of a successful `fetchEmail()`.

  Rewrite the comment above `let token` so it states the new rule: memory plus this tab's `sessionStorage`, never `localStorage`, and why. Verify the google-sign-in scenario "Browser storage after sign-in". Sign in at `http://localhost:8000`, then check DevTools -> Application:
  - Session Storage holds `gymTracker.session` with the token, an `expiresAt` about one hour ahead, and the signed-in email.
  - Local Storage holds only `gymTracker.lastEmail`.
  - Neither IndexedDB nor cookies hold the token.
- [x] 1.2 Add `restoreStoredSession()` and call it first in `trySilentSignIn()`, as described in design.md ("Reading"). A usable entry sets `token` and `email` and resolves `true` without contacting Google. Any other entry is removed before the existing path runs. Verify the scenario "Reload with a valid stored token": after signing in, reload. The connected screen appears, no popup opens, and the Network tab shows the Sheets access check but no request to `accounts.google.com/o/oauth2` and none to `userinfo`.
- [x] 1.3 Make `clearSession()` also remove `gymTracker.session`. Verify these scenarios:
  - "Signing out removes the stored token": after "Sign out", Session Storage has no `gymTracker.session`. "Use a different account" runs the same `auth.signOut()`; confirm that in the wiring in `app.js`.
  - "An expired session removes the stored token": answer every request to `sheets.googleapis.com` with HTTP 401 and reload. The renewal runs, the sign-in screen shows "Your session expired", Session Storage has no `gymTracker.session`, and Local Storage still holds `gymTracker.lastEmail`.
- [x] 1.4 Verify the restore edge cases. Edit the entry in the DevTools console before each reload:
  - "Stored token is about to expire": set `expiresAt` to four minutes from now. The reload discards it and runs the silent restore, so a popup opens. Afterwards the entry holds a new token, with `expiresAt` about an hour ahead.
  - "Stored token belongs to another account" (other email): set `email` to `someone-else@example.com`. The reload discards the entry and runs the silent restore for the remembered account.
  - "Stored token belongs to another account" (no remembered email): remove `gymTracker.lastEmail` from Local Storage and keep the entry. The reload shows the sign-in screen, requests no token, and leaves no `gymTracker.session`.
  - "Stored token is rejected by Google": set `token` to `invalid`. The reload sends the access check, gets 401, renews once and retries, and the connected screen appears. The entry then holds the new token, which also covers "A new token replaces the stored one".
  - Unusable content: set the entry to a string that isn't JSON. The reload removes it and runs the silent restore, and the console shows no errors.
  - "A new tab does not get the token": with a valid entry in one tab, type `http://localhost:8000` into a new tab. That tab's Session Storage has no `gymTracker.session` before the restore, and the restore runs the silent popup.
- [x] 1.5 Verify that these scenarios still hold:
  - "First visit": in a fresh browser context, the sign-in screen appears and the Network tab shows no `o/oauth2` request.
  - "Reload after signing out": sign out and reload. The sign-in screen appears with no token request.
  - "Silent restore is blocked by the browser": with no usable entry, force `window.open` to return `null` and reload. The sign-in screen shows no error. One tap on "Sign in with Google" signs the remembered account in without the account chooser, and the entry is written.
- [x] 1.6 Update `README.md` to match:
  - "How it works": rewrite "The token stays in memory" to say the token is kept in memory and in the tab's `sessionStorage` until it expires, never in `localStorage`, and why one tab's storage is acceptable on the shared origin.
  - "Sessions":
    - a reload in the same tab reuses a token that has more than five minutes left, with no request to Google;
    - silent restore now applies to a new tab, or to a reload after the token ran out;
    - the phone setup that lets silent restore and renewal work: tap "Always show" ("Immer anzeigen") on Chrome's "Pop-up blocked" bar, or allow pop-ups for the site under Chrome's site settings;
    - the paragraph on what was observed on the phone.
  - "Why the `spreadsheets` scope": correct "the token stays in memory" in the last paragraph.
  - "Files": the `auth.js` row also keeps the token for the tab.

  Verify that `README.md` no longer says the token is held only in memory, and that "Sessions" matches the behaviour observed in 1.2–1.5.

## 2. Merge and publish

- [x] 2.1 Commit all work in the worktree, then fast-forward `main` to the worktree branch from the main checkout with `git merge --ff-only worktree-reuse-token-on-reload`. Do not push. Verify that `git log main -1` matches the worktree branch head and that `git status` is clean on `main`.
- [ ] 2.2 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds in the repository's Actions tab.

## 3. Live verification

These checks run against the deployed site after the push in 2.2, so they are checked off in a follow-up commit. Set `SITE` to `https://<owner>.github.io/<repo>/`.

- [ ] 3.1 On a desktop browser at `$SITE`, sign in and then reload. The connected screen appears without a popup, and Session Storage holds `gymTracker.session`. Then sign out: the entry is gone. Verify that the console shows no errors from this app's code. Record the result in this task.
- [ ] 3.2 (Manual, user) On your phone, in Chrome with pop-ups allowed for the site, open `$SITE`. The first load after the deployment may still flash Google's popup once, because no token is stored yet. Then reload a few times within the hour: each reload goes straight to the connected screen with no Google popup. Repeat from the home-screen shortcut. The first launch may flash the popup, but reloads in that tab must not. If you notice Chrome reloading the tab after you come back from another app, record whether it also went straight to the connected screen (design.md, "Open Questions"). Write the outcome into this task.

## Workflow follow-up

- Once group 3 passes, run `/opsx:archive` on `main`. It applies the `google-sign-in` delta to `openspec/specs/google-sign-in/spec.md`, renaming "Access token is held in memory only" in place, and moves this change to `openspec/changes/archive/`.
- Commit the checked-off tasks and the archive together. The user pushes `main` manually.
- Remove the `reuse-token-on-reload` worktree and its `worktree-reuse-token-on-reload` branch once `main` contains them.
