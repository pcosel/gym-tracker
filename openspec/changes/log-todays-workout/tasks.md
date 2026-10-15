# Tasks

Worktree: read-write-sheet

Groups 1–5 are implemented in the git worktree above, on branch `worktree-read-write-sheet`, which matches `main` when this change starts. Serve it with `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`. Task 1.1 is done by the user and can run in parallel with groups 2 and 3, which need no sheet. Every check from group 4 on runs against the development sheet from 1.1, never the real one.

## 1. Configurations

- [x] 1.1 (Manual, user) In Google Sheets, open the gym sheet and use File > Make a copy. Name the copy so it is clearly the development sheet, for example "Fitti (dev)". Check that its Share dialog shows General access as **Restricted** and nobody else. Hand its ID (the `<ID>` in `docs.google.com/spreadsheets/d/<ID>/edit`) to the implementer. Verify that the copy has a tab "2026" with the same header row and data as the original.
- [x] 1.2 Rewrite `config.js` as described in design.md ("Configurations"):
  - `CONFIGS.production` keeps today's two values unchanged;
  - `CONFIGS.development` shares the client ID and holds the ID from 1.1, or `''` while it is not available;
  - the module exports `ENVIRONMENT` and `CONFIG`, and `missingConfigKeys()` checks the active configuration;
  - the config screen in `index.html` and `app.js` names the active configuration, with the name set via `textContent`.

  Update the header comment to explain the two configurations. Verify the sheet-access scenarios:
  - "Development sheet not set yet": with the development ID blank, `http://localhost:8000` shows "Not configured" naming the development configuration and `SPREADSHEET_ID`, and the Network tab shows no request to a Google domain.
  - "Blank development settings do not affect the live site": with the development ID still blank, `http://127.0.0.1:8000` runs the production configuration and shows the sign-in screen, not "Not configured". It is not a registered origin, so do not sign in there.
  - "Local run uses the development sheet": with the ID from 1.1 filled in, sign in at `http://localhost:8000`. Every `sheets.googleapis.com` request in the Network tab carries the development ID, and none carries the production ID.
- [x] 1.3 Update `README.md`:
  - a "Configurations" section: production and development, chosen by host, the development sheet being a private copy, and why it is a copy (design.md, "Configurations");
  - step 4 of "Google Cloud setup" mentions both IDs;
  - the "Not configured" row of the screens table names the active configuration.

  Verify that the README states which host uses which configuration, and that its instructions for making the copy match 1.1.

## 2. Sheet notation

- [x] 2.1 Add `package.json` as in design.md ("Tests"), with `"type": "module"` and `"test": "node --test tests/"` and no dependencies. Create `tests/sheet-format.test.js`, importing `../sheet-format.js`. Add a "Tests" section to `README.md`: `npm test`, Node 20 or later, no install step, and that the test data is made up. Verify that `npm test` runs the file and reports its tests, and that `git status` shows no `node_modules`.
- [x] 2.2 In `sheet-format.js`, implement `parseHeader`, `parseDate`, `formatDate` and the carry-over check, as described in design.md ("Notation"). Add tests for:
  - the sheet-format scenarios "Merged header", "Unmerged header", "Workout row", "Date without leading zeros" and "Carry-over row" (`2025` in A2 counts, and `2025` in A5 does not);
  - a header pair with an empty name being skipped;
  - `31.02.2026` and `2026-10-15` being rejected as dates;
  - `formatDate` giving `05.09.2026`.

  Verify that `npm test` passes.
- [x] 2.3 Implement `parseWeight` and `parseReps`, including unreadable cells and the per-position entries. Add tests for the sheet-format scenarios:
  - "Whole and decimal weights";
  - "Sets with their own weight";
  - "Any number of sets";
  - "Irregular spacing";
  - "Decimal set weight";
  - "Reps that Google Sheets stored as a date" (`"12, 10, 10"`);
  - "Two-digit year display" (`"10, 8, 07"`);
  - "Notes and typos". Here `"?, 9, 7"` is unreadable but still yields entries 2 and 3.
  - an empty cell, which is no sets rather than unreadable.

  Verify that `npm test` passes.
- [x] 2.4 Implement `formatWeight`, `formatSets`, `columnLetter` and `rangeFor`. Add tests for:
  - the scenarios "Sets with their own weight" (writing) and "Number formatting";
  - `columnLetter` for 0, 25, 26 and 32 (A, Z, AA, AG);
  - `rangeFor` quoting a tab title that contains `'`;
  - parsing a formatted reps cell giving back the same sets.

  Verify that `npm test` passes.
- [x] 2.5 Add a "Sheet format" section to `README.md`. It covers the tab per year, the header row and the column pairs, the carry-over row (maintained by hand and only read by the app), one row per day with dates as text, the weight and reps notation with `@` and a dot for decimals, unreadable cells, and the hidden dates in the "Automatic" columns. Verify that each requirement of `specs/sheet-format/spec.md` is reflected in the section.

