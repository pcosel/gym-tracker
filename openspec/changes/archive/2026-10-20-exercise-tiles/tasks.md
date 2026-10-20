# Tasks

Worktree: add-styling

Groups 1–5 and 7 are implemented in the git worktree above, on branch `worktree-add-styling`. It matches `main` when this change starts (`aa6737e`) and again when group 7 starts (`4eda6c7`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 6 runs against the development sheet, never the real one.
- **Previous workout:** several checks need an exercise with a "last time". Use one the development sheet already has, or type an earlier dated row into the development sheet by hand.

## 1. Tile labels

- [x] 1.1 Add `tileLabels(names)` to `workout.js` as in design.md ("Tile labels"). Add tests to `tests/workout.test.js` for:
  - the scenarios "Plain label" (Latzug → `La`), "Name with several words" (Duale Schulterpresse → `Du`), "Two names with the same first letters" (Bankdrücken, Bauchmaschine → `Ba`, `Bu`) and "Repeated letters are skipped" (… Bauchpresse → `Bc`);
  - case handling: a lower-case name `übung` gives `Üb`, and `BAnk` after `Bank` counts as taken;
  - non-letters are skipped: `1-Arm Rudern` gives `Ar`;
  - the edge cases from design.md: a one-letter name gives one letter, and a name with no letters gives its first two characters;
  - every pair taken: the label falls back to the first two letters.

  Verify that `npm test` passes.

## 2. Progress state

- [x] 2.1 Add `progressOf(cells, last)` to `workout.js` as in design.md ("Progress state"). Build `last` in the tests with `buildToday` on a made-up tab, as the existing tests do. Add tests for:
  - every scenario of "'Improved' means a set beats the same set last time": "More reps at the same weight", "More weight", "Less weight with more reps", "Equal to last time", "Own weight of a set", "Extra set beyond last time", "Never done before" and "Unreadable entry last time";
  - the "done" scenarios: "Weight only" (`"80"`, `""` → `none`), "Unreadable reps today" (`"?, 9, 7"` → `done`), and empty cells (`none`);
  - a set without any weight, today or last time, counting as 0 kg: `""` and `"12"` against last `""` and `"10"` gives `improved`;
  - an unreadable weight today (`"25 (Seil)"`, `"10"`) giving `done`, never `improved`.

  Verify that `npm test` passes.

## 3. Workout screen structure and behaviour

- [x] 3.1 Restructure `#workout` in `index.html` as in design.md ("Screen layout"):
  - `#summary` holds the counter element, `#save-status`, `#save-retry` and `#save-signin`;
  - `#tiles` is a `role="group"` with `aria-label="Exercises"`;
  - `#editor` replaces `#exercises`;
  - `#add-select` is removed.

  Verify that `localhost` loads with no console errors, and that the scenario "New year without a tab" (temporarily rename the development sheet's tab "2026") shows the message and no tiles, counter or editor. Rename the tab back afterwards.
- [x] 3.2 In `today.js`, build the tiles in `startWorkout` from `tileLabels` and `progressOf` (today's cells, or empty text when `exercise.today` is `null`). Add `renderTile(item)` for `data-state`, `aria-pressed`, `aria-label` and `title`. Remove `shown`, `insertExercise`, `renderAddChoices` and `onAddExercise`. All sheet text goes in through `textContent` or attributes. Verify on `localhost`:
  - "Tiles for every exercise": one tile per header exercise, in header order;
  - "Workout already started": exercises with values today show their state, and all others show "not done";
  - "No workout yet today": every tile shows "not done";
  - "Accessible name": in DevTools' Accessibility pane, a done tile's name is the full name followed by "done today";
  - "Header that looks like markup": temporarily put `<b>Latzug</b>` in a development header cell. The tile's `title` and the editor heading show the characters literally. Restore the header afterwards.
- [x] 3.3 Implement selection as in design.md ("Rendering and selection"): blur a focused editor input first, rebuild `#editor` with `buildExercise`, update `aria-pressed`, scroll the editor into view, and show the hint when nothing is selected. Verify on `localhost` with the Network tab open:
  - "Nothing open on load";
  - "Opening an exercise not done today": prefilled, and no `values:batchUpdate`;
  - "Opening an exercise done today";
  - "Weight without reps";
  - "Switching exercises": type a set in Latzug and tap Brustpresse's tile without leaving the field first. Exactly one `values:batchUpdate` writes Latzug, and reopening Latzug shows the value.
- [x] 3.4 In `onChange`, update `item.progress` from `cellsFor` when it is `ok`, then call `renderTile` and `renderCounter` before queuing the save. Implement `renderCounter` with "1 exercise done today" and "N exercises done today". Verify on `localhost`:
  - "Colour changes with the first set";
  - "Colour changes with an improvement";
  - "Invalid input": the tile keeps its colour;
  - "Weight only": the tile stays "not done";
  - "Reps removed again": deleting the only set returns the tile to "not done";
  - "Counting" and "Nothing done yet": the counter follows each step.
- [x] 3.5 Keep `renderStatus` writing into `#summary`. Verify "Failure after switching exercises": in DevTools, set the network to Offline, enter a set in Latzug, open Brustpresse, and check that "Not saved" and "Retry" are visible. Go back online, press Retry, and check that the sheet holds Latzug's values.
- [x] 3.6 Update `README.md` ("Workout screen"):
  - the tiles and their labels;
  - the three colours and what "done" and "improved" mean;
  - the counter;
  - that the save status sits in the summary line.
  
  Remove the mention of the add selector. Verify that the README describes each behaviour observed in 3.2–3.5.

## 4. Visual design

- [x] 4.1 Rewrite `styles.css` with the tokens and base styles from design.md ("Visual system"): page, header, typography, buttons, fields, the invalid-field style and `:focus-visible`. Restyle the sign-in, checking, denied and config screens with the card and button styles, without changing their content. Verify on `localhost` that each of those screens renders with the new styling (sign out to reach sign-in, and use the "Use a different account" path for denied if one is available), with no console errors.
- [x] 4.2 Style the summary line and the tile grid:
  - the three `data-state` colours;
  - the selection ring on `aria-pressed="true"`;
  - the colour transition, off under `prefers-reduced-motion`.

  Verify in DevTools device mode at 360 px and 430 px width that the tiles are square, have no horizontal scroll, and that all three states and the selection are distinguishable. Also check, with DevTools' "Emulate vision deficiencies" set to deuteranopia, that "done" and "improved" still look different.
- [x] 4.3 Style the editor card:
  - the `#`, `kg` and `reps` header row aligned with the set grid;
  - the borderless "×";
  - the full-width secondary "+ Set";
  - the hint text.

  Verify at 360 px width that each set row fits on one line, that inputs are at least 16 px, and that buttons and fields are at least 44 px tall in the Computed pane.
- [x] 4.4 Verify the contrast and keyboard check on `localhost`:
  - Lighthouse's Accessibility audit reports no colour-contrast failures;
  - tabbing reaches every tile, then the editor fields;
  - Enter or Space opens a tile;
  - the focus ring is visible on tiles, fields and buttons.

## 5. Integration and merge

- [x] 5.1 Run `npm test`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Open three exercises and log sets, beating last time in one of them.
  2. Reload the page.

  Verify that after the reload the tiles and the counter show the same states as before it, and that only today's row changed in the development sheet.
- [x] 5.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-add-styling`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 5.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `today.js` matches the commit.

## 6. Live verification

These checks run against the deployed site after 5.3, so they are checked off in a follow-up commit.

- [x] 6.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in, and check that the tiles and counter show the real sheet's state for today. Open a few tiles without typing. Verify that the Network tab shows no `values:batchUpdate` and that the console shows no errors from this app's code.
- [x] 6.2 (Manual, user) At the next workout, log it with the app on the phone. Record in this task:
  - whether the tile colours matched what you expected, especially "improved";
  - whether switching tiles with the keyboard open saved the field you were in;
  - whether the two-letter labels were workable until icons arrive.

  First finding: "improved" did not match expectations. At the same weight, `9, 9, 9 → 11, 8, 8` turned green although two sets got worse, and `9, 11, 9 → 11, 9, 9` turned green for the same sets in another order. Group 7 replaces the rule, so check the colours again after 7.5. The other two checks are still open.

## 7. "Improved" by total reps, and assisted exercises

The first workout showed that comparing sets by position is too generous (see 6.2). These tasks replace that rule with the spec's "'Improved' means more reps, heaviest weight first" and "'Improved' needs readable cells both times". They also add "Assisted exercises improve with less weight". All three are implemented as in design.md ("Progress state" and "Assisted exercises").

- [x] 7.1 Rewrite `progressOf` in `workout.js` as in design.md ("Progress state" and "Assisted exercises"):
  - add the `assisted` flag to each exercise in `buildToday`;
  - add the `assisted` parameter to `progressOf`;
  - pass `item.exercise.assisted` at both `progressOf` calls in `today.js`.

  Update the progress tests in `tests/workout.test.js`:
  - replace the position-based tests with one test per scenario of the three requirements on "improved";
  - test that `buildToday` sets `assisted` for "Klimmzüge (assistiert)" and "Dips (Assistiert)", and not for "Assisted Pullups";
  - four existing tests change their result:
    - "Workout in progress": `9, 7, 8` → `9, 8` is now `done`, and `9, 8, 8` is `improved`;
    - "Own weight of a set" uses the new scenario;
    - "Extra set" is now `improved`;
    - "Unreadable entry last time": `1, 10, 7` is now `done`.
  - keep the tests for "done", for a set without any weight counting as 0 kg, and for an unreadable weight today.

  Verify that `npm test` passes.
- [x] 7.2 Update the green bullet in `README.md` ("Workout screen") to the new rule: reps are added up per weight and compared from the heaviest weight down, so the order of the sets does not matter and an extra set counts. Add that for an exercise with "(assistiert)" in its name, the weight is the assistance, so less weight counts as better and an empty weight means no assistance. Remove the sentence about positions. Verify that it matches the spec.
- [x] 7.3 Verify on `localhost` against the development sheet. Give Latzug a last time of "75" and "10, 10, 10" and no values today, then:
  - "Workout in progress": entering 10, 10 and 10, leaving the field after each, keeps its tile blue;
  - "Colour changes with an improvement": a fourth set of 1 turns it green;
  - deleting the fourth set turns it blue again, and so does changing the sets to 12, 9, 9;
  - after a reload, the tile shows the same state as before it.

  Then rename the development sheet's pull-up column, or another column, to "Klimmzüge (assistiert)". Give it a last time of "30" and "8, 8, 8" and no values today, then:
  - "Less assistance": weight 25 with sets 6, 6, 5 turns its tile green;
  - changing the weight to 35 turns it blue;
  - its tile label is "Kl", and its editor heading shows the full name.
- [x] 7.4 Run `npm test`. Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-add-styling`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 7.5 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `workout.js` matches the commit.
- [x] 7.6 (Manual, user) In the real sheet's 2026 tab, rename "Assisted Pullups" to "Klimmzüge (assistiert)". The renaming itself can happen at any time, because the app before 7.5 treats the renamed column as a normal exercise. After 7.5, verify in the app that its tile shows "Kl", and that a weight below last time's with the same reps would turn it green.

## Workflow follow-up

- Once groups 6 and 7 pass, run `/opsx:archive` on `main`. It applies the delta to `specs/todays-workout` and moves this change to `openspec/changes/archive/`.
- Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `add-styling` worktree and its `worktree-add-styling` branch once `main` contains them.
