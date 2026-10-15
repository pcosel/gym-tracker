# Tasks

Worktree: connect-google-sheet

Groups 2–4 are implemented in the git worktree above, forked from `main`. Serve the worktree locally with `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`. Group 1 is done by the user in the Google Cloud console and can run in parallel with group 2, but sign-in cannot be verified until it is finished.

## 1. Google Cloud setup

- [x] 1.1 (Manual, user) In the Google Cloud console, create a new project named "Gym Tracker" and enable the **Google Sheets API** for it. Verify that APIs & Services -> Enabled APIs lists "Google Sheets API".
- [x] 1.2 (Manual, user) Configure the OAuth consent screen: user type **External**, publishing status **Testing**, app name "Gym Tracker", and your own Google account as a **test user**. Under Data Access, add exactly the scopes `openid`, `https://www.googleapis.com/auth/userinfo.email` and `https://www.googleapis.com/auth/spreadsheets`. Verify that Data Access lists those three scopes and nothing else, and that Audience lists your account under test users.
- [x] 1.3 (Manual, user) Create an OAuth client ID of type **Web application**. Add two authorised JavaScript origins: `https://<owner>.github.io` (the owner from `git remote get-url origin`, with no `/<repo>` path) and `http://localhost:8000`. Leave the redirect URIs empty, and do not create an API key. Verify that the client's page shows exactly those two origins. Hand the client ID (`…apps.googleusercontent.com`) to the implementer.
- [x] 1.4 (Manual, user) Open the gym spreadsheet and copy its ID, the `<ID>` in `docs.google.com/spreadsheets/d/<ID>/edit`. Hand it to the implementer. Verify that the Share dialog shows General access as **Restricted**, not "Anyone with the link", because the ID will be public.
- [x] 1.5 Add a "Google Cloud setup" section to `README.md` that records 1.1–1.4 so they can be reproduced. It must also say why the scope is `spreadsheets` and not `drive` or `spreadsheets.readonly` (design.md, "Scopes"), and that no API key or redirect URI is needed. Verify that every console step in 1.1–1.4 appears in the section, with the same three scopes and two origins.

## 2. Configuration and page skeleton

- [x] 2.1 Add `.gitignore` containing `/.claude/worktrees`, with a comment explaining why. Verify that `git check-ignore -v .claude/worktrees/x` prints the rule.
- [x] 2.2 Create `config.js` exporting `CONFIG = { CLIENT_ID, SPREADSHEET_ID }` and `missingConfigKeys()`, as described in design.md ("Configuration"). Add a header comment explaining why neither value is a secret. Fill in the values from 1.3 and 1.4 if they are available, otherwise leave them `''`. Verify in the browser console at `http://localhost:8000` that `(await import('./config.js')).missingConfigKeys()` returns `[]` when both are set and lists the blank names otherwise.
- [x] 2.3 Rewrite `index.html` as described in design.md ("Screens and state machine"):
  - keep `<title>Gym Tracker</title>`;
  - add an always-visible header with `<h1>Gym Tracker</h1>` and a hidden account area holding the email and a "Sign out" button;
  - add an error line;
  - add the five `hidden` sections: config (with a list of missing keys), sign-in (with a "Sign in with Google" button), checking (with a status text), denied (with the account and a "Use a different account" button) and app (with the sheet title);
  - load `<script type="module" src="./app.js">`.

  Verify, when served locally, that the tab title and the heading both read "Gym Tracker". This keeps the `web-hosting` requirement "Entry page identifies the app" true.
- [x] 2.4 Create `app.js` with `showScreen` (exactly one section visible, and the account area visible only on app and denied), the error-line helpers, and a `boot()` that shows the config screen listing `missingConfigKeys()` and returns before anything else. Verify the sheet-access scenario "Spreadsheet ID left blank": with `SPREADSHEET_ID` temporarily set to `''`, the page shows "Not configured" listing only `SPREADSHEET_ID`, and the DevTools Network tab shows no request to any Google domain. Restore the value afterwards.
- [x] 2.5 Add "Running locally" and "Files" sections to `README.md`. "Running locally" covers `python -m http.server 8000`, why `file://` does not work, and why the port must stay 8000. "Files" is a table of each root file's responsibility. Verify that the documented command, run from a fresh shell in the repository root, serves the page at `http://localhost:8000`.

## 3. Sign-in, access check and sign-out

- [x] 3.1 Create `auth.js` as described in design.md. It loads GIS from `https://accounts.google.com/gsi/client` on demand and builds the token client once, with the three scopes and no hint. It shares a single in-flight token request, keeps the token in memory, and stores only the email under `gymTracker.lastEmail` (storage access wrapped in `try/catch`). Implement exactly the exports in design.md ("`auth.js` interface"). In particular:
  - every token request passes the remembered email as `login_hint`;
  - `signIn` adds `prompt: ''` only when an email is remembered;
  - `signOut` revokes the grant, while `clearSession` does not.

  Verify that the page loads without console errors and that the GIS script tag appears only when the config is complete.