## 3. Today's model and prefill

- [x] 3.1 In `workout.js`, implement `buildToday(rows, today)`, which returns `todayRow`, `nextRow` and per exercise `today` and `last`, as in design.md ("Today's model and prefill"). Add `tests/workout.test.js` with a made-up 2026 tab (header, carry-over row, rows of varying length) covering these todays-workout scenarios:
  - "Workout already started";
  - "No workout yet today";
  - two rows with today's date, where the lowest is used;
  - "Weight without reps is skipped";
  - "Carry-over row as fallback";
  - "Never done";
  - `nextRow` being one below the longest-reaching row, even when that row has no date.

  Verify that `npm test` passes.
- [x] 3.2 Implement the initial editor state: mode, weight, number of set fields, and each field's reps, own weight and placeholder. Add tests for these todays-workout scenarios:
  - "Three fields by default";
  - "More sets last time";
  - "Prefill from the last workout";
  - "Sets with their own weight";
  - "Today's values come first";
  - "Unreadable entry last time";
  - `'text'` mode when today's reps cell is `"?, 9, 7"`.

  Verify that `npm test` passes.
- [x] 3.3 Implement `cellsFor(state)` with validation. Add tests for these todays-workout scenarios:
  - "Logging the first set";
  - "Set with its own weight";
  - "Empty set fields are left out";
  - "Changing only the weight" (both cells stay empty);
  - "Deleting the reps again";
  - "Clearing an exercise";
  - "Raising the weight";
  - "Own weight equal to the exercise weight";
  - "Decimal comma";
  - "Not a number";
  - `'text'` mode returning the entered text unchanged.

  Verify that `npm test` passes.
- [x] 3.4 Add a "Workout screen" section to `README.md` with a "Prefill" part: which exercises are shown, the number of set fields, "last time" including the fallback to the carry-over row, and which values are copied and which are only placeholders. Verify that it agrees with the "Last time" and "Fields are prefilled" requirements in `specs/todays-workout/spec.md`.

## 4. Reading and writing the sheet

- [x] 4.1 Extend `probeSpreadsheet()` to the field mask `properties.title,sheets.properties.title`, returning `{ title, tabs }`. Verify on `localhost` that the Network tab shows the new field mask, and that the response lists the development sheet's tab titles and holds no cell data.
- [x] 4.2 Add `readTab(title)` and `writeCells(tab, writes)` to `api.js` as described in design.md ("Reading" and "Writing"). Verify in the browser console on `localhost`, signed in, against the development sheet:
  - `(await import('./api.js')).readTab('2026')` returns the rows, and the Latzug reps for 25.09.2026 read `"10, 8, 07"`. This confirms "Cells are read as displayed" on a cell that Google Sheets stored as a date.
  - `writeCells` with `"12, 10, 10"` into an empty AA cell far below the data stores text. Google Sheets shows it left-aligned, and Format > Number shows it is not a date, which confirms "Cells are written as plain text".
  - Writing `""` to the same cell empties it again.
- [x] 4.3 Extend "How it works" in `README.md`: the app reads the year's tab as displayed and writes only the cells it changes, as plain text with `RAW`, and why. Verify that the reasons match design.md ("Reading" and "Writing").

## 5. Workout screen

- [x] 5.1 Rework `enterApp()` in `app.js` as in design.md ("Screen flow"):
  - probe, then report a missing tab for the year;
  - otherwise show "Loading today's workout…", run `readTab`, and send any failure to `handleAccessError`;
  - otherwise render the workout screen from `today.js` in `screen-app`.

  Verify these todays-workout scenarios:
  - "Opening the app" shows the date, the development sheet's title and the email.
  - "New year without a tab": rename the copy's tab to `2026x`, reload, and see the missing-tab message with no way to add an exercise. Rename it back.
  - "Google is temporarily unavailable": inject HTTP 503 for the `values/` request only, as in archived task 4.3. The sign-in screen shows the "Google is unavailable" message, and signing in again repeats both requests.
- [x] 5.2 In `today.js` and `index.html`, render the exercise list and the add-exercise choice with `createElement`, `textContent` and `.value` only. Verify in the development sheet:
  - "Workout already started": type today's date and values for Latzug and Brustpresse into a new row by hand, then reload.
  - "No workout yet today", "Adding an exercise" and "Choice of exercises to add". The Network tab shows no `values:batchUpdate`.
  - "Weight without reps".
  - "Header that looks like markup": set a header cell of the copy to `<b>Latzug</b>`, check, then restore it.
