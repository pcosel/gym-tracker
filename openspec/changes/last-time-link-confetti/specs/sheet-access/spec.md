# Spec Delta

## MODIFIED Requirements

### Requirement: Connected screen shows the sheet
When the access check succeeds, the app SHALL show the spreadsheet's title, and the signed-in email address next to the "Sign out" control. The title SHALL be a link that opens the active configuration's spreadsheet in Google Sheets in a new browser tab. The link SHALL open on the current year's tab when the spreadsheet has one, and without choosing a tab otherwise.

#### Scenario: Owner signs in
- **WHEN** the account that owns the configured spreadsheet signs in
- **THEN** the app shows the spreadsheet's title as it appears in Google Sheets
- **AND** it shows the signed-in email address next to a "Sign out" control

#### Scenario: Opening the sheet
- **WHEN** the device date is 15.10.2026, the spreadsheet has a tab "2026", and the user selects the spreadsheet's title
- **THEN** Google Sheets opens the spreadsheet on the tab "2026" in a new browser tab
- **AND** the workout screen stays open in its own tab, with every entered value

#### Scenario: Year tab is missing
- **WHEN** the device date is 02.01.2027, the spreadsheet has no tab "2027", and the user selects the spreadsheet's title
- **THEN** Google Sheets opens the spreadsheet in a new browser tab, without choosing a tab

#### Scenario: Local run opens the development sheet
- **WHEN** the user selects the spreadsheet's title at `http://localhost:8000`
- **THEN** the link opens the development spreadsheet, not the production one
