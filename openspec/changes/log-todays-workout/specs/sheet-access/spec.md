# Spec Delta

## MODIFIED Requirements

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
