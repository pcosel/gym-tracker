# Design

## Context

The site is a hand-written `index.html` served as-is from the root of `main` by GitHub Pages. There is no build step, package manager or test tooling, and the `web-hosting` spec requires it to stay that way. The page currently shows only the "Gym Tracker" title and heading. The app is meant mainly for phones.

Two constraints shape the design:
- **Shared origin.** A project site is served from `https://<owner>.github.io/<repo>/`, so every project site of the same owner shares the origin `https://<owner>.github.io` and therefore shares its `localStorage`. An XSS bug in any of those sites could read what this one stores.
- **Single user.** The target is one spreadsheet that already exists and is owned by the user. Its ID is fixed and public, and it is private in Drive (see proposal.md).

## Goals / Non-Goals

**Goals:**
- A module layout that later features can build on without reworking sign-in: reading workout data, logging sets, and anything else that writes to the sheet.
- A request wrapper that can already send writes (method and JSON body), so the first write feature only adds a function.
- One explicit screen state machine that every later screen hangs off.

**Non-Goals:**
- A stylesheet or visual design. Screens use browser defaults, and switching between them works through the `hidden` attribute.
- Local development overrides, such as a `config.local.js` that points a local run at a copy of the sheet. While the app only reads, testing against the real sheet is harmless. This has to be revisited in the first change that writes.
- Automated tests. The repository has no test tooling. Verification is manual, on `localhost` and on the live site (see tasks.md).
- Offline support, PWA installability or a service worker.

## Decisions

### GIS token model, popup-based, no backend
`google.accounts.oauth2.initTokenClient` issues a roughly one-hour access token through a Google popup. No refresh token is involved, and the client ID is the only credential.
- *Alternative: authorization-code flow.* Google requires a client secret to exchange the code for a web client, so this needs a backend. That contradicts static hosting.
- *Alternative: hand-rolled redirect to `accounts.google.com/o/oauth2/v2/auth` with `response_type=token`.* It avoids popups, which matters on phones, but it reimplements what GIS does and leaves the page on every sign-in. It stays as the fallback if popups prove unworkable on the user's phone (see Risks).

### Scopes: `openid`, `userinfo.email`, `spreadsheets`
- `spreadsheets` rather than `spreadsheets.readonly`, because writing is planned. Asking now avoids a second consent prompt and a scope change in the Cloud console later.
- No Drive scope. The broad `drive` scope is "restricted" and is only needed to search folders or copy files. Reaching one sheet by its ID needs neither. `spreadsheets` is a "sensitive" scope rather than a "restricted" one, so Testing status only shows the usual "unverified app" warning.
- *Alternative: `drive.file` with Google Picker.* This is the narrowest grant, covering only files the user picks. It needs an API key, the Picker library and a "choose your sheet" flow, which is wasted effort when the ID is hard-coded.
- *Consequence:* the token can read and write **all** of the user's spreadsheets, not only this one. The app's code addresses only the configured ID, the token never leaves memory, and nothing from the sheet is ever inserted as HTML (see below).

### Token in memory; only the email is remembered
`auth.js` holds the token in a module variable. After sign-in it fetches `https://www.googleapis.com/oauth2/v3/userinfo` and stores the email in `localStorage` under `gymTracker.lastEmail`. The email has three uses. It is passed as `login_hint` on each token request, so Google targets that account. It signals that a silent restore is worth attempting. And it switches the sign-in button to one-tap mode (see below). Every storage access is wrapped in `try/catch`, because private browsing modes can throw.
- *Why not store the token:* because of the shared origin, a stored token would be readable by any of the owner's other project sites. A silent re-grant gives the same convenience without that exposure.
- The hint goes on each request, as `requestAccessToken({ prompt, login_hint })`, rather than into `initTokenClient`. A hint given at creation would be fixed for the life of the page. A client built before the first sign-in would never carry it, and one built for an account that later signed out would keep pointing at that account. Passing it per request means the token client is built once and never rebuilt.

### One in-flight token request
GIS reports results through callbacks registered on the client (`callback`, `error_callback`), not through each request. So `auth.js` keeps one pending `{resolve, reject, promise}`, and any concurrent caller shares it instead of overwriting the callbacks. `error_callback` covers a closed popup and a blocked popup, both of which end up as a rejected sign-in.
- Silent requests pass `prompt: ''`, which reuses an existing grant and only shows UI if consent is really needed.
- Silent restore at boot runs only when an email is remembered. A first-time visitor therefore never sees a popup flash.

