# Tasks

Worktree: add-history-analysis

Groups 1–5 are implemented in the git worktree above, on branch `worktree-add-history-analysis`, which starts at `main`'s head (`3f6855a`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 6 runs against the development sheet, never the real one. Restore every cell you change for a check, and delete any row for today that a check creates.
- **Tests:** the tests for `stats.js` go into a new `tests/stats.test.js`, with made-up rows from a `tab()` helper of its own. Its header includes an assisted exercise, "Klimmzüge (assistiert)", and an exercise usually logged without weight, "Rückenheben". Each test is named after the spec scenario it covers, where there is one.

## 1. Branch up to date

- [x] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, rebase the branch onto `main`. Verify that `npm test` passes before any change.

## 2. Dates, sessions and windows

- [x] 2.1 In `sheet-format.js`, add `dayNumber` and `fromDayNumber`, as in design.md ("Dates as day numbers"). Add tests to `tests/sheet-format.test.js`:
  - 15.10.2026 minus 12.09.2026 is 33 days;
  - 01.01.2027 minus 31.12.2026 is 1 day;
  - 30.03.2026 minus 29.03.2026, across the change to summer time, is 1 day;
  - `fromDayNumber(dayNumber(d))` returns `d` for 29.02.2028 and 31.12.2026.

  Verify that `npm test` passes.
- [x] 2.2 Create `stats.js` with `historyOf`, as in design.md ("`stats.js`: collect sessions once…"). Add tests for:
  - "Row dated in another year" and "Row dated after today";
  - "Weight only" and "Unreadable reps": a session, the `readable` flag and the workout count;
  - sessions sorted by date when rows are out of date order;
  - two rows with the same date making two sessions;
  - the carry-over row taken as baseline and never as a session;
  - a tab without a carry-over row, where row 2 can be a session.

  Verify that `npm test` passes.
- [x] 2.3 Add `withToday` to `stats.js`, as in design.md ("Feed the history the loaded rows…"). Add tests for:
  - with a loaded row for today: that row takes the given cells, and the other rows stay unchanged;
  - without one: a row dated today is appended;
  - "Invalid input": the cells passed in are the ones that count;
  - the input array is not modified.

  Verify that `npm test` passes.
- [x] 2.4 Add `windowOf` to `stats.js`. Add tests for:
  - "Last 30 days", "This year" and "Typed number of days" (45);
  - "Early January": 15.01.2027 with 30 days is partial, with 15 covered days from 01.01.2027;
  - 03.01.2027 with 30 days has 3 covered days;
  - "Window within the year": 90 days on 15.10.2026 is not partial;
  - a window of 1 day covers only today.

  Verify that `npm test` passes.
- [x] 2.5 Add `daysSinceLastDone` and `exerciseOrder` to `stats.js`, as in design.md ("Exercise order and the arrow button"). Add tests for "Order", "Yesterday", "Reversed order", "Same day", "Umlauts", "Not done this year" and "Ties when reversed", and that the carry-over row alone gives `null`. The header of the test tab must list the tied exercises out of alphabetical order, or the tie tests prove nothing. Verify that `npm test` passes.

## 3. The numbers

- [x] 3.1 Add `summaryOf` to `stats.js`, with the session count and the averages, as in design.md ("Averages: per-session values, then their mean"). Add tests for:
  - "Sessions in the window" (4 times) and "No session in the window";
  - "Sets with their own weight" (32 reps, 47.8 kg), "Two sessions" (27 reps, 77.5 kg) and "Assisted exercise" (24 reps, 30 kg);
  - "One unreadable session" (done 2 times, averages from 1, 1 left out) and "Nothing readable";
  - a readable session with 0 reps in total;
  - "Early January": only sessions since 01.01.2027 count.

  Verify that `npm test` passes.
- [x] 3.2 Add `estimatedMax` and `lightestAssistance`, and the graph points in `summaryOf`, as in design.md ("Estimated 1RM with Epley"). Add tests for:
  - "Best set" (100 kg), "Sets with their own weight" (73.3 kg), "Without weight" and "Unreadable weight" (no point);
  - "Lightest assistance" (20 kg) and "No assistance" (0 kg);
  - points in date order, only inside the window.

  Verify that `npm test` passes.
- [x] 3.3 Add `yearSoFar` to `stats.js`. Add tests for:
  - "Counting" (2 workouts, 8 sets, 76 reps), "Unreadable entry" (2 sets, 16 reps) and "Start of a year";
  - "One exercise" and "Several exercises" for the most-done exercise, with Latzug before Bankdrücken in the header, so the names come out alphabetically and not in header order;
  - "Carry-over row as baseline" (Latzug, 90 to 105 kg, +17%) and "First session as baseline" (Bankdrücken, 70 to 77 kg, +10%);
  - "A single session", "No gain" and "Assisted exercise";
  - an unreadable carry-over cell, where the first session becomes the baseline.

  Verify that `npm test` passes.

## 4. The History page

- [x] 4.1 Move `svgElement` and `buildIcon` from `today.js` into a new `svg.js`, and import them in `today.js`. Verify that `npm test` passes. On `localhost`, verify that every tile shows the same icon as before and that the console shows no errors.
- [x] 4.2 In `today.js`, keep the loaded rows and today's row, and give each item `cells`, updated in `onChange` together with `progress`. Export `currentRows()`, which builds its entries from the items and calls `withToday`. Verify on `localhost`, in the DevTools console with `(await import('./today.js')).currentRows()`, which returns the page's own module instance:
  - after entering 10 in Latzug's first set field and leaving it, today's row holds Latzug's cells;
  - after changing a set to "abc", the row still holds the previous cells;
  - with the network set to Offline in DevTools, a failed save still leaves the entered cells in the row.
