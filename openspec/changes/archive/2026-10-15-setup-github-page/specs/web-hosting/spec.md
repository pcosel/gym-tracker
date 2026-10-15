# Spec Delta

## Purpose

Defines where the Gym Tracker web app is published, how changes reach the live site, and what a visitor sees when they open it.

## ADDED Requirements

### Requirement: Site is publicly reachable
The Gym Tracker web app SHALL be publicly reachable over HTTPS at the GitHub Pages project URL of the repository that hosts it (`https://<owner>.github.io/<repo>/`), without authentication.

#### Scenario: Visitor opens the site URL
- **WHEN** a visitor who is not signed in to GitHub requests the site URL over HTTPS
- **THEN** the server responds with HTTP 200 and an HTML page

#### Scenario: Plain HTTP is upgraded
- **WHEN** a visitor requests the site URL over plain HTTP
- **THEN** they are redirected to the HTTPS URL

### Requirement: Entry page identifies the app
The page served at the site root SHALL identify the app as "Gym Tracker" in both the document title and a visible heading.

#### Scenario: Visitor sees the app name
- **WHEN** a visitor opens the site URL in a browser
- **THEN** the browser tab title is "Gym Tracker"
- **AND** the page shows a heading reading "Gym Tracker"

### Requirement: Site publishes from the main branch
The live site SHALL reflect the contents of the repository root on the `main` branch, served as-is with no build or transformation step.

#### Scenario: Change pushed to main goes live
- **WHEN** a commit that changes `index.html` is pushed to `main`
- **AND** the resulting GitHub Pages deployment completes
- **THEN** the site URL serves the updated `index.html`

#### Scenario: Other branches do not affect the site
- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** the content served at the site URL does not change
