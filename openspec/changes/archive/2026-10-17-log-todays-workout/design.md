# Design

## Context

The app is a static page with plain ES modules and no build step (`config.js`, `auth.js`, `api.js`, `app.js`), served as-is by GitHub Pages. After sign-in, `app.js` runs an access check (`probeSpreadsheet`, title only) and shows `screen-app`, which so far holds only the sheet's title. `apiFetch` already sends any method and body, renews the token once on a 401 and turns failures into `ApiError` kinds. The archived change `connect-google-sheet` recorded that the user's phone blocks the silent token renewal, so after about an hour a request ends in `expired`.

The design relies on these facts about the gym sheet's 2026 tab:
- Row 1 holds the exercise names. Older pairs are merged across both columns (B1:C1 to Z1:AA1), and the newer ones (AB, AD, AF) are not.
- A2 holds the number 2025. Row 2 carries over the last 2025 values and is maintained by hand.
- Column A holds the dates as text (`27.08.2026`), not as date values.
- Columns B to Y are formatted as plain text, and columns Z to AG as "Automatic". In the Automatic columns, Google Sheets turned some reps entries into dates, for example AA10 holds 10 Aug 2007 shown as `10, 8, 07`. Others in the same columns stayed text.
- Typing is irregular: doubled and trailing spaces, a trailing comma (`10, 9, `), a weight without reps (H13), and in older tabs `?`, `25 (Seil)` and `10, 7,@60 7`.

The specs (`sheet-format`, `todays-workout`, and the deltas for `sheet-access` and `google-sign-in`) state the required behaviour. This document covers how to build it.

## Goals / Non-Goals

**Goals:**
- All knowledge of the sheet's layout and notation, and all prefill rules, live in two modules with no DOM or network access, so Node's test runner can cover them.
- Every save writes the complete current state of one exercise's two cells. Repeating, retrying or reordering a save therefore cannot corrupt a cell.
- Sign-in and the access check keep working as they do now. The only change is that an expired session during a save is handled on the workout screen.

**Non-Goals:**
- Keeping unsaved edits across a reload or closed tab. They live in page memory only.
- Detecting edits made in the sheet while the app is open. The last write wins (see Risks).
- A visual design. `styles.css` only makes the fields large and compact enough for a phone.
- A general Sheets client, caching or offline queueing.

## Decisions

### Module layout

```
index.html ---- styles.css
    |
  app.js ---------- boot, screen state machine, enterApp: probe -> load -> workout screen
    |
  today.js -------- workout screen: rendering, input handling, save queue, status
    |       \
    |      api.js --- apiFetch, probeSpreadsheet (+ tab titles), readTab, writeCells
    |
  workout.js ------ pure: today's model from the tab's rows, prefill, cells and writes for an exercise
    |
  sheet-format.js - pure: header, dates, weight and reps cells, column letters, ranges
```

`auth.js` stays unchanged. `config.js` gains the two configurations (see "Configurations"). `sheet-format.js` and `workout.js` import nothing from the browser, and the tests import only those two.
- *Alternative: one `today.js` that also parses.* It is shorter, but the parsing and prefill rules hold most of the edge cases, and in a DOM module they could only be tested by hand.

### Reading: the whole tab, as displayed, in one request
`readTab(title)` calls `GET /v4/spreadsheets/{id}/values/{range}` with the range `'2026'`. That is the tab title in single quotes, with any `'` doubled, then URL-encoded. It uses the default `valueRenderOption=FORMATTED_VALUE` and `majorDimension=ROWS`. The response is an array of rows with trailing empty cells and rows trimmed. Index `i` is sheet row `i + 1`, and a missing cell reads as `''`. A year is at most a few hundred rows of about 33 short strings, which comes to a few kilobytes.
- `FORMATTED_VALUE` is what makes the reps cells stored as dates readable: AA10 comes back as `"10, 8, 07"`. `UNFORMATTED_VALUE` would return the serial number 39304.
- *Alternative: read row 1, column A and today's row separately.* Prefill needs every earlier row anyway, so this only adds requests.

The access check's field mask becomes `properties.title,sheets.properties.title`. `probeSpreadsheet()` then returns `{ title, tabs }`, and `app.js` can report a missing year tab without sending a range that would fail with HTTP 400.