- [x] 4.3 Restructure `#workout` in `index.html` as in design.md ("Page layout: History sits inside `#workout`"). In `app.js`, add the hash handling from "Navigation through the URL hash", including the blur before rendering and the `replaceState` on load. Create `history.js` with the overview: the year so far, with `yearSoFar` and the "no workouts yet" text, and the exercise list, with `exerciseOrder`, the icons, the arrow button and the wording from design.md. Add the styles for the switch, the year so far, the list and the arrow button to `styles.css`. On `localhost`, verify these scenarios:
  - "Opening the history": the switch marks History, and the tiles and editor are hidden;
  - the year so far and the list order match the development sheet, checked by hand for three exercises;
  - "Default order", "Reversed order" and "Order kept": the arrow points down by default and flips with the order;
  - "Accessible name" of the arrow button, in DevTools' Accessibility pane. At 360px width, the button is at least 2.75rem square;
  - "Going back" with the browser's back button, and "Reloading on the History page";
  - "Back to Today" and "Switching from a focused field";
  - "First set today": the exercise moves to the top of the list as "today";
  - "Save fails during the history": switch the network to Offline after leaving a field, open History, and check that "Not saved" and "Retry" stay visible;
  - "Browsing the history": the Network tab shows no request while you browse;
  - "Header that looks like markup": temporarily put `<b>Latzug</b>` in a header cell of the development sheet, reload, check, then restore the cell;
  - the console shows no errors.

  "No history without the year's tab" follows from `showMissingTab` hiding `#workout`. Check this by reading the code.
- [x] 4.4 In `history.js`, add the detail, as in design.md ("`history.js` renders…" and "The graph is inline SVG"):
  - the heading and the chevron "Back" link;
  - the window buttons and the "Days" field;
  - the coverage note;
  - how often and when last done;
  - the averages, with the left-out count and the assistance wording;
  - the graph, or the "not enough data" text.

  Add its styles to `styles.css`. On `localhost`, verify:
  - "Opening and closing a detail": the chevron returns to the list;
  - for two exercises, the frequency, the averages and the graph's highest and lowest values against the development sheet, computed by hand for "30 days" and for "This year";
  - "Default window", "Invalid number" and "Window kept for other exercises";
  - a typed window that reaches into the previous year, such as 400 days, shows the coverage note with the right number of covered days;
  - an assisted exercise shows "Assistance (kg), lower is better";
  - an exercise with one session in the window shows the "not enough data" text;
  - in DevTools' Accessibility pane, the graph's name matches "The graph is labelled and has a text alternative";
  - in device mode at 360px and 430px width, and on desktop at full width, the graph's labels are readable and do not overlap, and the page has no horizontal scroll;
  - the console shows no errors.
- [x] 4.5 In `today.js`, add the History link to `buildExercise`, as in design.md ("A History link in each editor"), and its style to `styles.css`. On `localhost`, verify:
  - "Opening from the editor" and "Going back to the editor", once with the chevron and once with the browser's back button;
  - "Opening from a focused field": the set is saved, and the detail counts it;
  - "Editor with unreadable cells": temporarily put "?, 9, 7" into today's reps cell of an exercise in the development sheet, reload, open the exercise, check, then restore the cell;
  - "Accessible name": in DevTools' Accessibility pane, the link's name is, for example, "History of Latzug";
  - at 360px width, the heading and the link fit on one row, and long names wrap without hiding the link;
  - the console shows no errors.
- [x] 4.6 Update `README.md`:
  - a "History" section: the switch, the History link in each editor, the year so far, the exercise order (most recent first) and the arrow button that reverses it, the detail with its windows and chevron link back, the coverage note, per-session averages, and Epley as a trend line, with assistance for assisted exercises;
  - that the history reads only the year's tab and sends no request;
  - the new files in the "Files" table;
  - `stats.js` in the "Tests" paragraph.

  Verify that every behaviour checked in 4.3, 4.4 and 4.5 is described.
- [x] 4.7 (Manual, user) On `localhost` at 360px width, look through the History page and two exercises' details. Confirm that the graph and the numbers are easy to read on the phone. If a label, size or wording should change, change it in `history.js` or `styles.css` and in design.md before group 5.

## 5. Integration and merge

- [x] 5.1 Run `npm test`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Note one exercise's frequency and "last done" on the History page.
  2. Go to Today and log a set of that exercise.
  3. Select the History link in that exercise's editor, and check that the detail says it was last done today and counts one more session.
  4. Go back with the browser's back button, and check that Today shows the editor still open with the set.
  5. Reload, and check that Today shows the set and History gives the same numbers as in step 3.

  Verify in the development sheet that only today's row changed.
- [x] 5.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-add-history-analysis`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [ ] 5.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `history.js` matches the commit.

## 6. Live verification

These checks run against the deployed site after 5.3, so they are checked off in a follow-up commit.

- [ ] 6.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in, open History and three exercises' details, and switch between the windows. Then tap one tile and open its detail with the editor's History link, without typing anything on the Today page. Verify that the Network tab shows no request while browsing the history and no `values:batchUpdate` at all, and that the console shows no errors from this app's code.
- [ ] 6.2 (Manual, user) At the next workout, use the History page on the phone. In this task, record whether the exercise list and the details answered "what should I do next?" and "am I progressing?".

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 6 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `add-history-analysis` worktree and its `worktree-add-history-analysis` branch once `main` contains them.
