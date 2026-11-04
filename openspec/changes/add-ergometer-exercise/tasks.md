# Tasks

Worktree: add-ergometer-exercise

Groups 1–7 are implemented in the git worktree above, on branch `worktree-add-ergometer-exercise`, which starts at `main`'s head (`cc1793b`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:**
  - Every browser check before group 8 runs against the development sheet, never the real one.
  - Restore every cell you change for a check, and delete any row for today that a check creates.
  - The development sheet already has an "Ergometer" column pair in AH:AI. The user's hand-typed times there display as "03:30".
- **Reference:** `ergometer-icon.svg` in this change shows the approved Ergometer icon in the three tile states and in the full grid.

## 1. Branch up to date

- [x] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, rebase the branch onto `main`. Verify that `npm test` passes before any change.
- [x] 1.2 On `localhost`, sign in and read the development sheet's year tab in the DevTools console, with `const { readTab } = await import('./api.js')` and `await readTab('2026')`. Record in this task:
  - that AH1 reads exactly "Ergometer", and that the intensity is in AH and the time in AI;
  - two example time cells as displayed, such as "03:30";
  - whether any hand-typed time looks like 24 minutes or more, which Sheets would show wrapped (design.md, "Risks / Trade-offs").

  Recorded 2026-11-04: AH1 reads exactly "Ergometer" (column index 33), intensity in AH and time in AI. The only filled Ergometer cells are in row 63 (03.11.2026): "7" and "03:30", which matches `m:ss` with a leading zero. No time of 24 minutes or more.

  If a displayed time does not match `m:ss` with an optional leading zero, stop and update the sheet-format spec and design.md before group 2.

## 2. Sheet notation

- [x] 2.1 In `sheet-format.js`, add the timed exercise list, `isTimed(name)`, and `timed` on each `parseHeader` entry, as in design.md ("`sheet-format.js` decides what a column pair means, by name"). Update the comment on `parseHeader` to say what the two columns hold for each kind. Keep the existing tests unchanged, and add tests to `tests/sheet-format.test.js`:
  - "Ergometer in the header" and "Timed exercise": a header with "Ergometer" over AH:AI, column indices 33 and 34, gives `timed: true` with the intensity in AH and the time in AI;
  - "Different case": "ERGOMETER" is timed;
  - a name with surrounding spaces, " Ergometer ", is timed;
  - "Different spelling": "Fahrradergometer" is not timed;
  - every other exercise in the existing header tests has `timed: false`.

  Verify that `npm test` passes.
- [x] 2.2 In `sheet-format.js`, add `parseIntensity`, `parseTime` and `formatTime` as in design.md ("Notation: `parseIntensity`, `parseTime` and `formatTime`"). Add tests to `tests/sheet-format.test.js`:
  - "Intensities": "8", " 12" and "10 " give 8, 12 and 10;
  - "Minutes and seconds": "3:30", "12:05" and "0:45" give 210, 725 and 45 seconds;
  - "An hour or more": "75:00" gives 4500;
  - "Leading zero" and "Time typed by hand": "03:30" gives 210;
  - empty and blank cells give `null` and are not unreadable, for both functions;
  - "Intensity that is not a whole number": "8.5" and "8 (Stufe)" are unreadable;
  - "Time that does not follow the notation": "20 min", "3.30", "3:5", "3:75" and "1:03:30" are unreadable;
  - "Several intensities" and "Several times": "8, 9", "8 9", "3:30, 2:00" and "3:30 2:00" are unreadable;
  - "Intensity and time" and "Short and long times": `formatTime` gives "3:05" for 185, "0:45" for 45 and "75:00" for 4500;
  - `parseTime(formatTime(s)).seconds === s` for 0, 59, 60, 725 and 4500.

  Verify that `npm test` passes.
