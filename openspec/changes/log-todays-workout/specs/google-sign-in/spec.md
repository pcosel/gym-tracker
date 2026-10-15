# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
