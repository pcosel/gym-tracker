# Gym Tracker

A simple web app for tracking gym workouts. Live site: https://pcosel.github.io/gym-tracker/

## How it works

- **No backend.** The page is static. It signs in with Google Identity Services, which gives the browser a short-lived access token, and calls the Google Sheets REST API directly with the user's own token. There is no server and no client secret.
- **Drive sharing is the security boundary.** The spreadsheet is private in Google Drive, and only accounts it is shared with can read it. The in-app check only decides what the page renders. The client ID and spreadsheet ID are public, so never switch the sheet's sharing to "Anyone with the link".
- **The token is kept in memory and in the tab's `sessionStorage`, never in `localStorage`.** The site shares its origin, `https://pcosel.github.io`, with every other project site of the same owner, and so shares their `localStorage`. A token written there could be read by any of them, from any tab. `sessionStorage` belongs to one tab: it survives a reload of that tab, is gone when the tab closes, and another site could read it only by running in that same tab. The entry `gymTracker.session` holds the token, its expiry time and the email, and is removed on sign-out and when the session expires. The only value in `localStorage` is the signed-in email address, under `gymTracker.lastEmail`.
- **Access check.** After signing in, the app requests the spreadsheet's title and its tab titles (`fields=properties.title,sheets.properties.title`, so no cell data) before showing anything from the sheet.
- **Reading.** The app reads the year's tab in one request, as Google Sheets displays it. That is what makes a reps cell that Sheets stored as a date readable: it comes back as `10, 8, 07`, not as a serial number.
- **Writing.** The app writes only the cells it changes, as plain text (`valueInputOption=RAW`), in one `values:batchUpdate` per save. Typed input (`USER_ENTERED`) would turn `12, 10, 10` into a date in the "Automatic" columns, and `values.append` would have to guess where the table ends. The target row comes from the read, so it is explicit.

The page always shows the "Gym Tracker" header and exactly one of five screens:

| Screen | When it appears |
|---|---|
| Config ("Not configured") | `CLIENT_ID` or `SPREADSHEET_ID` of the active configuration in `config.js` is blank. It names the configuration, lists the blank settings, and Google is never contacted. |
| Sign-in | There is no session yet, a sign-in was cancelled or failed, or a session expired. |
| Checking | Google sign-in is loading, a session is being restored, or the access check is running. |
| Denied ("No access") | The sheet does not exist or is not shared with the signed-in account (HTTP 404 or 403). It offers "Use a different account". |
| App (workout screen) | The access check succeeded and the year's tab was read. It shows today's date, the sheet's title and today's exercises, and the header shows the account's email next to "Sign out". If the sheet has no tab for the current year, it names the missing tab and offers no editing. |

## Sessions

- **The token lasts about an hour.** Google issues a short-lived access token and no refresh token, so the app has to ask for a new one now and then.
- **Reload in the same tab reuses the token.** If the tab holds a token for the remembered account with more than five minutes left, the app uses it and makes no request to Google for a token, so no popup opens. A new tab, such as a home-screen shortcut, does not get it.
- **Silent restore otherwise.** In a new tab, or when the stored token has five minutes or less left, the app asks Google for a new token on page load, if an email is remembered, without the consent prompt. Google's popup opens, closes by itself and the connected screen appears, with no tap. With no remembered email, such as on a first visit, the app does not contact Google for a token.
- **Silent renewal on 401.** If Google rejects a request because the token has expired, the app renews it the same way and repeats the request once. If renewal fails, it shows the sign-in screen with "Your session expired", and keeps the remembered email and the grant.
- **Phone setup for the silent paths.** In Chrome, tap "Always show" ("Immer anzeigen") on the "Pop-up blocked" bar, or allow pop-ups for the site under Chrome's site settings. Without that, silent restore and renewal are blocked.
- **One tap is the fallback.** Both silent paths open a popup without a fresh tap, which a browser may block. Phone browsers and iOS home-screen shortcuts are the likely cases. The app then shows the sign-in screen without an error. For a remembered account, one tap on "Sign in with Google" closes the popup by itself, with no account chooser. With no remembered account, Google shows its account chooser.
- **If Google itself is signed out**, the silent restore still opens a popup, now showing Google's login. The page waits on "Restoring your session…" until you log in, which restores the session, or close the popup, which leads to the sign-in screen with no error.
- **Saving is the exception.** If a save meets an expired session that cannot be renewed silently, the app stays on the workout screen instead of showing the sign-in screen, so the entered values are kept. "Sign in to save" signs in and repeats the save.
- **Sign-out revokes, expiry does not.** "Sign out" and "Use a different account" revoke the app's grant with Google and forget the remembered email, so the next sign-in shows the consent prompt again. An expired session does not revoke anything, so recovering from it costs one tap.

On desktop Chromium, neither silent path was blocked. The "blocked" fallback was tested there by forcing the popup to fail. On a phone without the pop-up setting above, Chrome blocks the silent restore on reload ("Pop-up blockiert"), both in the browser and from a home-screen shortcut. The page shows the sign-in screen, and one tap on "Sign in with Google" signs the remembered account back in without the account chooser.

## Configurations

`config.js` holds two configurations and picks one by the host the page is served from:

| Host | Configuration | Spreadsheet |
|---|---|---|
| `localhost` | development | a private copy of the gym sheet |
| anything else (the live site) | production | the real gym sheet |

Both use the same OAuth client. The development sheet is a copy (File > Make a copy in Google Sheets), shared with nobody, so testing never writes to the real sheet. Being a copy, it has the same tab, formats, merged headers and reps cells stored as dates, so local runs meet the real quirks. Make a fresh copy if the real sheet's layout changes. A blank setting in the development configuration only affects `localhost`: the page then shows "Not configured" naming the development configuration. `127.0.0.1` is not a registered origin, so `localhost` is the only development host.

## Sheet format

The app reads the layout and notation from the sheet and writes in the same notation.

- **One tab per year.** The app uses only the tab named after the current year (for example `2026`). It never reads another tab and never creates one.
- **Header row (row 1).** From column B on, each exercise is a pair of columns: weight, then reps. Its name is the trimmed text in row 1 above the weight column. Merged headers (B1:C1) and unmerged ones both work, and a pair with an empty name is not an exercise.
- **Carry-over row (row 2).** If A2 holds a four-digit year, row 2 holds the last values of the previous year. You maintain it by hand and the app only reads it.
- **One row per day.** Column A holds the date as text, `dd.mm.yyyy` (`5.9.2026` is read too). Other rows are ignored.
- **Weight cell.** One number in kilograms, with a dot or comma as decimal separator when reading.
- **Reps cell.** The sets in order, separated by commas: `12, 10, 10`. A set can carry its own weight after `@`, with a dot as decimal separator: `12@40, 10, 10@55`. A set without `@` used the weight cell.
- **Unreadable cells.** A weight that is not one number (`25 (Seil)`), or a reps entry that does not follow the notation (`?`, `10, 7,@60 7`), is unreadable. The app never rewrites such a cell on its own, and edits it as plain text.
- **Hidden dates.** In columns formatted as "Automatic" (Latzug and the columns after it), Google Sheets turned some reps entries into dates. They display as typed (`10, 8, 07`) and the app reads the displayed text. Cells the app writes are always text, so they are left-aligned in those columns.
- **Writes are narrow.** A save writes only the exercise's weight and reps cells, plus the date cell when it creates the row. Other cells, formatting and merged cells are not touched.

## Workout screen

The screen shows today's date, the number of exercises done today, the save status and one tile for every exercise of the header row, in header order. Tapping a tile opens that exercise's editor below the tiles. Only one is open at a time, and nothing is open when the screen loads. Opening an exercise writes nothing.

### Tiles

- A tile shows two letters of the exercise's name: the first letter and the second, ignoring anything that is not a letter. If an earlier tile already has that label (ignoring case), the second letter becomes the next letter of the name that is still free. The full name is the tile's tooltip and part of its accessible name.
- A tile has one of three colours:
  - white: not done today;
  - blue: done today, meaning the reps cell holds at least one set. A weight alone does not count;
  - green: improved, meaning a set beats the set at the same position last time, by more weight or by the same weight and more reps. A set's weight is its own `@` weight, otherwise the exercise weight, otherwise 0 kg. Positions with no readable set last time are not compared.
