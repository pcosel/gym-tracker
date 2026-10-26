# Tasks

Worktree: highlight-last-workout

Groups 1–4 are implemented in the git worktree above, on branch `worktree-highlight-last-workout`, which starts at `main`'s head (`6ca8262`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 5 runs against the development sheet, never the real one. Restore every cell you change for a check, and delete any row for today that a check creates.

## 1. Branch up to date

- [ ] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, for example by archiving `exercise-icons`, rebase the branch onto `main`. Verify that `npm test` passes before any change.

## 2. The last workout

- [ ] 2.1 In `workout.js`, make `buildToday` parse the header once, and add `lastWorkoutRow` and each exercise's `doneLastWorkout`, as in design.md ("Find the last workout in `buildToday`, from the reps cells"). Update the comment above `buildToday` to describe the new fields. Keep the existing tests unchanged. Add tests to `tests/workout.test.js`, using the existing `tab()` rows unless stated otherwise:
  - "Previous workout": `tab()` gives `lastWorkoutRow` 5. Bankdrücken and Latzug are done in it. Bizepsmaschine (weight only), Beinpresse (reps only in the carry-over row) and Duale Schulterpresse are not;
  - "Workout already started": with `['15.10.2026', '', '', '75', '10']` added, `lastWorkoutRow` is still 5;
  - "Row without reps is skipped": with a row `13.10.2026` holding only a Bizepsmaschine weight, and a row holding only `14.10.2026`, `lastWorkoutRow` is 5 and Bizepsmaschine is not done in it;
  - a row without a date is never the last workout: with `['', '', '', '60', '5, 5, 5']` added, `lastWorkoutRow` is 5;
  - "Exercise skipped in the last workout": with `['13.10.2026', '', '', '75', '10']` added, `lastWorkoutRow` is 6 and Latzug is done in it. Bankdrücken is not, while its `last.row` is still 5;
  - "Unreadable reps in the last workout": with `['13.10.2026', '', '', '', '?, 9, 7']` added, Latzug is done in row 6. With `['13.10.2026', '', '', '', '?']` added, Latzug is still done in row 6, while its `last.row` stays 5;
  - "Start of a year": `[HEADER, ['2026', '', '', '70', '8, 8, 8']]` gives `lastWorkoutRow` `null` and no exercise done in it. So does the same tab with a row for today below;
  - without a carry-over row, row 2 can be the last workout: `[HEADER, ['12.10.2026', '', '', '70', '8']]` gives `lastWorkoutRow` 2.

  Verify that `npm test` passes.

## 3. Tiles show the border

- [ ] 3.1 In `today.js`, have `renderTile` set `data-last-workout` and extend the accessible name, as in design.md ("A data attribute, styled together with the state" and "Accessible name"). Add the border rule to `styles.css`. Verify on `localhost`, on a day without a row for today in the development sheet:
  - "Done in the last workout, not yet today" and "Not done in the last workout": the tiles with a blue border are exactly the exercises with reps in the lowest dated row with reps. Compare against the sheet;
  - "The counter counts only today": on load, the counter shows 0 exercises done today;
  - "Selected tile": a selected bordered tile shows both the border and the selection outline;
  - "Accessible name": in DevTools' Accessibility pane, a bordered tile's name is, for example, "Latzug, not done today, done in the last workout";
  - "Done again today": entering a first set on a bordered tile and leaving the field turns it blue, and its name becomes "Latzug, done today";
  - "Reps removed again": deleting that set makes the tile white with the border again;
  - "Workout already started": log a set on any tile so that today's row exists, then reload. The same tiles as before show the border, unless they are done today;
  - the console shows no errors.

  "No last workout" is covered by the tests in 2.1.
- [ ] 3.2 In DevTools device mode at 360px and 430px width, verify that:
  - the border is 2px in the "done" blue;
  - a bordered tile has the same size as a plain one, and its icon or label sits in the same place;
  - keyboard focus (Tab) on a bordered tile, selected or not, can still be told apart from the border.

  With DevTools' Rendering option "forced-colors: active", verify that bordered tiles still show a thicker border.
- [ ] 3.3 Update `README.md` ("Tiles"):
  - a white tile with a blue border is not done today but was done in the last workout;
  - what the last workout is: the nearest dated row above today's row with any reps;
  - why it differs from "last time";
  - that there is no border at the start of a year, because the carry-over row does not count;
  - that the counter still counts only blue and green tiles.

  Verify that the README describes each behaviour observed in 3.1.
- [ ] 3.4 (Manual, user) On `localhost` at 360px width, with some tiles bordered, some done and some improved, confirm that a bordered tile is easy to tell apart from a plain white tile and from a blue one. If the 2px width is not right, change it in `styles.css` and design.md before group 4.

## 4. Integration and merge

- [ ] 4.1 Run `npm test`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Note which tiles show the border.
  2. Log sets in one bordered and one plain tile.
  3. Reload the page.

  Verify that after the reload, both logged tiles are filled and every other tile shows the border exactly as before. Also verify that only today's row changed in the development sheet.
- [ ] 4.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-highlight-last-workout`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [ ] 4.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `today.js` matches the commit.

## 5. Live verification

These checks run against the deployed site after 4.3, so they are checked off in a follow-up commit.

- [ ] 5.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in and check that the bordered tiles are exactly the exercises with reps in the real sheet's last workout row. Open a few tiles without typing. Verify that the Network tab shows no `values:batchUpdate` and that the console shows no errors from this app's code.
- [ ] 5.2 (Manual, user) At the next workout, log it with the app on the phone. Record in this task whether the border showed at a glance which exercises were done last time.

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 5 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `highlight-last-workout` worktree and its `worktree-highlight-last-workout` branch once `main` contains them.
