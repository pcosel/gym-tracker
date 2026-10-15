# Proposal

## Why

The user already tracks their gym data in a Google Sheet, and Gym Tracker is meant to become a nicer frontend for that sheet rather than a separate store. Before any workout data can be read or logged, the static page has to sign the user in with Google and reach that one sheet. This change builds that foundation and nothing else. It also requests read and write access now, so that the later features that write to the sheet do not need a second consent.

## What Changes

- Add Google sign-in with Google Identity Services (GIS). The browser gets a short-lived OAuth access token and calls the Google Sheets REST API with it directly. There is no backend and no client secret.
- Request read and write access to spreadsheets (`auth/spreadsheets`) plus the account's email address. No Drive scope is requested. One known sheet is reached by its ID, so listing or copying Drive files is never needed.
- Keep the access token in memory only. Remember just the signed-in email address, under a key specific to this app, so a reload can restore the session silently. Phone browsers are likely to block that silent restore. When they do, signing back in takes a single tap, with no account chooser.
- Hard-code the OAuth client ID and the spreadsheet ID in a public `config.js`. Neither is a secret: the sheet is private in Google Drive, and its sharing settings are the security boundary.
- After sign-in, check access by reading the spreadsheet's metadata. Show one of these screens:
  - **Connected**: the sheet's title, with the signed-in account shown next to "Sign out".
  - **No access**: for an account the sheet is not shared with.
  - **Not configured**: when an ID is still blank.
- Add sign-out, and silent recovery from an expired token.
- Turn `index.html` from a placeholder into the screens above. They are driven by plain ES modules (`config.js`, `auth.js`, `api.js`, `app.js`) with no build step.
- Document the one-time Google Cloud setup (a new project, the Sheets API, the OAuth consent screen, the OAuth client) and how to run the site locally in `README.md`.

**Out of scope:** reading or displaying workout data, writing to the sheet, visual design beyond what the screens need to be usable, development overrides that point a local run at a copy of the sheet, Google Picker, and support for more than one sheet or user.

## Capabilities

### New Capabilities
- `google-sign-in`: How the user signs in to Google from the static page, and how the access token is obtained, held, renewed and revoked. This includes the scopes requested, silent session restore, expiry recovery and sign-out.
- `sheet-access`: Which spreadsheet the app is bound to and how it is configured. Also covers how access to the sheet is checked, and what the user sees when the app is connected, denied access or not configured.

### Modified Capabilities
<!-- None. web-hosting's requirements still hold: the page keeps the "Gym Tracker" title and heading, and plain ES modules need no build step. -->

## Impact

- **New files**: `config.js`, `auth.js`, `api.js` and `app.js` at the repository root. There is also a `.gitignore` that excludes `.claude/worktrees/`, so a git worktree used for implementation is never committed (and so never published by Pages).
- **Modified files**: `index.html` gains the app's screens and loads `app.js` as a module. `README.md` gains sections on how the site works, Google Cloud setup and running it locally.
- **External services**: A new Google Cloud project with the Google Sheets API enabled, an OAuth consent screen (External, Testing status, the user as a test user) and an OAuth client of type "Web application". Its authorised JavaScript origins are the Pages origin `https://<owner>.github.io` and `http://localhost:8000`. These are one-time manual steps for the user.
- **Runtime dependency**: The GIS client script, loaded from `accounts.google.com` at run time. There is still no package manager and no build step.
- **Public exposure**: The client ID and spreadsheet ID become publicly readable in page source and in the repository. This was accepted: the sheet is private in Drive, so knowing its ID grants nothing.
- **Shared origin**: The site shares its origin (`https://<owner>.github.io`) with every other project site of the same owner. This is why the token is never written to browser storage.