- The colour follows the values on screen: it changes when you leave a field or delete a set, and it keeps its state while a field is marked invalid.
- The counter at the top counts the blue and green tiles.

### Prefill

- Each exercise has a weight field and set fields, each set with its reps and its own weight (empty means the set follows the exercise weight). There are at least three set fields, as many as last time's sets and today's sets, and "+ Set" adds more. Each set row has its weight on the left and its reps on the right, and "×" deletes it. Deleting a set that holds reps saves at once.
- "Last time" is the nearest workout row above today's row (or the last row, if there is no row for today) whose reps cell holds at least one readable set. If none qualifies, it is the carry-over row, provided that holds a readable set.
- The exercise weight and each set's own weight are copied from last time as values. Last time's reps appear only as placeholders. Prefilled values alone are never saved.
- Today's saved values come first, and last time fills the gaps.

### Saving

- A change is saved when you leave the field. The first save of the day creates today's row below every row with a value, after reading the tab once more in case a row appeared meanwhile. Opening the app without training writes nothing, and neither does changing a weight before the first set.
- The status sits next to the counter at the top, so it is visible whichever exercise is open. It shows "Saving…", "Saved", or "Not saved" with the reason and "Retry". Entered values stay on screen after a failure.
- Edits made during a save are written afterwards, so the sheet ends up with the latest values.
- An exercise without any reps keeps both its cells empty, even when it has a weight. Clearing the reps again empties the weight cell too.
- Weights accept a dot or comma, and reps whole numbers. Other input is marked and not saved.
- An exercise whose cell for today is unreadable shows two plain text fields, and saving writes the entered text unchanged.
- If the session expired and cannot be renewed silently, the screen stays as it is, says so, and offers "Sign in to save". One tap signs in and saves the values on screen.

## Tests

`npm test` runs the tests with Node's built-in test runner (Node 20 or later). There is nothing to install. The tests cover the sheet notation and the prefill rules, and their data is made up.

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
4. **Find the spreadsheet ID.** Open the gym spreadsheet. The ID is the `<ID>` in `docs.google.com/spreadsheets/d/<ID>/edit`. Copy it into `config.js` as `SPREADSHEET_ID` of the production configuration. Make a copy of the sheet (File > Make a copy) for development and put its ID into the development configuration. In the Share dialog of both, check that General access is **Restricted**, not "Anyone with the link". Both IDs are public, since they sit in the page source and the repository, so the sheet's sharing settings are what keep the data private.

### Why the `spreadsheets` scope

The app asks for `spreadsheets` rather than `drive` or `spreadsheets.readonly`:

- Not `spreadsheets.readonly`, because writing workouts to the sheet is planned. Asking for write access now avoids a second consent prompt and a scope change in the console later.
- Not `drive`. That scope is "restricted" and is only needed to search folders or copy files. Reaching one sheet by its ID needs neither. `spreadsheets` is only a "sensitive" scope, so a Testing app just shows the usual "unverified app" warning.

The token can read and write all of the signed-in user's spreadsheets, not only this one. The code addresses only the configured ID, the token is kept only in memory and the tab's `sessionStorage`, and nothing from the sheet is ever inserted as HTML.

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
| `index.html` | The header and the five screens, all hidden by default. Loads `app.js` and `styles.css`. |
| `styles.css` | A phone layout for the workout screen. |
| `config.js` | The production and development configurations, the one active for this host, and a check for blank entries. |
| `auth.js` | Google sign-in: loads Google Identity Services, gets, renews and revokes the access token, keeps the token for the tab, and remembers the signed-in email. |
| `api.js` | Calls Google APIs with the access token, turns failures into typed errors, checks access to the spreadsheet, and reads and writes the year's tab. |
| `app.js` | Starts the app, switches between the screens and loads today's workout. |
| `today.js` | The workout screen: rendering, input handling, the save queue and the status line. |
| `workout.js` | Pure: today's exercises, prefill and the cells an edit writes. |
| `sheet-format.js` | Pure: the sheet's header, dates, weight and reps notation, and A1 ranges. |
| `package.json` | Marks the files as ES modules for Node and defines `npm test`. |
| `tests/` | The tests for `sheet-format.js` and `workout.js`. |
| `.gitignore` | Keeps `.claude/worktrees` out of commits, and so out of what Pages publishes. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. |