### Writing: `values:batchUpdate` with `RAW`, one request per save
`writeCells(tab, writes)` sends `POST /v4/spreadsheets/{id}/values:batchUpdate` with this body:

```json
{ "valueInputOption": "RAW",
  "data": [ { "range": "'2026'!A14",      "values": [["15.10.2026"]] },
            { "range": "'2026'!Z14:AA14", "values": [["75", "10"]] } ] }
```

Every value is sent as a string. `RAW` stores it unparsed as text, which fulfils "Cells are written as plain text". An empty string empties the cell. A save always names the exercise's two cells explicitly, plus `A{row}` when it creates the row, and never anything else.
- *Alternative: `USER_ENTERED`.* It behaves like typing into the sheet, including turning `12, 10, 10` into a date in the Automatic columns. What it produces also depends on the spreadsheet's locale.
- *Alternative: `values.append`.* It looks for a "table" and appends after it. With a merged header row and the carry-over row, where it lands is hard to predict, and it can insert rows. An explicit row number from the read is predictable.
- *Trade-off:* a weight written as text is left-aligned in the Automatic columns, where a typed weight becomes a right-aligned number. Those columns already mix both kinds of cell, and the proposal records this.

### Notation (`sheet-format.js`)
- **Header.** `parseHeader(row1)` walks the column indexes 1, 3, 5 and so on up to the row's length. An index whose trimmed text is non-empty becomes `{ name, weightCol: i, repsCol: i + 1 }`. Duplicate names stay separate exercises, keyed by column.
- **Dates.** A trimmed `^(\d{1,2})\.(\d{1,2})\.(\d{4})$` that forms a real calendar date. Dates are compared as `{y, m, d}`, never through `Date` with time zones. `formatDate` pads to `dd.mm.yyyy`. "Today" comes from `new Date()` once, when the screen loads.
- **Carry-over.** Row 2 only, and only if A2 trimmed matches `^\d{4}$`.
- **Weight.** Trimmed `^\d+([.,]\d+)?$` becomes a number, with a comma read as a dot. An empty cell is `null`, and anything else is unreadable. A number cell in a sheet with German locale is displayed as `17,5`, which is why a comma is accepted on reading.
- **Reps.** Split on `,`, trim each entry, drop empty entries. Each entry must match `^(\d+)(?:\s*@\s*(\d+(?:\.\d+)?))?$`. A dot is the only decimal separator after `@`, because a comma separates the sets. The result keeps one entry per position, either `{ reps, weight | null }` or `null` for an unreadable entry. Prefill can then use the readable positions of `?, 9, 7`, while the cell as a whole counts as unreadable for editing.
- **Writing.** `formatWeight(n)` is `String(n)` on a parsed number, which gives `"17.5"` and `"20"`. `formatSets(sets, weight)` joins with `", "` and adds `@w` only where a set's weight is set and differs from `weight`.
- **Ranges.** `columnLetter(index)` turns 0 into A and 26 into AA. `rangeFor(tab, row, fromCol, toCol)` builds the quoted A1 range.

### Today's model and prefill (`workout.js`)
`buildToday(rows, today)` returns `{ todayRow | null, nextRow, exercises }`. `nextRow` is `rows.length + 1`, the first row below every row that holds any value. Each exercise carries `{ name, weightCol, repsCol, today, last }`. Both `today` and `last` are a parsed cell pair, or `null`.
- **Today's row.** The topmost row (smallest row number) whose column A parses as today's date.
- **Last time.** Scan upwards from the row above `todayRow`, or from the last row when there is no today's row, down to row 3, for the first row with at least one readable set in the exercise's reps column. If none qualifies, use the carry-over row under the same condition.
- **Initial editor state.** For an exercise this is `{ mode, weight, sets[] }`. Its `mode` is `'text'` when today's weight or reps cell is unreadable, and `'sets'` otherwise.
  - The weight is today's weight if set, otherwise last time's weight.
  - The number of set fields is the largest of 3, last time's set count and today's set count.
  - Each field is `{ reps, ownWeight, placeholder }`.
    - A field with a set today takes `reps` and `ownWeight` from today's set at that position. `ownWeight` is that set's `@` weight, or empty.
    - A field without a set today has empty `reps`. Its `placeholder` is last time's reps at that position, and its `ownWeight` is last time's `@` weight there, if any.