- [x] 2.3 Update `README.md` ("Sheet format"):
  - Ergometer's column pair holds the intensity and the time, and only the exact name "Ergometer", ignoring case, makes it so;
  - the intensity cell is a whole number without a unit;
  - the time cell is `m:ss`. A hand-typed time shows as "03:30" and is read correctly. A time of 24 minutes or more must be logged with the app, or typed with a leading apostrophe ('45:00), because Sheets would wrap it;
  - which intensity and time cells are unreadable, including a list of several values, which the reps cell allows but these two cells do not.

  Verify that every example in the README section is one the tests of 2.2 read the same way.

## 3. Today's workout model

- [x] 3.1 In `workout.js`, give `buildToday`'s exercises `timed`, and branch `read`, `hasEntry` and `hasReadable` on it, as in design.md ("`buildToday`: one entry shape per kind"). Update the comment above `buildToday`. Keep the existing tests unchanged. Add an Ergometer fixture to `tests/workout.test.js`, with its pair after the existing columns, and add tests:
  - today's Ergometer entry holds `intensity` and `time` parsed from its cells;
  - "Timed exercise" (last time): with an intensity only in the lowest row, "20 min" in the row above it and "8" with "3:30" above that, `last` is the "3:30" row;
  - the carry-over row is Ergometer's last time when no workout row has a readable time;
  - "Only Ergometer": a row with only "8" and "3:30" for Ergometer is the last workout, and Ergometer has `doneLastWorkout`;
  - "Ergometer intensity only": a row with only an Ergometer intensity is not the last workout, and Ergometer is not done in it;
  - an unreadable time ("20 min") in the last workout counts as done in the last workout.

  Verify that `npm test` passes.
- [x] 3.2 In `workout.js`, add `formatTimeInput`, the `'timed'` mode of `initialState` and the timed branch of `cellsFor`, as in design.md ("Editor state: a third mode, `'timed'`"). Add tests to `tests/workout.test.js`:
  - `formatTimeInput`, as text and seconds:
    - "Minutes and seconds", "More than ten minutes", "Seconds only" and "Leading zero": "330", "1205", "45" and "0330" give "3:30", "12:05", "0:45" and "3:30", and 210, 725, 45 and 210;
    - "Time with a colon": "3:30" gives "3:30" and 210, so formatting is idempotent;
    - "Typing a time": "4", "41" and "415" give "0:04", "0:41" and "4:15";
    - "Deleting digits": "4:1", "0:4" and "0:0", the field after each deletion, give "0:41", "0:04" and "";
    - "Changing a time": "3:3", "0:3", "0:034" and "0:345" give "0:33", "0:03", "0:34" and "3:45";
    - "Seconds above 59 while typing" and "Too many seconds": "390" gives "3:90", invalid, with no seconds;
    - "Other characters": "4a1" and "4:1:" give "0:41";
    - "", "0" and "00" give "", neither a time nor invalid.
  - `initialState`:
    - "Prefill from the last workout": intensity "8", time empty, placeholder "3:30";
    - "Today's values come first": intensity "9" and time "4:00";
    - "Never done": all three empty;
    - "Time with a unit": today's "20 min" gives text mode with "8" and "20 min".
  - `cellsFor` and `writesFor`:
    - "Logging Ergometer": intensity "8" and time "330" give "8" and "3:30";
    - "Without an intensity": an empty intensity and "330" give "" and "3:30";
    - "Changing only the intensity" and "Clearing the time": an intensity without a time gives two empty cells;
    - "Decimal intensity": "8.5" is invalid with `invalid.intensity`;
    - "Too many seconds": "390" is invalid with `invalid.time`;
    - "Ergometer first": with `creating`, `writesFor` writes the date and then the two cells at the intensity column.

  Verify that `npm test` passes.
- [x] 3.3 In `workout.js`, add `timedProgressOf` as in design.md ("'Improved': a separate `timedProgressOf`"). Add tests to `tests/workout.test.js`:
  - every scenario of "A timed exercise improves with more intensity, then more time": higher intensity with a shorter time, same intensity with a longer time, equal, lower intensity with a longer time, and without an intensity;
  - "Intensity only": `'none'`;
  - "Unreadable time today": `'done'`;
  - "Unreadable intensity last time": `'done'`;
  - "Ergometer never done before": `'done'`.

  Verify that `npm test` passes.

## 4. The Ergometer editor

- [x] 4.1 In `today.js`, add `progressFor`, the timed branch of `buildExercise` with its formatting on every `input` event, the timed labels in text mode, and the timed fields in `markInvalid`. All of this follows design.md ("The time field: numeric keypad, formatted as the user types" and "'Improved': a separate `timedProgressOf`"). Verify on `localhost`, on a day without a row for today:
  - "Opening Ergometer": the editor shows "Intensity" and "Time", both with `inputmode="numeric"`, and no "kg", set fields or "+ Set". It also shows the "History" link and the last-time line;
  - "Prefill from the last workout": the intensity and the time placeholder match Ergometer's last row in the development sheet;
  - "Typing a time": typing 4, 1 and 5 shows "0:04", "0:41" and "4:15" in the field, with the cursor at the end. There is no text next to the field. The Network tab shows no `values:batchUpdate` and the field is not marked until you leave it;
  - "Deleting digits": three deletions from "4:15" show "0:41", "0:04" and an empty field;
  - "Changing a time": on a saved "3:30", two deletions and then 4 and 5 show "0:33", "0:03", "0:34" and "3:45";
  - "Seconds above 59 while typing": typing 3, 9 and 0 shows "0:03", "0:39" and "3:90". The field is marked invalid only once you leave it;
  - "Other characters": on the desktop keyboard, a letter or ":" leaves the field as it was;
  - "Minutes and seconds" and "Seconds only": "330" shows "3:30", and "45" shows "0:45";
  - "Logging Ergometer" and "Ergometer first": with intensity 8 and time 330, the development sheet gets today's row with the date, "8" and "3:30". Both cells are left-aligned text;
  - "Time with a colon": leaving the field "3:30" unchanged writes nothing new and marks nothing;
  - "Changing only the intensity": no row is created when only the intensity changes;
  - "Clearing the time": emptying the time field empties both cells;
  - "Decimal intensity", "Intensity that is not a number" and "Too many seconds": the intensities "8.5" and "abc", and the time "390", which shows "3:90", are marked invalid and write nothing. The tile keeps its colour;
  - "Time entered" and "Intensity only": the tile turns blue and the counter goes up when a time is saved, but not for an intensity alone;
  - "Turning green": a higher intensity, or the same intensity with a longer time, turns the tile green with confetti;
  - "Time with a unit": type "20 min" into today's Ergometer time cell in the development sheet and reload. The editor shows the text fields "Intensity" and "Time", and changing the time to "20:00" writes "20:00";
  - in DevTools' Accessibility pane, the fields are named "Ergometer intensity" and "Ergometer time in minutes and seconds";
  - in device mode at 360px, the two fields fit the editor's width;
  - Latzug's editor and tile behave as before;
  - the console shows no errors.
- [x] 4.2 Update `README.md` ("Workout screen"):
  - "Prefill": Ergometer's intensity is prefilled from last time, and its time appears as a placeholder;
  - "Saving": Ergometer has an intensity field and one time field, the digits rule with the field formatting the time as you type, and that an intensity alone is never saved;
  - "Tiles": Ergometer is done with a time, and improved with a higher intensity, or the same intensity and a longer time.

  Verify that the README matches what 4.1 showed.

## 5. Ergometer icon

- [x] 5.1 Add the `'Ergometer'` entry to `ICONS` in `icons.js`, copied exactly from the appendix of design.md. In `tests/icons.test.js`:
  - add Ergometer to `NAMES` and rename the first test to the 17 names;
  - add "Ergometer": `iconFor('Ergometer')` and `iconFor('ERGOMETER')` return the entry;
  - check that the existing tests "Every icon is different" and "Every coordinate lies within the 24 x 24 grid" now cover it.

  In `tests/workout.test.js`, add that `tileLabels` with `iconFor` gives `null` for Ergometer. Verify that `npm test` passes. On `localhost`, check that Ergometer's tile shows the icon in all three states, and that the History list shows it next to Ergometer.
- [x] 5.2 Update `README.md` ("Tiles"): 17 exercises have an icon, with Ergometer in the list. Verify that the list matches the keys of `ICONS`.
- [x] 5.3 (Manual, user) On `localhost` at 360px width, with some tiles done and some improved, look at the tile grid next to `ergometer-icon.svg`. Confirm that Ergometer's icon looks as approved, especially next to Beinstrecker.

## 6. History

- [x] 6.1 In `stats.js`, give `historyOf`, `yearSoFar` and `summaryOf` their timed branches, as in design.md ("History: `timed` sessions, averages and a time graph"). Update their comments. Keep the existing tests unchanged, and add tests to `tests/stats.test.js`:
  - "Ergometer" (session): a row with only "8" and "3:30" is a session of Ergometer and a workout;
  - "Ergometer intensity only": an intensity alone is no session and no workout;
  - "Ergometer" (year so far): 2 workouts, 2 sets and 20 reps;
  - Ergometer can be the most-done exercise;
  - "Timed exercise": Ergometer is never the biggest gain;
  - "Two sessions": `averageIntensity` 8.5 and `averageTime` 225, with `averageReps` and `averageWeight` `null`;
  - "Session without an intensity": 8 and 240;
  - "Rounding the time": 220;
  - "No intensity at all": `averageIntensity` `null`;
  - "Unreadable Ergometer session": count 2, one left out, 8 and 210;
  - "Time per session": points at 210 and 240;
  - "Unreadable time": no point;
  - a weight-and-sets exercise gets `null` for both new fields.

  Verify that `npm test` passes.
- [x] 6.2 In `history.js`, show the timed averages and caption in `buildResults`, and give `buildGraph` the measure parameter, as in design.md. Add two or more Ergometer sessions in the window to the development sheet for this check, typed by hand, and remove them afterwards. Verify on `localhost`:
  - the exercise list shows Ergometer with its icon and when it was last done;
  - "Two sessions": Ergometer's detail shows "Intensity per session" and "Time per session" as `m:ss`, and no reps and no kg;
  - "Time per session": the graph is captioned "Time per session", and its value labels are `m:ss` without a unit;
  - the graph's accessible name gives the number of sessions and the first and last time in `m:ss`, without "kg" ("Accessible name");
  - Latzug's detail still shows the estimated 1RM in kg, and Klimmzüge (assistiert) still shows the assistance with "lower is better";
  - the year so far counts Ergometer's workouts but no sets or reps from it;
  - the console shows no errors.
- [x] 6.3 Update `README.md` ("History"):
  - Ergometer sessions count for workouts, last done and most done, but not for sets, reps or the biggest gain;
  - its detail shows the average intensity and the average time, and a graph of the time per session.

  Verify that the README matches what 6.2 showed.

## 7. Integration and merge

- [x] 7.1 Run `npm test` and `openspec validate add-ergometer-exercise --strict`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Log Latzug.
  2. Log Ergometer until its tile turns green.
  3. Open History and Ergometer's detail.
  4. Reload the page.

  Verify that:
  - after the reload, both tiles keep their state and Ergometer's editor shows today's values;
  - the History detail counts today's session;
  - only today's row changed in the development sheet, with Ergometer's cells as text.
- [x] 7.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-add-ergometer-exercise`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 7.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `icons.js` matches the commit.

## 8. Live verification

These checks run against the deployed site after 7.3, so they are checked off in a follow-up commit.

- [ ] 8.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in and check that:
  - Ergometer's tile shows the icon;
  - opening it without typing shows the intensity and time placeholder from the real sheet's last Ergometer row;
  - its History detail shows the intensity and time averages.

  Verify that the Network tab shows no `values:batchUpdate`, and that the console shows no errors from this app's code.
  Checked 04.11.2026 after the deploy: the icon shows on the tile and in the History list, no `values:batchUpdate` went out, and the console showed only Google sign-in and favicon errors. The real sheet has no Ergometer row yet ("not done this year", no last-time line), so the placeholder and the averages stay open until the first real Ergometer row exists.
- [ ] 8.2 (Manual, user) At the next workout, log Ergometer with the app on the phone. Record in this task:
  - whether typing the time as digits, with the field formatting it as you type, was quick and clear, and whether correcting a time with the delete key worked as expected;
  - whether the icon was recognisable at a glance;
  - whether the tile turned green when expected.

## Workflow follow-up

- Archive `add-history-analysis` before this change, because this change modifies its `workout-history` capability (design.md, "Migration Plan").
- Run `/opsx:archive` for this change on `main` once group 8 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `add-ergometer-exercise` worktree and its `worktree-add-ergometer-exercise` branch once `main` contains them.
