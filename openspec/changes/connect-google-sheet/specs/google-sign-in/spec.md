# Spec Delta

## Purpose

Defines how a user signs in to Google from the static Gym Tracker page, and how the app obtains, holds, renews and revokes the access token it uses to call Google on that user's behalf.

## ADDED Requirements

### Requirement: Sign-in grants read and write access to spreadsheets
The app SHALL let the user sign in with a Google account from the sign-in screen. A successful sign-in SHALL grant the app read and write access to the user's Google Sheets spreadsheets and the account's email address. It SHALL NOT grant access to other Google Drive files.

#### Scenario: First sign-in
- **WHEN** a user who has not used the app before selects "Sign in with Google" and approves Google's consent prompt
- **THEN** the access token the app receives carries the scopes `openid`, `https://www.googleapis.com/auth/userinfo.email` and `https://www.googleapis.com/auth/spreadsheets`
- **AND** it carries no `https://www.googleapis.com/auth/drive*` scope

#### Scenario: Sign-in is cancelled
- **WHEN** the user closes Google's sign-in popup or declines the consent prompt
- **THEN** the app stays on the sign-in screen and shows a message that sign-in did not complete
- **AND** the "Sign in with Google" control can be used again

### Requirement: A remembered account signs in with one tap
When an email address from an earlier session is remembered, selecting "Sign in with Google" SHALL request a token for that account without showing Google's account chooser. While the earlier grant is still in place, it SHALL also skip the consent prompt. When no address is remembered, Google's account chooser SHALL be shown.

#### Scenario: Remembered account
- **WHEN** an account is remembered, the browser is still signed in to that Google account and the earlier grant is still in place
- **AND** the user selects "Sign in with Google"
- **THEN** Google's popup closes by itself without the user choosing an account or approving consent
- **AND** the app continues to the access check

#### Scenario: No remembered account
- **WHEN** no account is remembered, for example on a first visit or after signing out
- **AND** the user selects "Sign in with Google"
- **THEN** Google shows its account chooser

### Requirement: Access token is held in memory only
The app SHALL keep the access token in page memory only and SHALL NOT write it to `localStorage`, `sessionStorage`, IndexedDB or cookies. The only value it SHALL persist across reloads is the signed-in email address, stored under a key namespaced to Gym Tracker.

#### Scenario: Browser storage after sign-in
- **WHEN** a user has signed in successfully
- **THEN** none of the site origin's browser storage contains the access token
- **AND** `localStorage` holds the signed-in email address under a key whose name identifies Gym Tracker

### Requirement: Session is restored on reload when possible
On page load, if an email address from an earlier session is remembered, the app SHALL try to get a new access token without showing Google's consent prompt. If no address is remembered, it SHALL NOT try. A failed attempt SHALL lead to the sign-in screen with no error message.

#### Scenario: Returning user with a live Google session
- **WHEN** a user who signed in earlier and did not sign out reloads the page
- **AND** Google issues a new token without asking for consent
- **THEN** the app continues to the access check without the user selecting "Sign in with Google"

#### Scenario: Silent restore fails
- **WHEN** a remembered account exists but Google does not issue a token silently, for example because the browser is signed out of Google
- **THEN** the app shows the sign-in screen without an error message

#### Scenario: Silent restore is blocked by the browser
- **WHEN** a remembered account exists and the browser is signed in to Google, but the browser blocks the silent request because no tap started it, as phone browsers typically do
- **THEN** the app shows the sign-in screen without an error message
- **AND** one tap on "Sign in with Google" signs the remembered account in, as described in "A remembered account signs in with one tap"

#### Scenario: First visit
- **WHEN** a browser with no remembered account opens the site
- **THEN** the app shows the sign-in screen without contacting Google for a token

### Requirement: Expired token is renewed silently
When Google rejects a request because the access token is no longer valid, the app SHALL try once to get a new token without the consent prompt, then repeat the request. If renewal fails, the app SHALL return to the sign-in screen with a "session expired" message. It SHALL keep the remembered account and the existing grant.

#### Scenario: Renewal succeeds
- **WHEN** a request to Google returns HTTP 401 and a silent renewal succeeds
- **THEN** the request is repeated once with the new token and its result is used as if the first attempt had succeeded

#### Scenario: Renewal fails
- **WHEN** a request to Google returns HTTP 401 and the silent renewal fails
- **THEN** the app shows the sign-in screen with a message that the session expired
- **AND** the remembered email address is still stored
- **AND** one tap on "Sign in with Google" signs that account back in without the account chooser

### Requirement: User can sign out
Every screen shown to a signed-in user SHALL offer a way to sign out. Signing out SHALL revoke the app's grant with Google, discard the access token, forget the remembered email address and show the sign-in screen.

#### Scenario: Signing out
- **WHEN** a signed-in user selects "Sign out"
- **THEN** the app shows the sign-in screen
- **AND** the remembered email address is removed from browser storage

#### Scenario: Reload after signing out
- **WHEN** a user who signed out reloads the page
- **THEN** the app shows the sign-in screen without trying to restore the session

#### Scenario: Signing in after signing out
- **WHEN** a user who signed out signs in again
- **THEN** Google asks for consent again, because the previous grant was revoked
