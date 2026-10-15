# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Access token is held in memory only`
- TO: `### Requirement: Access token is kept only for the current tab`

## MODIFIED Requirements

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
