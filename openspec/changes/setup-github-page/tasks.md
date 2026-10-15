# Tasks

## 1. Enable GitHub Pages

- [x] 1.1 (Manual, user, in the GitHub web UI) Confirm the repository is public, then go to Settings -> Pages and set Source to "Deploy from a branch", branch `main`, folder `/ (root)`. This changes only a repository setting and does not depend on the files in group 2. Until those files reach `main`, the site serves a placeholder or a 404. Verify that the Pages settings screen shows "Your site is live at `https://<owner>.github.io/<repo>/`" (this can take a few minutes).

## 2. Site files

- [x] 2.1 Create `index.html` at the repository root as specified in design.md ("Minimal but valid HTML"): doctype, `lang="en"`, UTF-8 charset, viewport meta, `<title>Gym Tracker</title>`, `<h1>Gym Tracker</h1>` and a one-line message, with no CSS or JS. Verify by opening the file directly in a browser: the tab reads "Gym Tracker" and the heading is visible.
- [x] 2.2 Create an empty `.nojekyll` file at the repository root. Verify that `git ls-files --others --exclude-standard` lists it, so it is not ignored and will be committed.
- [x] 2.3 Replace the empty `README.md` with a one-line description of Gym Tracker and a link to the live site. Build the link from the `origin` remote's owner and repo name in the form `https://<owner>.github.io/<repo>/`. Verify the file renders correctly in a Markdown preview and the link matches `git remote get-url origin`.

## 3. Publish

- [x] 3.1 Commit the files from group 2 on `main`. Do not push. Verify that `git log -1` shows the commit and `git status` reports a clean working tree.
- [ ] 3.2 (Manual, user) Push `main` to `origin`. Verify that `git log origin/main -1` shows the commit from 3.1 and that the `pages-build-deployment` run for it succeeds in the repository's Actions tab.

## 4. Live verification

These checks run against the deployed site after the push in 3.2, so they are checked off in a follow-up commit. Set `SITE` to the HTTPS URL shown in task 1.1.

- [ ] 4.1 Check the "Site is publicly reachable" requirement: `curl -sI "$SITE"` returns `HTTP/2 200`, and `curl -sI "${SITE/https:/http:}"` returns a 301 to the HTTPS URL.
- [ ] 4.2 Check the "Entry page identifies the app" requirement: open the URL in a browser (or private window) and confirm the tab title and heading both read "Gym Tracker".
- [ ] 4.3 Check that files are served as-is (the "Site publishes from the main branch" requirement): `curl -s "$SITE"` returns the committed `index.html` byte-for-byte, and `curl -s "${SITE}README.md"` returns raw Markdown rather than Jekyll-rendered HTML.

## Workflow follow-up

- Once group 4 passes, run `/opsx:archive` on `main`. It merges `specs/web-hosting` into `openspec/specs/` and moves this change to `openspec/changes/archive/`.
- Commit the checked-off tasks and the archive together. The user pushes to `main` manually.