- **Saving.** `cellsFor(state)` returns `{ weightText, repsText }`. In `'sets'` mode it keeps the fields whose reps are filled in, in order, and formats them. In `'text'` mode it returns the two texts unchanged. Validation lives here too: a weight is a non-negative number with a comma or a dot, and reps are a whole number. An invalid exercise returns an error instead of cells.
- **Writes.** `writesFor(exercise, cells, { row, creating, today })` turns an exercise's cells into the list for `writeCells`: its two cells in `row`, preceded by `A{row}` with today's date when the save creates the row. When the save would create the row and both cells are empty, the list is empty. A weight changed before the first set therefore neither writes nor creates the row.
- **Deleting a set.** `removeSet(state, index)` returns `{ state, changed }` without that field. `changed` is true only when the field held reps, since a field without reps is not part of the cells.

### Workout screen interaction (`today.js`)
- **Inputs.** Each value is an `<input type="text">`, with `inputmode="decimal"` for weights and `inputmode="numeric"` for reps.
  - *Not `type="number"`:* depending on the locale it rejects `17,5` or hands over `''` for input it cannot parse. Validation needs the raw text.
- **Set weight.** Each set row has a weight input of its own. When it is empty, its placeholder shows the exercise weight, so the set follows that weight. A value makes it the set's own weight. Clearing it returns the set to following the exercise weight.
  - With this, changing the exercise weight automatically moves every following set, exactly as editing the weight cell does in the sheet. A value equal to the exercise weight is formatted without `@`.
- **When a save starts.** The input's `change` event fires when the field is left after an edit, or on Enter. It marks that exercise as dirty and starts the queue.
- **Adding an exercise.** A `<select>` lists the header exercises that are not shown yet. Picking one inserts it at its header position with its initial state and scrolls it into view. Nothing is written until a field of it changes.
- **Deleting a set.** "×" on a set row calls `removeSet`, re-renders the exercise, and starts a save only when `changed` is true.
- **Rendering.** Everything is built with `createElement`, `textContent` and `.value`, never `innerHTML`, because exercise names and cell text come from the sheet.

### Save queue
There is one queue per page, so writes go out one at a time.
- **Coalescing.** The queue holds a set of dirty exercise keys. The worker takes one key, computes its cells from the state on screen at that moment, and sends a single `writeCells` call.
  - An edit made while that request is in flight marks the exercise dirty again, so the latest values are always written last. This fulfils "The sheet ends up with the latest values".
- **Creating the row.** While `todayRow` is `null`, a save first reads the tab again.
  - If a today's row has appeared meanwhile, for example typed by hand in the sheet, the save uses it.
  - Otherwise it uses the fresh `rows.length + 1` and adds `A{row} = today` to the same `writeCells` call.
  - When `writesFor` returns no writes, the save ends without a request, and `todayRow` stays `null`.
  - On success it records `todayRow`. That costs one extra read per day and avoids overwriting a row added in the sheet since the screen loaded.
- **Status.** One status line shows:
  - "Saving…" while anything is dirty or in flight;
  - "Saved" when everything is written;
  - "Not saved", with the error message and a "Retry" button, after a failure.
- **On failure.** The worker stops, and the failed key stays dirty. "Retry", or any new change, restarts it. There is no automatic retry loop.
- **Expired session.** When a save fails with kind `expired` or `unauthenticated`, the status says the session expired and shows "Sign in to save" instead of "Retry".
  - Its click handler calls `auth.signIn()` without awaiting anything first, which keeps the tap's popup permission. On success it restarts the queue.
  - A cancelled sign-in leaves the button and the values in place.
  - `app.js` is not involved, so the screen and its state survive.
  - *Alternative: go to the sign-in screen and replay the edits after `enterApp()`.* That re-renders from a fresh read and has to merge the edits back in. Recovering in place is simpler and keeps what the user sees.

### Screen flow
`screen-app` becomes the workout screen. It shows the date as a heading, the sheet title, the exercise list, the add-exercise control and the status line. `enterApp()` becomes:

```
[checking "Checking access..."] -- probe: title + tab titles
        |
        +-- no tab for this year --> [app: "Tab 2027 is missing -- add it in Google Sheets"]
        |
[checking "Loading today's workout..."] -- readTab
        |                    \
        ok                    error --> handleAccessError (same as a failed probe)
        |
        v
[app: workout screen]  -- saves: today.js queue, errors shown in the status line
```