- [x] 3.2 Create `api.js` with `ApiError`, the status-to-`kind` mapping from design.md ("Request wrapper and error kinds"), `apiFetch` (Bearer header; passes `method`, `headers` and `body` through; one silent renewal and retry on 401) and `probeSpreadsheet()`. `probeSpreadsheet()` calls `spreadsheets.get` with `fields=properties.title` and returns `{ title }`. Verify after 3.3 that the Network tab shows that request with the field mask and that its response holds no cell data.
- [x] 3.3 Wire sign-in into `app.js`. Extend `boot()` so that, once the config is complete, it runs `auth.init()` and then shows the sign-in screen. If `init()` fails, the sign-in screen shows its error. A request that fails with `expired` or `unauthenticated` calls `auth.clearSession()` and shows the sign-in screen with the "session expired" message. The "Sign in with Google" button is disabled while a request is pending. It then runs `auth.signIn()`, reaching the token request without awaiting anything first so the tap still permits the popup, and then an `enterApp()` that shows the checking screen and probes. A success leads to the app screen, with the title and the header's email set via `textContent`. A `forbidden` or `not-found` error leads to the denied screen with the email. Any other error goes back to the sign-in screen with its message. Verify the sheet-access scenario "Owner signs in": the title matches the one in Google Sheets, and the signed-in email appears next to "Sign out". Then verify the google-sign-in scenario "First sign-in": `https://oauth2.googleapis.com/tokeninfo?access_token=` + `(await import('./auth.js')).getToken()` returns a `scope` holding exactly `openid`, `userinfo.email` and `spreadsheets`, with no `drive` scope.
- [x] 3.4 Verify the google-sign-in scenario "Sign-in is cancelled": close the Google popup without choosing an account. The page stays on the sign-in screen with a message, and the button works again.
- [x] 3.5 Verify the sheet-access scenario "Account without access is told so" through the 404 path: temporarily set `SPREADSHEET_ID` to a made-up ID, sign in, and confirm that the denied screen names the account and shows no title. Restore the real ID. 403 takes the same branch in code. Verify that by reading the mapping in `api.js`, unless a second test-user account is available to exercise it for real.
- [x] 3.6 Wire "Sign out" in the header, and "Use a different account" on the denied screen, to `auth.signOut()`, which clears the screens back to sign-in. Verify the google-sign-in scenarios "Signing out", "Reload after signing out" and "Signing in after signing out":
  - after signing out, `localStorage` has no `gymTracker.lastEmail`;
  - a reload shows the sign-in screen with no token request;
  - the next sign-in shows Google's consent prompt again.
- [x] 3.7 Verify the google-sign-in scenario "Browser storage after sign-in": after signing in, DevTools -> Application for `localhost:8000` shows `gymTracker.lastEmail` as the only `localStorage` entry, and no token in session storage, IndexedDB or cookies.
- [x] 3.8 Add a "How it works" section to `README.md` covering:
  - no backend: the browser calls Sheets with the user's own token;
  - the sheet's Drive sharing is the real security boundary, and the in-app gate only decides what is rendered;
  - why the token stays in memory (the shared `<owner>.github.io` origin);
  - the access check and the five screens.

  Verify that the README names every screen in the design.md state machine.

## 4. Session restore and expiry

- [x] 4.1 Add session restore to `boot()`. While `auth.init()` runs, show the checking screen ("Restoring your session…" if an account is remembered, otherwise "Loading…"). After it, run `auth.trySilentSignIn()`, which leads to `enterApp()` on success and to the sign-in screen with no error otherwise. Verify the google-sign-in scenarios "Returning user with a live Google session", "Silent restore is blocked by the browser", "First visit" and "No remembered account":
  - sign in, then reload: the connected screen appears without a tap.
  - if Chrome blocks the popup instead, that is the "blocked" scenario. Confirm that the sign-in screen shows no error and that one tap on "Sign in with Google" closes the popup by itself, with no account chooser, and reaches the connected screen. Record this in the task, then allow popups for the origin and repeat the reload to confirm the silent path.
  - in a fresh private window, the sign-in screen appears and the Network tab shows no request to `accounts.google.com/o/oauth2`. Tapping "Sign in with Google" there shows Google's account chooser.

  Recorded: on desktop Chromium the silent restore was not blocked. After a reload the connected screen appeared without a tap, and the popup opened with `login_hint` and closed by itself. The "blocked" scenario was forced by making the first `window.open` return null. The sign-in screen then showed no error and kept the remembered email, and one tap opened the popup with `login_hint` and no account chooser and reached the connected screen. A fresh browser context showed the sign-in screen, requested only the GIS script and no `o/oauth2` URL, and opened no popup. Tapping "Sign in with Google" with no remembered account opened Google's account chooser (`prompt=select_account`).
