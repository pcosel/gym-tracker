# Proposal

## Why

Gym Tracker will be a static web app, but the repository has no code and nothing is published yet. Setting up GitHub Pages hosting now, with a minimal page, proves the publish path end to end before any features are built, so each later change can ship by pushing to `main`.

## What Changes

- Add a minimal `index.html` at the repository root: a "hello world" page titled "Gym Tracker" with no styling, scripts or features.
- Add a `.nojekyll` marker so GitHub Pages serves files as-is instead of running them through Jekyll.
- Configure GitHub Pages to deploy from the `main` branch, root folder (`/`). This is a one-time manual step in the repository settings.
- Fill in the empty `README.md` with a one-line description and the live site URL.

## Capabilities

### New Capabilities
- `web-hosting`: How and where the Gym Tracker web app is published and reached by users (public URL, source branch and folder, entry page).

### Modified Capabilities
<!-- None: no specs exist yet. -->

## Impact

- **New files**: `index.html`, `.nojekyll` at the repository root.
- **Modified files**: `README.md`.
- **Repository settings**: GitHub Pages is enabled with source "Deploy from a branch", branch `main`, folder `/`.
- **Public exposure**: Serving from the root publishes every tracked file at the site URL, including `README.md`, `openspec/` and `.claude/`. This was an accepted trade-off for simpler paths (see design.md).
- **Dependencies**: None. There is no build step, package manager or CI workflow.
- **Prerequisite**: On a free GitHub plan, Pages requires the repository to be public.