### One-tap sign-in for a remembered account
The token client's default `prompt` is `select_account`, which shows Google's account chooser on every tap, even when `login_hint` already names the right account. So when an email is remembered, `signIn` passes `prompt: ''` together with that email as `login_hint`. Google then shows only the UI it really needs: consent if the grant is gone, a login if the browser is signed out of Google. Otherwise the popup closes by itself. With no remembered email, `signIn` keeps the default, so the user picks the account on purpose. That deliberate choice is the point of "Use a different account".
- **This is what keeps the fallback cheap.** Silent restore at boot and silent renewal after a 401 both run without a tap, and phone browsers are likely to block them. Landing on the sign-in screen then costs one tap rather than a trip through the account chooser.
- **The popup is allowed only because a tap started it.** The click handler therefore has to reach `requestAccessToken` without first awaiting anything slow, because Safari in particular drops the tap's permission across an async gap. For that reason, GIS is loaded and the token client is built once during boot, before the sign-in button is shown.
- *Alternative: always pass `prompt: ''`.* Then a tap with no remembered account would not reliably show the account chooser, which "Use a different account" depends on.

### `auth.js` interface
`app.js` and `api.js` use `auth.js` only through these exports:

| Export | What it does | Called by |
|---|---|---|
| `init()` | Loads the GIS script once and builds the token client, with no hint. Rejects if the script cannot load. | `boot()` |
| `hasRememberedAccount()` | Reports whether `gymTracker.lastEmail` is set. | `boot()`, to choose the checking text |
| `signIn()` | Interactive token request. With a remembered email it passes `prompt: ''` and `login_hint`. Otherwise it uses the default prompt. It must not await anything before the request (see "One-tap sign-in"). Then it calls `fetchEmail()`. | the "Sign in with Google" button |
| `refreshToken()` | Silent token request, with `prompt: ''` and `login_hint`. | `apiFetch` on a 401, and `trySilentSignIn()` |
| `trySilentSignIn()` | Only if an email is remembered: calls `refreshToken()`, then `fetchEmail()`. Resolves `true` or `false` and never throws. | `boot()` |
| `fetchEmail()` | Reads the email from `userinfo`, keeps it in memory and stores it under `gymTracker.lastEmail`. If the read fails, the email stays unknown, but sign-in does not fail. | `signIn()`, `trySilentSignIn()` |
| `getToken()`, `getEmail()` | Return the in-memory token and email. | `apiFetch`; `app.js` for the header and the no-access screen |
| `clearSession()` | Drops only the in-memory token and email. The remembered email and the grant are kept, so the next tap is one-tap. Used when a session *expires*. | `app.js`, when a request fails with `expired` or `unauthenticated` |
| `signOut()` | Revokes the grant with Google, then forgets the token, the email and the remembered email. Used when the user *chooses* to leave. | "Sign out", "Use a different account" |

### Access check: Sheets metadata with a field mask
The check is `GET https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?fields=properties.title`. With the field mask, the response holds only the title and never any cell data. That is exactly what the connected screen shows, and it proves access without tying the code to the sheet's layout, which a later change will design.
- *Alternative: Drive `files.get`.* It needs a Drive scope.
- *Alternative: `values.get` on a range.* It couples the access check to the column layout.
- The Sheets API answers 404 for an ID that does not exist and 403 for a sheet not shared with the account. Both map to the no-access screen, whose wording covers both cases.

### Request wrapper and error kinds
`api.js` exports `apiFetch(url, options)`. It adds `Authorization: Bearer <token>`, passes `method`, `headers` and `body` through, and returns the parsed JSON (or `null` for 204). Failures become an `ApiError` with a `kind` the UI switches on:

| Condition | `kind` | UI outcome |
|---|---|---|
| no token in memory | `unauthenticated` | sign-in screen |
| 401 after one silent renewal and retry | `expired` | sign-in screen, "session expired" |
| 403 | `forbidden` | no-access screen (during the access check) |
| 404 | `not-found` | no-access screen (during the access check) |
| 429, 5xx | `transient` | sign-in screen, "Google is unavailable, try again shortly" |
| anything else, including a network failure | `unknown` | sign-in screen with the message |

The 401 retry happens exactly once per call. A second 401 throws `expired`, so a bad token cannot loop.