- [x] 4.2 Verify the google-sign-in scenario "Silent restore fails": sign in to the app, then sign out of Google itself at `accounts.google.com` (not through the app) and reload. The sign-in screen appears with no error message.

  Recorded: after signing out of Google, the reload opened a Google login popup by itself, and the checking screen ("Restoring your session…") stayed up until that popup was closed. Closing it led to the sign-in screen with no error, and the remembered email was kept. Logging in inside that popup would restore the session instead.
- [x] 4.3 Verify the google-sign-in scenarios "Renewal succeeds" and "Renewal fails". Before clicking "Sign in", patch `window.fetch` in the console so that requests to `sheets.googleapis.com` return `new Response('{}', { status: 401 })`:
  - once only: the probe is retried after a silent renewal and the connected screen appears;
  - every time: the sign-in screen shows the "session expired" message, and `localStorage` still holds `gymTracker.lastEmail`. Then restore the original `fetch` in the console and tap "Sign in with Google" once. The popup closes by itself without the account chooser and the connected screen appears, which is the scenario "Remembered account".

  If the renewal popup is blocked, record that here. It is the fallback the design expects.

  Recorded: on desktop Chromium the renewal popup was not blocked, so "Renewal succeeds" passed through the silent path (restore popup, then renewal popup, probe retried once). The 401s were injected at the network level (Playwright route) instead of by patching `window.fetch`, which `apiFetch` cannot tell apart.
- [x] 4.4 Add a "Sessions" section to `README.md` covering the roughly one-hour token, silent restore on reload, silent renewal on 401, one-tap sign-in for a remembered account as the fallback when either is blocked, and why sign-out revokes the grant while an expired session does not. It also states the popup caveat from design.md ("Risks"). Verify that the section matches the behaviour observed in 4.1–4.3, including any blocked popups that were recorded.

## 5. Merge and publish

- [x] 5.1 Commit all work in the worktree, then fast-forward `main` to the worktree branch from the main checkout (`git merge --ff-only worktree-connect-google-sheet`). Do not push. Verify that `git log main -1` matches the worktree branch head and that `git status` is clean on `main`.
- [x] 5.2 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds in the repository's Actions tab.

## 6. Live verification

These checks run against the deployed site after the push in 5.2, so they are checked off in a follow-up commit. Set `SITE` to `https://<owner>.github.io/<repo>/`.

- [x] 6.1 Verify that the `web-hosting` requirements still hold. `curl -sI "$SITE"` returns HTTP 200. `curl -s "$SITE"` contains `<title>Gym Tracker</title>` and `<h1>Gym Tracker</h1>`. `curl -s "${SITE}app.js"` is byte-identical to the committed `app.js`, which confirms it is served as-is.
- [x] 6.2 On a desktop browser at `$SITE`, sign in. The connected screen shows the sheet's title and the email next to "Sign out". Reload: the session is restored. Sign out: the sign-in screen appears. Verify that the browser console shows no errors throughout.

  Recorded: passed on `https://pcosel.github.io/gym-tracker/` (title shown, email next to "Sign out", restored on reload, sign-out clears storage). The console held no errors from this app's code. Its only errors were a 404 for `/favicon.ico` and Google's own `gsi/client` "Cross-Origin-Opener-Policy would block the window.closed call" messages, which appear while its popup is open.
- [x] 6.3 (Manual, user) On your phone, open `$SITE` in the browser you will use at the gym, and also from a home-screen shortcut if you plan to use one. Tap "Sign in with Google": the connected screen appears. Then reload, and record whether the session was restored silently or fell back to the sign-in screen. If it fell back, tap "Sign in with Google" once: the popup should close by itself without the account chooser and the connected screen should appear. Verify that tap-initiated sign-in works and that the reload outcome is written into this task line. If tap-initiated sign-in itself fails, stop and raise switching to the redirect flow (design.md, "GIS token model") as a follow-up change.

  Recorded: tested in Chrome on a phone, both in the browser and from a home-screen shortcut, with the same result. Sign-in by tap works. On reload the silent restore was blocked ("Pop-up blockiert") and the page fell back to the sign-in screen. One tap on "Sign in with Google" then closed the popup by itself, with no account chooser, and returned to the connected screen.

## Workflow follow-up

- Once group 6 passes, run `/opsx:archive` on `main`. It adds `specs/google-sign-in` and `specs/sheet-access` to `openspec/specs/` and moves this change to `openspec/changes/archive/`.
- Commit the checked-off tasks and the archive together. The user pushes `main` manually.
- Remove the `connect-google-sheet` worktree and its `worktree-connect-google-sheet` branch once `main` contains them.
