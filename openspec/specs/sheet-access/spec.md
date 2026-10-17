# sheet-access Specification

## Purpose

Binds Gym Tracker to the single Google Sheet that holds the user's gym data. Defines how the app checks it can reach that sheet, and what the user sees when the app is connected, denied access or not configured.

## Requirements

### Requirement: App is bound to one configured spreadsheet
The app SHALL have a production configuration and a development configuration, each holding an OAuth client ID and a spreadsheet ID. A page served from `localhost` SHALL use the development configuration, and a page served from any other address the production one. The app SHALL work against exactly the one spreadsheet of the active configuration. Both configurations SHALL ship in page source. Whether an account can reach a sheet SHALL depend only on that sheet's Google Drive sharing settings.

#### Scenario: Requests target the configured sheet
- **WHEN** a signed-in user uses the app
- **THEN** every request the app makes to the Google Sheets API addresses the active configuration's spreadsheet ID
- **AND** the app offers no way to choose a different spreadsheet

#### Scenario: Live site uses the production sheet
- **WHEN** a signed-in user uses the app at `https://<owner>.github.io/<repo>/`
- **THEN** every request the app makes to the Google Sheets API addresses the production spreadsheet ID

#### Scenario: Local run uses the development sheet
- **WHEN** a signed-in user uses the app at `http://localhost:8000`
- **THEN** every request the app makes to the Google Sheets API addresses the development spreadsheet ID
- **AND** no request addresses the production spreadsheet ID

### Requirement: Missing configuration is reported
If the OAuth client ID or the spreadsheet ID of the active configuration is blank, the app SHALL show a "Not configured" screen that names the active configuration and each of its blank settings. It SHALL NOT load Google sign-in or make any request to Google.

#### Scenario: Spreadsheet ID left blank
- **WHEN** the site is loaded with a blank spreadsheet ID and a filled-in client ID in the active configuration
- **THEN** the app shows the "Not configured" screen listing the spreadsheet ID setting, and not the client ID
- **AND** the browser makes no network request to any Google domain

#### Scenario: Development sheet not set yet
- **WHEN** the site is loaded at `http://localhost:8000` while the development spreadsheet ID is blank and the production configuration is complete
- **THEN** the app shows the "Not configured" screen naming the development configuration and its spreadsheet ID setting
- **AND** the browser makes no network request to any Google domain

#### Scenario: Blank development settings do not affect the live site
- **WHEN** the site is loaded at `https://<owner>.github.io/<repo>/` while the development spreadsheet ID is blank and the production configuration is complete
- **THEN** the app does not show the "Not configured" screen

### Requirement: Access to the sheet is checked after sign-in
After a successful sign-in or session restore, the app SHALL request the configured spreadsheet's metadata before showing anything from the sheet. It SHALL show a progress indication while that request is in flight.

#### Scenario: Check runs after sign-in
- **WHEN** a user completes sign-in
- **THEN** the app shows a progress indication and requests the configured spreadsheet's metadata from the Google Sheets API

### Requirement: Connected screen shows the sheet
When the access check succeeds, the app SHALL show the spreadsheet's title, and the signed-in email address next to the "Sign out" control.

#### Scenario: Owner signs in
- **WHEN** the account that owns the configured spreadsheet signs in
- **THEN** the app shows the spreadsheet's title as it appears in Google Sheets
- **AND** it shows the signed-in email address next to a "Sign out" control

### Requirement: Account without access is told so
If Google answers the access check with "not found" (HTTP 404) or "permission denied" (HTTP 403), the app SHALL show a no-access screen. The screen SHALL name the signed-in account, use wording that covers both a missing sheet and an unshared one, and offer a control to sign out and use a different account.

#### Scenario: Account the sheet is not shared with
- **WHEN** a Google account that the configured spreadsheet is not shared with signs in
- **THEN** the app shows the no-access screen naming that account
- **AND** it shows nothing from the spreadsheet, not even its title

#### Scenario: Switching to a different account
- **WHEN** the user selects "Use a different account" on the no-access screen
- **THEN** the app signs out as described in the google-sign-in capability and shows the sign-in screen

### Requirement: Other access-check failures are reported
If the access check fails for any other reason, such as a network error, rate limiting (HTTP 429) or a Google server error (HTTP 5xx), the app SHALL return to the sign-in screen with a message that describes the failure. Signing in again SHALL repeat the access check.

#### Scenario: Google is temporarily unavailable
- **WHEN** the access check receives HTTP 503
- **THEN** the app shows the sign-in screen with a message saying Google is unavailable and to try again shortly
- **AND** completing sign-in again repeats the access check
