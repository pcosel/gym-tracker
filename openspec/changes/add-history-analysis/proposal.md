# Proposal

## Why

The app only shows today's workout. To see how often an exercise was done lately, what it averaged, whether it is progressing, or which exercises have been left out, the user has to open the sheet and read the columns by eye. A history page in the app answers these questions on the phone, from the data the app already reads.

## What Changes

- **A History page.** The workout screen gets a "Today" / "History" switch. History shows the year so far and a list of all exercises. Tapping an exercise opens its detail. The phone's back button goes back one step, and switching back to Today keeps the open exercise and everything entered.
- **History from the editor.** Each exercise's editor on the Today page gets a "History" link that opens that exercise's detail. Going back returns to the editor as it was.
- **Year so far** (for the current year's tab): the number of workouts, sets and reps, the most-done exercise, and the biggest gain in estimated 1RM. The baseline for the gain is the carry-over row, or the exercise's first session this year when that row has no readable values for it.
- **Exercises by days since last done.** The exercise list on the History page starts with the most recently done exercises, and each entry says how long ago the exercise was last done. An arrow button reverses the order, so that the exercises not done for the longest time, and those not done this year, come first.
- **Per-exercise detail**, over a window of the last 30 days, the last 90 days, this year, or a number of days the user types:
  - how often the exercise was done in the window, and how many days ago it was last done;
  - the average per session of the total reps, and of the weight averaged over all reps of the session;
  - a graph of the estimated 1RM per session (Epley: weight × (1 + reps / 30), best set of the session). For an exercise marked "(assistiert)", the graph shows the lightest assistance per session instead, labelled "lower is better".
- **Only this year's tab.** The history never reads another tab. When a chosen window starts before 1 January, the page says that only the days since 1 January are covered, and how many. Where there is too little data for a number or the graph, the page says so instead of showing it.
- **Today counts.** The history includes today's values as the tiles count them, including sets not saved yet. Opening the history reads and writes nothing.

**Out of scope:**
- Reading previous years' tabs, and comparing against earlier years.
- A list of past sessions, personal records, rep maxima, plateau or trend hints.
- Calendar views, workouts per week, muscle groups or total tonnage.
- Tapping graph points, zooming, or exporting data.
- Opening the History page directly by URL after a reload: the app always starts on Today.
- Any other change to the Today page: the tiles, the editor's fields, the prefill, the "improved" rule and saving stay as they are, and nothing new is written to the sheet.

## Capabilities

### New Capabilities
- `workout-history`: the History page, reached from the workout screen's switch and from each exercise's editor: which data it uses, the year so far, the exercise list ordered by days since last done, and each exercise's frequency, averages and progress graph over a chosen window.

### Modified Capabilities
<!-- None. The history reads only the current year's tab, as `sheet-format` already requires. Every requirement of `todays-workout` still holds. The switch and the History link in each editor do add to the Today page, but they are specified in `workout-history`, which owns every way into the history. -->

## Impact

- **New files**:
  - `stats.js`: pure functions for sessions, windows, frequency, averages, estimated 1RM, the exercise order and the year so far. Covered by `tests/stats.test.js`.
  - `history.js`: the History page: overview, exercise detail, window choice and the SVG graph.
  - `svg.js`: the SVG element helper, moved out of `today.js` so both pages share it.
- **Modified files**:
  - `index.html`: the switch and the History container.
  - `app.js`: switching between Today and History through the URL hash.
  - `today.js`: hands the history today's current values, saves a focused field before the page switches, and adds the History link to each exercise's editor.
  - `sheet-format.js`: day arithmetic on `{ y, m, d }` dates.
  - `styles.css`: the switch, the History page and the graph.
  - `README.md`: the History page and the new files.
- **The user's data**: unchanged. The app reads the same tab once, and the history adds no request.
- **Dependencies**: none added. The graph is plain SVG.