### Screens and state machine
`index.html` keeps a header that is always visible with `<h1>Gym Tracker</h1>`, which satisfies the `web-hosting` requirement on every screen. When signed in, the header also shows the account's email and a "Sign out" button. Below the header are an error line and five sections, exactly one of which is visible at a time: `screen-config`, `screen-signin`, `screen-checking`, `screen-denied` and `screen-app`. `app.js` owns the transitions:

```
boot
 |
 +-- CLIENT_ID or SPREADSHEET_ID blank --> [config]  (GIS never loaded)
 |
 v
[checking] --GIS script fails--> [signin + error]
 |
 +-- no remembered email -----------------> [signin]
 |                                             |
 +-- silent re-grant --fails--------------> [signin]   (no error)
 |        |                                    |
 |        ok          user signs in -----------+
 |        |           (cancel -> [signin + message])
 |        v                 |
 +----> access check <------+
         |     |       \
        200  403/404   other
         |     |         \
         v     v          v
      [app]  [denied]   [signin + error]
       |        |
       +--------+-- Sign out / Use a different account --> revoke --> [signin]
```

The sheet title and the email are rendered with `textContent`, never `innerHTML`. The title is text the user controls.

### Configuration
`config.js` exports `CONFIG = { CLIENT_ID, SPREADSHEET_ID }` and `missingConfigKeys()`. The latter returns the names of blank entries, which the config screen lists. Both values are committed in plain sight, with a comment explaining why neither is a secret. The spreadsheet ID is the `<ID>` in `docs.google.com/spreadsheets/d/<ID>/edit`.

### Plain ES modules, relative paths
`index.html` loads `<script type="module" src="./app.js">`. The other modules are imported with `./` paths. A leading `/` would resolve against the owner's user site rather than `/<repo>/`. GIS is injected at run time by `auth.js` from `https://accounts.google.com/gsi/client`, and only after the config check passes.

## Risks / Trade-offs

- **[Popups on phones]** Silent restore at boot and silent renewal after a 401 both open a GIS popup without a fresh user tap. Mobile browsers, and iOS home-screen shortcuts in particular, may block that popup. → In that case both fall back to the sign-in screen. The cost is one tap per visit, with no account chooser (see "One-tap sign-in for a remembered account"). Task 6.3 tests this on the user's phone. If even tap-initiated sign-in proves unreliable there, a later change switches to the redirect flow listed under Decisions.
- **[Token lifetime vs. gym session]** Tokens last about an hour, while a workout can run longer. → A 401 is renewed silently and the request retried. If renewal is blocked, one tap on "Sign in" brings the user back in without choosing the account again.
- **[Broad `spreadsheets` grant]** The token covers every spreadsheet the user has. → It is held in memory only, the code addresses one ID, there are no third-party scripts besides GIS, and sheet text never goes into `innerHTML`.
- **[Public IDs]** The client ID and spreadsheet ID are visible to anyone. → This was accepted: the sheet is private in Drive, and the OAuth client accepts only the registered origins. Nobody should ever change the sheet's sharing to "Anyone with the link".
- **[Revoking on sign-out]** `google.accounts.oauth2.revoke` drops the whole grant, so the next sign-in shows the consent prompt again. → This is accepted as what "sign out" means. Recovering from an *expired* session does not revoke, so that path costs only one click.
- **[Testing status]** The consent screen warns that Google hasn't verified the app, and only listed test users can sign in. → This is fine for a personal tool. Publishing the app would mean verifying the `spreadsheets` scope.
- **[GIS blocked]** An ad or tracker blocker, or a network failure, can stop `accounts.google.com/gsi/client` from loading. → The sign-in screen shows "Could not load Google sign-in".

## Migration Plan

1. (Manual, user) Create the Google Cloud project and OAuth client, and collect the client ID and spreadsheet ID (tasks group 1). Until they are filled in, the deployed site shows the "Not configured" screen and calls nothing.
2. Implement in the git worktree `connect-google-sheet`, forked from `main`, and commit there.
3. Verify locally at `http://localhost:8000`, served from the worktree. Local verification needs no push, because `localhost:8000` is a registered origin.
4. Fast-forward `main` to the worktree branch. The user pushes `main` by hand, which triggers the Pages deployment.
5. Verify on the live site, then archive the change.

**Rollback:** Revert the merged commits on `main` and push. The site returns to the placeholder page. The Cloud project can stay, because nothing calls it.
