# Gym Tracker

A simple web app for tracking gym workouts. Live site: https://pcosel.github.io/gym-tracker/

## How it works

- **No backend.** The page is static. It signs in with Google Identity Services, which gives the browser a short-lived access token, and calls the Google Sheets REST API directly with the user's own token. There is no server and no client secret.
- **Drive sharing is the security boundary.** The spreadsheet is private in Google Drive, and only accounts it is shared with can read it. The in-app check only decides what the page renders. The client ID and spreadsheet ID are public, so never switch the sheet's sharing to "Anyone with the link".
- **The token stays in memory.** The site shares its origin, `https://pcosel.github.io`, with every other project site of the same owner, and so shares their `localStorage`. A token written to storage could be read by any of them. The only value stored is the signed-in email address, under `gymTracker.lastEmail`.
- **Access check.** After signing in, the app requests the spreadsheet's title (`fields=properties.title`, so no cell data) before showing anything from the sheet.

The page always shows the "Gym Tracker" header and exactly one of five screens:

| Screen | When it appears |
|---|---|
| Config ("Not configured") | `CLIENT_ID` or `SPREADSHEET_ID` in `config.js` is blank. It lists the blank ones, and Google is never contacted. |
| Sign-in | There is no session yet, a sign-in was cancelled or failed, or a session expired. |
| Checking | Google sign-in is loading, a session is being restored, or the access check is running. |
| Denied ("No access") | The sheet does not exist or is not shared with the signed-in account (HTTP 404 or 403). It offers "Use a different account". |
| App | The access check succeeded. It shows the sheet's title, and the header shows the account's email next to "Sign out". |

## Sessions

- **The token lasts about an hour.** Google issues a short-lived access token and no refresh token, so the app has to ask for a new one now and then.
- **Silent restore on reload.** If an email is remembered, the app asks Google for a new token on page load, without the consent prompt. Google's popup opens, closes by itself and the connected screen appears, with no tap. With no remembered email, such as on a first visit, the app does not contact Google for a token.
- **Silent renewal on 401.** If Google rejects a request because the token has expired, the app renews it the same way and repeats the request once. If renewal fails, it shows the sign-in screen with "Your session expired", and keeps the remembered email and the grant.
- **One tap is the fallback.** Both silent paths open a popup without a fresh tap, which a browser may block. Phone browsers and iOS home-screen shortcuts are the likely cases. The app then shows the sign-in screen without an error. For a remembered account, one tap on "Sign in with Google" closes the popup by itself, with no account chooser. With no remembered account, Google shows its account chooser.
- **If Google itself is signed out**, the silent restore still opens a popup, now showing Google's login. The page waits on "Restoring your session…" until you log in, which restores the session, or close the popup, which leads to the sign-in screen with no error.
- **Sign-out revokes, expiry does not.** "Sign out" and "Use a different account" revoke the app's grant with Google and forget the remembered email, so the next sign-in shows the consent prompt again. An expired session does not revoke anything, so recovering from it costs one tap.

On desktop Chromium, neither silent path was blocked. The "blocked" fallback was tested there by forcing the popup to fail. On a phone, Chrome blocks the silent restore on reload ("Pop-up blockiert"), both in the browser and from a home-screen shortcut. The page shows the sign-in screen, and one tap on "Sign in with Google" signs the remembered account back in without the account chooser.

## Google Cloud setup

The app signs in with Google and talks to the Google Sheets API straight from the browser. This one-time setup in the [Google Cloud console](https://console.cloud.google.com/) makes that possible.

1. **Create a project.** Create a new project named "Gym Tracker". Under APIs & Services -> Library, enable the **Google Sheets API**. Check that APIs & Services -> Enabled APIs lists it.
2. **Configure the OAuth consent screen.**
   - User type: **External**. Publishing status: **Testing**. App name: "Gym Tracker".
   - Under Audience, add your own Google account as a **test user**. Only listed test users can sign in while the app is in Testing.
   - Under Data Access, add exactly these three scopes and nothing else:
     - `openid`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/spreadsheets`
3. **Create an OAuth client ID** of type **Web application**.
   - Add exactly two authorised JavaScript origins: `https://pcosel.github.io` (the origin only, without the `/gym-tracker` path) and `http://localhost:8000`.
   - Leave the redirect URIs empty. Do not create an API key. The sign-in flow uses a popup, which needs no redirect URI, and the Sheets calls use the user's access token, so no key is involved.
   - Copy the client ID (`….apps.googleusercontent.com`) into `config.js` as `CLIENT_ID`.
4. **Find the spreadsheet ID.** Open the gym spreadsheet. The ID is the `<ID>` in `docs.google.com/spreadsheets/d/<ID>/edit`. Copy it into `config.js` as `SPREADSHEET_ID`. In the sheet's Share dialog, check that General access is **Restricted**, not "Anyone with the link". Both IDs are public, since they sit in the page source and the repository, so the sheet's sharing settings are what keep the data private.

### Why the `spreadsheets` scope

The app asks for `spreadsheets` rather than `drive` or `spreadsheets.readonly`:

- Not `spreadsheets.readonly`, because writing workouts to the sheet is planned. Asking for write access now avoids a second consent prompt and a scope change in the console later.
- Not `drive`. That scope is "restricted" and is only needed to search folders or copy files. Reaching one sheet by its ID needs neither. `spreadsheets` is only a "sensitive" scope, so a Testing app just shows the usual "unverified app" warning.

The token can read and write all of the signed-in user's spreadsheets, not only this one. The code addresses only the configured ID, the token stays in memory, and nothing from the sheet is ever inserted as HTML.

## Running locally

From the repository root, run:

```
python -m http.server 8000
```

Then open http://localhost:8000.

- Opening `index.html` from disk (`file://`) does not work. The page loads ES modules, which browsers refuse to load over `file://`, and Google sign-in does not accept `file://` as an origin.
- The port must stay 8000, because `http://localhost:8000` is the origin registered for the OAuth client. Another port makes Google reject the sign-in.

## Files

| File | Responsibility |
|---|---|
| `index.html` | The header and the five screens, all hidden by default. Loads `app.js`. |
| `config.js` | The OAuth client ID and the spreadsheet ID, plus a check for blank entries. |
| `auth.js` | Google sign-in: loads Google Identity Services, gets, renews and revokes the access token, and remembers the signed-in email. |
| `api.js` | Calls Google APIs with the access token, turns failures into typed errors, and checks access to the spreadsheet. |
| `app.js` | Starts the app and switches between the screens. |
| `.gitignore` | Keeps `.claude/worktrees` out of commits, and so out of what Pages publishes. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |
