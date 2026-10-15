# Design

## Context

The repository holds only an empty `README.md`, the OpenSpec scaffold (`openspec/`) and Claude Code tooling (`.claude/`). The GitHub Pages project URL is derived from the hosting repository: `https://<owner>.github.io/<repo>/`. The planning artifacts never hardcode the owner or repo name, so the project can move to another repository without editing them; only the README link would need updating. The GitHub CLI (`gh`) is not installed on the development machine, so repository settings must be changed in the GitHub web UI.

## Goals / Non-Goals

**Goals:**
- The smallest setup that puts a page live at the Pages URL and keeps it updated from `main`.
- A starting point the app can grow from without first changing the hosting setup.

**Non-Goals:**
- Styling, layout, JavaScript or any gym-tracking features.
- A build toolchain, package manager, linting or tests.
- A custom domain.
- Keeping `openspec/` or `.claude/` out of the published site.

## Decisions

### Plain HTML, no build step
The page is a hand-written `index.html`. With no build there is nothing to install, configure or break, and deploy-from-branch can serve the files directly.
- *Alternatives:* Vite (vanilla TS or React) or Jekyll. All three were rejected for now because each adds tooling that a hello-world page doesn't need. A build tool can come in a later change, but it would also require moving to GitHub Actions deployment (see below).

### Deploy from branch (`main`, root `/`), not GitHub Actions
Pages is configured in repository settings with source "Deploy from a branch", branch `main` and folder `/`. No workflow file is needed.
- *Alternative:* a GitHub Actions workflow (`actions/deploy-pages`). It is more flexible and supports a build step, but it is unnecessary while the site has no build. Switching later only means changing the Pages source setting and adding the workflow.

### Serve from the repository root, not `/docs`
`index.html` lives at the repository root so that paths are simple, for example `index.html` instead of `docs/index.html`.
- *Alternative:* `/docs`. It would have kept `openspec/`, `README.md` and `.claude/` off the published site. It was rejected in favor of simpler paths; the exposure is accepted below.

### Add `.nojekyll`
Branch deployments run Jekyll by default. Jekyll would render `README.md` and the `openspec/` markdown to HTML and skip any file or folder whose name starts with `_`. An empty `.nojekyll` file at the root turns this off, so files are served byte-for-byte. That is what the "served as-is" requirement in `specs/web-hosting/spec.md` relies on, and it skips a processing step that does nothing for a plain HTML app.

### Minimal but valid HTML
`index.html` has `<!doctype html>`, `<html lang="en">`, a UTF-8 charset, a `width=device-width` viewport meta tag (the app will mainly be used on phones), `<title>Gym Tracker</title>` and an `<h1>Gym Tracker</h1>` with a one-line message. There is no CSS and no JS.

## Risks / Trade-offs

- [Everything tracked in the repo is publicly served, including `openspec/` and `.claude/`] → This is accepted. The repository is expected to be public anyway, so nothing is exposed that isn't already readable on GitHub. Never commit secrets. If this becomes a problem, move the app to `/docs` and change the Pages folder setting.
- [Pages may be unavailable if the repo is private on a free plan] → Confirm the repository is public before enabling Pages (task 1.1).
- [The first deployment can take a few minutes, and browsers or the CDN may serve stale content] → Check the deployment status under the repository's Actions tab (Pages runs a `pages-build-deployment` job even for branch deploys) and hard-refresh before treating a check as failed.
- [Deploy-from-branch can't run a build] → This is acceptable while there is no build step. Adding a build tool later means switching to GitHub Actions deployment.

## Migration Plan

1. Enable Pages in Settings → Pages: "Deploy from a branch", `main`, `/ (root)`. This is only a repository setting, so it can happen before any code lands. Until then, the site serves a placeholder or a 404.
2. Implement and commit directly on `main`. The user then pushes manually, and the push triggers `pages-build-deployment`.
3. Once the deployment finishes, run the live checks against the site URL. Then archive the change in a follow-up commit on `main`. The change stays unarchived until the live checks pass, because archiving records the specs as true of the deployed system.

**Rollback:** Set Pages source to "None" (Settings → Pages) to unpublish, or revert the commit.
