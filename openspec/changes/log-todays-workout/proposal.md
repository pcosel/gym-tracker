# Proposal

## Why

Gym Tracker can sign in and reach the gym sheet, but it shows nothing from it. Today the user logs each workout by typing weights, commas and `@` signs into small cells on a phone. This change makes the app useful at the gym. It opens today's workout, prefilled from the last time, and saves each set into the sheet in exactly the notation the user already uses. The sheet stays the only store, and editing it by hand keeps working.

## What Changes

- **Today's workout.** After the access check, the app reads the tab for the current year (for example `2026`) and looks for the row whose date in column A is today. It shows the sheet's title, every exercise that has values today, and a way to add any other exercise from the header row. This screen fills the connected screen, which so far showed only the title.
- **Editing sets.** Each exercise has one weight field and one field per set. A set can carry its own weight, which the sheet writes as `reps@weight`. There are at least three set fields, as many as last time if that was more, and "+ Set" adds one.
- **Prefill from last time.** "Last time" is the most recent earlier row this year with reps for that exercise. If there is none, the app uses the carry-over row 2, which the user maintains by hand. The exercise weight and each set's own weight are copied as values. Last time's reps appear only as placeholders.
- **Saving.** Each change is written when the user leaves the field, and a status shows saving, saved or failed. Today's row is created together with the first saved value, so opening the app without training writes nothing. A save writes only the edited exercise's two cells, plus the date cell when it creates the row.
- **Sheet format.** The app reads the layout and notation from the sheet itself and does not hard-code them: the exercises come from the header row, each as a pair of weight and reps columns, and sets use the `@` notation. Cells are read as displayed and written as plain text, so Google Sheets never turns `12, 10, 10` into a date. Cells the app does not edit stay untouched, and a cell it cannot read is edited as plain text.
- **Session expiring mid-workout.** The token lasts about an hour, and the user's phone blocks silent renewal. If a save then fails because the session expired, the screen stays as it is with the unsaved values and offers a one-tap sign-in that retries the save. The app does not switch to the sign-in screen.
- **Production and development configurations.** `config.js` keeps the production values unchanged and adds a development configuration with its own spreadsheet ID. That ID belongs to a copy of the gym sheet that the user creates. `http://localhost:8000` uses the development configuration and the live site uses production, so testing never writes to the real sheet.
- **Automated tests** for reading and writing the sheet's notation and for the prefill rules, run with Node's built-in test runner through `npm test`. A `package.json` marks the files as ES modules and defines that script. There are no dependencies and still no build step.
- **Phone layout.** A small stylesheet makes the editor usable on a phone screen.
- **README.** It describes the sheet format, the workout screen, the two configurations and the tests.

**Out of scope:**
- History, and editing workouts from earlier days.
- Writing or maintaining the carry-over row.
- Creating year tabs or adding exercise columns to the sheet.
- Reading tabs before 2026, whose formats differ.
- Notes such as `25 (Seil)` in the set editor. They stay possible through the plain-text fallback.
- Deleting today's row.
- Saving without a connection.

## Capabilities

### New Capabilities
- `sheet-format`: How the gym sheet is laid out and how the app reads and writes it:
  - one tab per year;
  - exercises as weight and reps column pairs named in the header row;
  - the roles of the rows (header, carry-over, one row per workout day);
  - the weight and reps notation with `@` weights;
  - reading cells as displayed, writing them as plain text, and leaving untouched cells alone.
- `todays-workout`: The screen for the current day's workout. It covers finding or creating today's row, which exercises are shown, the set fields, prefill from last time, saving each change, and how failures are reported.

### Modified Capabilities
- `sheet-access`: The app has a production and a development configuration, chosen by the site address, rather than exactly one. The "Not configured" screen reports the blank settings of the active configuration.
- `google-sign-in`: When a save on the workout screen meets an expired session that cannot be renewed silently, the app stays on that screen and offers sign-in there. Other requests still return to the sign-in screen.

## Impact

- **New files**:
  - `sheet-format.js`: parses and writes the notation, with no I/O.
  - `workout.js`: builds today's workout from the tab's values and turns edits into cell writes, also with no I/O.
  - `today.js`: renders the workout screen and runs the save queue.
  - `styles.css`, `package.json`, and tests under `tests/`.
- **Modified files**:
  - `config.js` holds the two configurations.
  - `api.js` gains reading a tab and writing cells, and the access check also returns the tab titles.
  - `app.js` loads today's workout after the access check.
  - `index.html` adds the workout screen and the stylesheet.
  - `README.md`.
- **Google Sheets API**: The app adds `spreadsheets.values.get` and `spreadsheets.values.batchUpdate` with `valueInputOption=RAW`. The access check's field mask adds the tab titles. No new scopes are needed, because `spreadsheets` already allows writing.
- **The user's data**: The app now writes into the gym sheet, but only into today's row and only the cells of exercises edited in the app. Cells it writes are text, so in the columns formatted as "Automatic" (Latzug and the columns after it) they are left-aligned. Those columns already mix text and numbers.
- **Manual step**: The user creates the development sheet by copying the gym sheet and hands over its ID. Until then, `localhost` shows "Not configured".
- **Tooling**: Node.js runs the tests (v20 is installed). GitHub Pages also serves `package.json` and `tests/`, which is harmless because they hold no secrets and made-up data.