A failed read goes through the existing `handleAccessError`, so the read behaves exactly like the access check, as the spec requires. Save errors never reach `handleAccessError`.

### Configurations
`config.js` holds both configurations and picks one by host:

```js
const CONFIGS = {
  production:  { CLIENT_ID: '353906…', SPREADSHEET_ID: '14FtdMI…' },  // unchanged
  development: { CLIENT_ID: '353906…', SPREADSHEET_ID: '' },          // the copy of the sheet
};
export const ENVIRONMENT = location.hostname === 'localhost' ? 'development' : 'production';
export const CONFIG = CONFIGS[ENVIRONMENT];
```

`auth.js` and `api.js` keep importing `CONFIG`. `missingConfigKeys()` checks the active configuration, and the config screen also shows `ENVIRONMENT`. Both configurations share the OAuth client, whose authorised origins already include `http://localhost:8000`. `127.0.0.1` is not a registered origin, so `localhost` is the only development host.
- **The development sheet** is a copy of the gym sheet (File > Make a copy), shared with nobody. Being a copy, it has the same tab, formats, merged headers and reps cells stored as dates, so local testing meets the real quirks.
- *Alternative: a git-ignored `config.local.js`.* An ES module cannot import a file that may not exist without a 404 on the live site. The development ID is no more secret than the production ID.
- *Alternative: a `?sheet=` URL parameter.* It contradicts "offers no way to choose a different spreadsheet", and a shared link could point the app at the wrong sheet.

### Tests
`package.json` is `{ "private": true, "type": "module", "scripts": { "test": "node --test tests/" } }`. Node 20 needs `"type": "module"` to load the `.js` files as ES modules, and browsers ignore the file. `tests/sheet-format.test.js` and `tests/workout.test.js` use `node:test` and `node:assert/strict`, with strings shaped like the sheet's cells and the spec scenarios as cases. `npm test` was checked to run a `tests/` folder of ES module tests on the installed Node 20.10.
- *Alternative: a test framework such as Vitest.* It adds a dependency and `node_modules` to a repository that has none.

## Risks / Trade-offs

- **[The sheet edited by hand while the app is open]** The app reads the tab only on load, and when it creates today's row. An exercise changed in the sheet and then saved from a stale screen is overwritten. → This is accepted for a single user. Reloading picks up the sheet's current state. Each save covers only one exercise's two cells, so other exercises are never affected.
- **[Unsaved edits are lost on reload]** If the page closes while a save is failing, those values are gone. → The status line makes "Not saved" visible. Offline persistence is a non-goal.
- **[Several rows with today's date]** For example, the user typed one by hand. → The topmost one is used. The spec makes this deterministic, and nothing is merged.
- **[Text weights in the Automatic columns]** These cells are left-aligned. → This is accepted. If the user wants a uniform look, formatting Z:AG as plain text in the sheet fixes it for typed entries too, and the app works either way.
- **[Locale]** Formatted values follow the spreadsheet's locale, so a number weight can arrive as `17,5`. → The weight parser accepts a comma. Reps are integers and cannot be affected. The `@` weights the user types use a dot.
- **[Session expiry at the gym]** The phone blocks silent renewal, so after about an hour the first save fails. → It is recovered in place with one tap (see "Save queue"), with no lost values and no account chooser.
- **[Development sheet drifts from production]** The copy holds the 2026 data from the day it was made. → That does not matter for testing. Make a fresh copy if the real sheet's layout changes.

## Migration Plan

1. (Manual, user) Make the development copy of the gym sheet and hand over its ID. Until it is in `config.js`, `localhost` shows "Not configured (development)". The live site is unaffected.
2. Implement in the current worktree `read-write-sheet`, on branch `worktree-read-write-sheet`, which is identical to `main` when this change starts. Commit there.
3. Run `npm test`, then verify at `http://localhost:8000` against the development sheet.
4. Fast-forward `main` to the worktree branch. The user pushes `main`, which deploys Pages.
5. Live verification. First a read-only check on the live site: open the workout screen and enter nothing. Then the user's next real workout on the phone serves as the write check.

**Rollback:** Revert the merged commits on `main` and push. Cells the app already wrote use the sheet's own notation, so the data needs no clean-up.