- [x] 5.3 Render each exercise's weight field and set rows: reps, an own weight with the exercise weight as its placeholder, "+ Set", and `inputmode` as in design.md ("Workout screen interaction"). Render text mode for unreadable cells. Verify against the copy's data:
  - "Three fields by default", "More sets last time" and "Adding a set field";
  - Bankdrücken prefilled from row 13 with "55" and "14";
  - Beinpresse prefilled from the carry-over row with 69 and the placeholders 15, 15, 15;
  - Duale Schulterpresse empty;
  - an exercise whose reps cell in today's row is typed as `?, 9, 7` showing two text fields.
- [x] 5.4 Implement the save queue and the status line as in design.md ("Save queue"). Verify in the development sheet:
  - "First save of the day" and "Logging the first set". Before the write, the Network tab shows one extra `values/` read, then one `values:batchUpdate` with exactly `A{n}` and the exercise's two cells. A second save has no `A{n}`.
  - "Set with its own weight", "Empty set fields are left out", "Changing only the weight", "Clearing an exercise", "Raising the weight" and "Own weight equal to the exercise weight", each checked in the sheet.
  - "Prefilled values alone are not saved", "Opening the app without training", "Decimal comma" and "Not a number".
  - "Reps with a question mark", saved exactly as typed.
  - "Quick changes": with DevTools throttling at "Slow 3G", enter two sets quickly. The cell ends as `"10, 9"`.
  - "Saved", and "No connection": in DevTools offline mode, the status shows "Not saved" with "Retry" and the values stay. Back online, "Retry" writes them.
  - "Saving one exercise": the alternating grey fill and the merged headers of the copy are unchanged, and no other cell changed.
- [x] 5.5 Handle an expired session during a save in `today.js`: "Sign in to save" calls `auth.signIn()` without awaiting anything first, then restarts the queue. Verify the google-sign-in scenarios with the method from archived task 4.1, where the first `window.open` returns null so the silent renewal fails, and 401 is injected for `values:batchUpdate` only:
  - "Token expires during a workout": the workout screen stays with its values and offers "Sign in to save".
  - "Signing in is cancelled": close the popup. Still offered, and the values stay.
  - "Signing in again saves the changes": restore `window.open`, remove the 401 and tap the button. The popup closes by itself and the status reaches "Saved".
  - The modified "Renewal fails": inject the 401 for the `values/` read at load instead. The sign-in screen with "session expired" still appears.
- [x] 5.6 Add `styles.css`, linked from `index.html`, for a usable phone layout. Verify in DevTools device mode at 360 px width:
  - there is no horizontal scrolling;
  - each set row (number, reps, own weight) fits on one line;
  - inputs have a font size of at least 16 px, so iOS does not zoom.
- [x] 5.7 Update `README.md`:
  - the screens table, where the app screen is now the workout screen and the missing-tab message is added;
  - the "Files" table, adding `sheet-format.js`, `workout.js`, `today.js`, `styles.css`, `package.json` and `tests/`;
  - in "Workout screen", saving on leaving a field, the status line, "Retry", text mode, and recovering an expired session with "Sign in to save";
  - in "Sessions", the save-time exception.

  Verify that the README describes each behaviour observed in 5.1–5.5.

## 6. Merge and publish

- [x] 6.1 Run `npm test`, then commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-read-write-sheet`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 6.2 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds in the repository's Actions tab.

## 7. Live verification

These checks run against the deployed site after 6.2, so they are checked off in a follow-up commit. Set `SITE` to `https://pcosel.github.io/gym-tracker/`.

- [x] 7.1 Verify that the `web-hosting` requirements still hold:
  - `curl -sI "$SITE"` returns HTTP 200;
  - `curl -s "$SITE"` contains `<title>Gym Tracker</title>` and `<h1>Gym Tracker</h1>`;
  - `curl -s "${SITE}config.js"` is byte-identical to the committed `config.js`.
- [x] 7.2 Read-only check on a desktop browser at `$SITE`. Sign in. The workout screen shows the real sheet's title and today's date. Every `sheets.googleapis.com` request carries the production ID, as in the scenario "Live site uses the production sheet". Enter nothing: the Network tab shows no `values:batchUpdate`. Verify that the browser console shows no errors from this app's code.
- [ ] 7.3 (Manual, user) At the next workout, log it with the app on the phone. Afterwards, check in Google Sheets that today's row holds the entries in the usual notation and that no other row changed. Record in this task whether the session expired during the workout, and whether "Sign in to save" recovered it with one tap.

## Workflow follow-up

- Once group 7 passes, run `/opsx:archive` on `main`. It adds `specs/sheet-format` and `specs/todays-workout`, applies the deltas to `specs/sheet-access` and `specs/google-sign-in`, and moves this change to `openspec/changes/archive/`.
- Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `read-write-sheet` worktree and its `worktree-read-write-sheet` branch once `main` contains them.
