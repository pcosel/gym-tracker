# google-sign-in Specification

## Purpose

Defines how a user signs in to Google from the static Gym Tracker page, and how the app obtains, holds, renews and revokes the access token it uses to call Google on that user's behalf.

## Requirements

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

### Requirement: Access token is kept only for the current tab
The app SHALL keep the access token in page memory and in the current tab's `sessionStorage`, together with its expiry time and the email it was issued for, under a key namespaced to Gym Tracker. It SHALL replace that entry whenever it gets a new token, and SHALL remove it when the user signs out or the session expires. It SHALL NOT write the token to `localStorage`, IndexedDB or cookies. Besides the token entry, it SHALL persist only the signed-in email, in `localStorage` under a Gym Tracker key.

#### Scenario: Browser storage after sign-in
- **WHEN** a user has signed in successfully
- **THEN** the tab's `sessionStorage` holds the access token, its expiry time and the signed-in email address under a key whose name identifies Gym Tracker
- **AND** `localStorage` holds the signed-in email address under a key whose name identifies Gym Tracker
- **AND** neither `localStorage`, IndexedDB nor cookies contain the access token

#### Scenario: A new token replaces the stored one
- **WHEN** the app gets a new access token, whether through sign-in, a silent restore or a renewal after HTTP 401
- **THEN** the tab's `sessionStorage` holds the new token and its expiry time in place of the previous ones

#### Scenario: A new tab does not get the token
- **WHEN** a signed-in user opens the site's URL in a new tab, for example from a home-screen shortcut
- **THEN** the new tab's `sessionStorage` holds no access token
- **AND** the session in that tab is restored as described in "Session is restored on reload when possible"

#### Scenario: Signing out removes the stored token
- **WHEN** a signed-in user selects "Sign out" or "Use a different account"
- **THEN** the tab's `sessionStorage` holds no access token

#### Scenario: An expired session removes the stored token
- **WHEN** a request to Google fails with HTTP 401 and the silent renewal fails
- **THEN** the tab's `sessionStorage` holds no access token
- **AND** `localStorage` still holds the remembered email address

### Requirement: Session is restored on reload when possible
On page load, if the tab holds a stored token that was issued for the remembered email address and is valid for more than five more minutes, the app SHALL use it and SHALL NOT contact Google for a token. Otherwise it SHALL discard any stored token. Then, if an email address is remembered, it SHALL try to get a new access token without showing Google's consent prompt. If no address is remembered, it SHALL NOT try. A failed attempt SHALL lead to the sign-in screen with no error message.

#### Scenario: Reload with a valid stored token
- **WHEN** a signed-in user reloads the page in the same tab while the stored token is valid for more than five more minutes
- **THEN** the app continues to the access check without requesting a token from Google
- **AND** no Google popup opens

#### Scenario: Stored token is about to expire
- **WHEN** the page loads, an account is remembered and the tab's stored token is valid for five minutes or less
- **THEN** the app discards the stored token
- **AND** tries to get a new token without the consent prompt, as in "Returning user with a live Google session"

#### Scenario: Stored token belongs to another account
- **WHEN** the page loads and the tab's stored token was issued for an email address other than the remembered one, or no email address is remembered, for example because the user signed out in another tab
- **THEN** the app discards the stored token without using it
- **AND** continues as if no token had been stored

#### Scenario: Stored token is rejected by Google
- **WHEN** the app uses a stored token at page load and Google rejects it with HTTP 401, for example because the grant was revoked from another tab
- **THEN** the app renews the token as described in "Expired token is renewed silently"

#### Scenario: Returning user with a live Google session
- **WHEN** a user who signed in earlier and did not sign out opens the site in a tab that holds no usable stored token, for example a new tab or a reload after the stored token ran out
- **AND** Google issues a new token without asking for consent
- **THEN** the app continues to the access check without the user selecting "Sign in with Google"

#### Scenario: Silent restore fails
- **WHEN** a remembered account exists and the tab holds no usable stored token, but Google does not issue a token silently, for example because the browser is signed out of Google
- **THEN** the app shows the sign-in screen without an error message

#### Scenario: Silent restore is blocked by the browser
- **WHEN** a remembered account exists, the tab holds no usable stored token and the browser is signed in to Google, but the browser blocks the silent request because no tap started it, as phone browsers do unless popups are allowed for the site
- **THEN** the app shows the sign-in screen without an error message
- **AND** one tap on "Sign in with Google" signs the remembered account in, as described in "A remembered account signs in with one tap"

#### Scenario: First visit
- **WHEN** a browser with no remembered account opens the site
- **THEN** the app shows the sign-in screen without contacting Google for a token

### Requirement: Expired token is renewed silently
When Google rejects a request because the access token is no longer valid, the app SHALL try once to get a new token without the consent prompt, then repeat the request. If renewal fails, the app SHALL return to the sign-in screen with a "session expired" message, unless the request was a save on the workout screen (see "Expired session during a save is recovered in place"). It SHALL keep the remembered account and the existing grant.

#### Scenario: Renewal succeeds
- **WHEN** a request to Google returns HTTP 401 and a silent renewal succeeds
- **THEN** the request is repeated once with the new token and its result is used as if the first attempt had succeeded

#### Scenario: Renewal fails
- **WHEN** a request to Google other than a save on the workout screen returns HTTP 401 and the silent renewal fails
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

### Requirement: Expired session during a save is recovered in place
If a save on the workout screen fails because the session expired and silent renewal failed, the app SHALL stay on the workout screen, keep the entered values and offer to sign in there. One tap SHALL sign in as described in "A remembered account signs in with one tap" and then repeat the save with the values on screen.

#### Scenario: Token expires during a workout
- **WHEN** the user leaves a set field on the workout screen more than an hour after signing in, and the phone blocks the silent renewal
- **THEN** the workout screen stays visible with the entered values and shows that the session expired and the changes are not saved
- **AND** it offers a control to sign in

#### Scenario: Signing in again saves the changes
- **WHEN** the user selects that control
- **THEN** the remembered account is signed in without the account chooser
- **AND** the values on screen are saved to the sheet without the user entering them again

#### Scenario: Signing in is cancelled
- **WHEN** the user closes Google's popup instead of signing in
- **THEN** the workout screen stays visible with the entered values and still offers to sign in
