# Tasks

Worktree: exercise-icons

Groups 1–5 are implemented in the git worktree above, on branch `worktree-exercise-icons`. The branch starts at `4eda6c7` with no commits of its own and is brought up to `main` in group 1.
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 6 runs against the development sheet, never the real one. Restore every header cell you change for a check.
- **Reference:** `icons.svg` in this change shows every approved drawing in the three tile states.

## 1. Branch up to date

- [x] 1.1 In the worktree, run `git merge --ff-only main`. Verify that:
  - the branch head is `main`'s head (`ba3f675` or later), with the archived `exercise-tiles` and the assisted-exercise rule;
  - `npm test` passes before any change.

## 2. Icon data and lookup

- [x] 2.1 Add `splitAssisted(name)` to `workout.js` and use it for the `assisted` flag in `buildToday`, as in design.md ("Assisted exercises"). Keep the existing assisted tests unchanged. Add tests to `tests/workout.test.js`:
  - "Klimmzüge (assistiert)" gives base "Klimmzüge" and `assisted`;
  - "Klimmzüge(Assistiert)" and "Klimmzüge  (assistiert) " give the same;
  - "Latzug" gives base "Latzug" and not `assisted`.

  Verify that `npm test` passes.
- [x] 2.2 Add `icons.js` with `ICONS`, copied exactly from the appendix of design.md, and `iconFor(name)` as in design.md ("`icons.js`: data plus a lookup, no DOM"). Add `tests/icons.test.js` for:
  - the scenario "Exercise with an icon": each of the 16 names returns its entry, and `ICONS` has exactly these 16 keys;
  - "Different case": `LATZUG` returns Latzug's entry;
  - "Assisted exercise": `Latzug (assistiert)` returns Latzug's entry;
  - "Assisted Klimmzüge" and "Marker in another case": `Klimmzüge (assistiert)` and `Klimmzüge (Assistiert)` return the `assisted` variant, the one with the arrow;
  - "Klimmzüge without assistance": `Klimmzüge` returns the drawing without the arrow;
  - a name with a decomposed umlaut (`'Rückenheben'`) is found;
  - "Different spelling": `Klimmzug` and `Kniebeuge` return `null`;
  - "Every icon is different": no two drawings, the Klimmzüge variant included, have the same `d`;
  - every coordinate in `d`, `dots` and `rings`, the variant included, lies within 0–24.

  Verify that `npm test` passes.

## 3. Labels only for tiles without an icon

- [x] 3.1 Give `tileLabels` in `workout.js` the predicate `hasIcon`, defaulting to `() => false`, as in design.md ("Labels only for tiles without an icon"). Keep the existing label tests unchanged. Add tests to `tests/workout.test.js` for the scenarios of "Tile labels are unique":
  - "Plain label": Kniebeuge gives `Kn`;
  - "Name with several words": Schräges Bankdrücken gives `Sc`;
  - "Two names with the same first letters": Wadenheben, Wadenpresse give `Wa`, `Wd`;
  - "Repeated letters are skipped": … Wadenstrecker gives `We`;
  - "Icon tiles do not take labels": with `iconFor` as the predicate, Bankdrücken, Bauchmaschine, Bauchpresse give `null`, `null`, `Ba`.

  Also add:
  - "Different spelling": with `iconFor`, `Klimmzug` gives `Kl`;
  - with `iconFor`, `Klimmzüge (assistiert)` gives `null`.

  Verify that `npm test` passes.

## 4. Tiles show icons

- [x] 4.1 In `today.js`, give each item its `icon` from `iconFor(exercise.name)`, pass the predicate to `tileLabels`, and build the tile's `<svg>` with `createElementNS` as in design.md ("Rendering in `today.js`"). Tiles without an icon keep `textContent = label`. Verify on `localhost`:
  - "Exercise with an icon" and "Icon or label": the 16 exercises show icons and no letters, and every other exercise shows letters;
  - "Every icon is different": each icon tile shows a different icon;
  - "Assisted Klimmzüge": the development sheet's "Klimmzüge (assistiert)" shows the figure with the arrow. If the development sheet still names it differently, rename its pull-up column to "Klimmzüge (assistiert)" first, as the real sheet is;
  - "Accessible name": in DevTools' Accessibility pane, a done icon tile's name is "Latzug, done today", and the `<svg>` is not in the accessibility tree;
  - the header scenarios: temporarily change development header cells:
    - "Latzug" to "latzug": the icon stays ("Different case");
    - "Latzug" to "Latzug (assistiert)": Latzug's icon, no arrow ("Assisted exercise");
    - "Klimmzüge (assistiert)" to "Klimmzüge": the same figure without the arrow ("Klimmzüge without assistance");
    - "Klimmzüge (assistiert)" to "Klimmzug": the tile shows "Kl" ("Different spelling");
    - add an exercise "Bauchpresse" at the end of the header: the tile shows "Ba" ("Icon tiles do not take labels").

    Restore the header afterwards.
  - the console shows no errors.
- [x] 4.2 Add the icon size to `styles.css` as in design.md ("Size in the tile"). Verify in DevTools device mode at 360px and 430px width:
  - the icons are 32px, centred and not clipped;
  - the icons are visible on all three state colours ("Icon on a coloured tile");
  - the selection outline and the keyboard focus ring look as before.

  Also verify with DevTools' Rendering option "forced-colors: active" that the icons stay visible.
- [x] 4.3 Update `README.md` ("Tiles"):
  - which 16 exercises show icons;
  - that names match ignoring case and the "(assistiert)" marker, and that any other spelling shows letters;
  - that only assisted Klimmzüge show the assistance arrow;
  - that labels are only unique among tiles that show letters;
  - that a new icon is an entry in `icons.js` drawn by the rules in this change's design.

  Verify that the README describes each behaviour observed in 4.1.
- [x] 4.4 (Manual, user) On `localhost` at 360px width, with some tiles done and some improved, look at the tile grid next to `icons.svg`. Confirm that the icons look as approved, especially:
  - Brustpresse next to Ruderzug;
  - Schulterpresse next to Duale Schulterpresse;
  - the arrow on Klimmzüge (assistiert).

## 5. Integration and merge

- [x] 5.1 Run `npm test`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Open two icon tiles, among them Klimmzüge (assistiert), and one letter tile, and log sets in each.
  2. Reload the page.

  Verify that after the reload the tiles show the same icons, labels and states as before it, and that only today's row changed in the development sheet.
- [x] 5.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-exercise-icons`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 5.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `icons.js` matches the commit.

## 6. Live verification

These checks run against the deployed site after 5.3, so they are checked off in a follow-up commit.

- [x] 6.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in and check that:
  - the 16 exercises of the real sheet show icons, and any others show letters;
  - "Klimmzüge (assistiert)" shows the arrow.

  Open a few tiles without typing. Verify that the Network tab shows no `values:batchUpdate` and that the console shows no errors from this app's code.
- [x] 6.2 (Manual, user) At the next workout, log it with the app on the phone. Record in this task whether every icon was recognisable at a glance, and which ones, if any, were confused.

  Result (2026-10-26): used at the last workout; every icon was recognisable at a glance, none were confused.

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 6 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `exercise-icons` worktree and its `worktree-exercise-icons` branch once `main` contains them.
