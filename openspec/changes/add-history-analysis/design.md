# Design

## Context

The motivation is in proposal.md, and the behaviour is in `specs/workout-history/spec.md`. The code this builds on:
- **`app.js`:** `enterApp` reads the year's tab once with `readTab` and hands the rows to `startWorkout({ tab, rows, today })`. `today` is the device date when the screen loaded, as `{ y, m, d }`.
- **`today.js`:**
  - keeps module state: one `item` per exercise, with `exercise` (from `buildToday`), the editor `state` and the tile's `progress`;
  - `onChange` computes `cellsFor(item.state)` and, only when the cells are valid, updates `progress` and the tile. These are the cells the tile counts;
  - `buildExercise` builds the open exercise's editor, in either mode, as a `section` that starts with the exercise name as `h3`;
  - `selectItem` blurs a focused editor field first, so that its `change` fires before the editor goes;
  - holds the `svgElement` and `buildIcon` helpers that draw the tile icons.
- **`workout.js` and `sheet-format.js`:** these hold the rules the history reuses: `parseHeader`, `hasCarryOverRow`, `parseDate`, `parseWeight`, `parseReps`, `formatDate`, `formatWeight` and `splitAssisted`. A set's weight is `set.weight ?? cellWeight ?? 0`, as in `progressOf`.
- **`index.html`:** `#screen-app` holds the date, the sheet line, `#tab-missing` and `#workout`. `#workout` holds `#summary` (the counter and the save status), `#tiles` and `#editor`.
- **Tests:** `node:test` with made-up rows built by a `tab()` helper in `tests/workout.test.js`.

## Goals / Non-Goals

**Goals:**
- Every number on the History page comes from pure functions in a new `stats.js`, covered by Node tests like `workout.js`. `history.js` only renders.
- The history works offline at the gym: it sends no request and adds no dependency.
- The Today page's code changes only where the two pages meet.

**Non-Goals:**
- Caching or incremental updates. A tab holds a few hundred rows, so everything is recomputed whenever the History page renders.
- A router. Two hash forms are enough.
- Opening the History page directly by URL after a reload.

## Decisions

### Feed the history the loaded rows, with today's row taken from the tiles
`today.js` keeps the rows passed to `startWorkout`, and the index of today's row among them, if there is one. Each item gains `cells`, which is `{ weightText, repsText }`:
- It starts with today's cells from the sheet, or with two empty strings.
- `onChange` updates it whenever `cellsFor` is valid, at the same moment as `progress`. `cells` therefore always matches what the tile counts, including values not saved yet. While a field is invalid, the previous cells stay.

A new export, `currentRows()`, returns a copy of the rows with one row for today: column A holds `formatDate(today)`, and each exercise's two columns hold its `cells`. This row replaces the loaded row for today, or is appended when there is none. Its position does not matter, because `stats.js` goes by date. The patching itself is a pure function in `stats.js`, `withToday(rows, today, entries)`, where `entries` lists each exercise's columns and cells. `currentRows()` only collects the entries, so a test covers the rule.

- *Alternative: read the tab again when the History page opens.* Rejected. It is a request, it fails offline at the gym, and it misses values that are not saved yet.
- *Alternative: pass today's cells to `stats.js` as a second argument.* Rejected. Every statistic would then need two code paths. Patched rows keep `stats.js` a function of rows only, like `buildToday`.

### `stats.js`: collect sessions once, then derive each number
`historyOf(rows, today)` parses the tab once:
- **Counted rows:** the header and the carry-over row are parsed as in `buildToday`. Workout rows count only when they are dated from 1 January of `today.y` up to `today`.
- **Sessions:** for each exercise, the counted rows in which its reps cell has at least one entry, sorted by date. Rows with the same date keep their row order. Each session keeps its date, its day number, the parsed weight and reps, and `readable`, which is true when neither cell is unreadable.
- **Baseline:** for each exercise, the carry-over row's parsed cells, used only for the biggest gain.
- **Workouts:** the counted rows in which any exercise has a session.

The other functions take this result:

| Function | Returns |
|---|---|
| `withToday(rows, today, entries)` | a copy of the rows with today's row taken from the tiles, as above |
| `windowOf(today, choice)` | for `{ days: N }` or `'year'`: the first and last day, the covered first day, i.e. the later of the window's first day and 1 January, the number of covered days, and `partial` |
| `daysSinceLastDone(exercise, today)` | days since the latest session, or `null` |
| `exerciseOrder(history, today, direction)` | the exercises in list order, most recent first or longest ago first |
| `summaryOf(exercise, window)` | the session count, the averages, the number left out, and the graph points |
| `yearSoFar(history)` | workouts, sets, reps, the most-done exercises and the biggest gain |

`estimatedMax(session)` and `lightestAssistance(session)` compute one session's graph value. They use the shared set-weight rule.

A session is a row, not a distinct date, so two rows with the same date count twice. The app writes one row per day, and "the last workout" also goes by rows.

- *Alternative: extend `buildToday`.* Rejected. `buildToday` scans upward from today for one entry per exercise. The history needs every session of the year. Keeping the two apart leaves the Today page's rules untouched.

### Dates as day numbers
`sheet-format.js` gains `dayNumber({ y, m, d })`, which is `Date.UTC(y, m - 1, d) / 86400000`, and its inverse `fromDayNumber(n)`:
- **Day differences:** subtracting two day numbers gives the difference in days.
- **A window of N days:** it starts at `dayNumber(today) - (N - 1)`.
- **This year:** it starts at `dayNumber({ y: today.y, m: 1, d: 1 })`.

UTC never shifts across daylight saving time. Dates otherwise stay `{ y, m, d }`, as the comment in `sheet-format.js` requires.

### Averages: per-session values, then their mean
For each readable session in the window:
- **Total reps:** the sum of the reps of its sets.
- **Weight:** the sum of `reps × setWeight` divided by the total reps.

The detail shows the mean of each value over the sessions. A readable session whose total is 0 reps adds 0 to the reps average and nothing to the weight average. Values are rounded with `Math.round(x * 10) / 10` and printed with `formatWeight`, so they read like the sheet: "77.5", "30".

- *Alternative: one mean over all reps of the window.* Rejected. The user chose "per session", and with a single mean, a long session would outweigh short ones.

### Estimated 1RM with Epley
A set's estimated 1RM is `setWeight × (1 + reps / 30)`. A session's value is the highest among its sets with a weight above 0 and at least 1 rep. A session without such a set gives no point. The biggest gain uses the same value.
- **Baseline:** the carry-over row when it is readable and gives a value, otherwise the earliest session that gives one.
- **"Latest":** the last session that gives a value and is not the baseline session itself.
- **Gain:** `Math.round((to - from) / from × 100)`, shown only when positive. Among equal gains, the first exercise in header order wins.

For assisted exercises, the graph value is instead the lowest `setWeight` in the session, so 0 means no assistance. Assisted exercises never take part in the biggest gain.

- *Alternative: Brzycki, `w × 36 / (37 - r)`.* Rejected. It grows steeply above 20 reps and breaks down at 37, and the sheet holds 15-rep sets.
- *Alternative: plot the heaviest weight.* Rejected during exploration. It stays flat for weeks, because most of the progress is in the reps.
- **Accepted bias:** Epley gives 1.033 × w for a single rep, and it overestimates at high reps. The bias is consistent across sessions, and the graph shows a trend, not a true maximum.

### Exercise order and the arrow button
`daysSinceLastDone` returns `null` for an exercise not done this year. `exerciseOrder` sorts by that value:
- **Most recent first (the default):** ascending, with `null` last.
- **Longest ago first:** descending, with `null` first.

Ties are broken by name, with one shared `Intl.Collator('de', { sensitivity: 'base' })`:
- **German collation:** an umlaut sorts as its base letter, so "Rückenheben" comes before "Ruderzug". Comparing strings with `<` compares code points and would put "ü" after every unaccented letter.
- **`sensitivity: 'base'`:** case is ignored, so "LATZUG" and "Latzug" compare equal.
- **Both directions:** each direction is a comparator of its own: days since last done in that direction, then the name from A to Z. Reversing one sorted list would reverse the names too.
- **Equal names:** `Array.prototype.sort` is stable, so only exercises with the same name keep header order.

`yearSoFar` orders the names of the most-done exercises with the same collator.

- *Alternative: header order for ties.* Rejected by the user. Alphabetical order is easier to scan.

The direction is module state in `history.js`, next to the window, and starts as most recent first. The button sits in one row with the "Exercises" heading:
- **Icon:** an arrow beside three bars of falling length, drawn with `buildIcon` from `svg.js` in the style of the exercise icons: 24×24, 2px round strokes, `currentColor`. There are two path definitions, arrow down for most recent first and arrow up for longest ago first.
- **Name:** `aria-label` and `title` are "Most recent first" or "Longest ago first", for the order shown. These strings never appear on screen.
- **Tap target:** at least 2.75rem, like every `button`.
- **Selecting it:** flips the direction and renders the list again. The button is outside the list, so it keeps focus.

The two icons live in `history.js`, not in `icons.js`. `icons.js` holds only exercise icons, and its tests check that no two of them are the same.

- *Alternative: two text buttons, "Recent first" and "Longest ago first".* Rejected. The user wants the control without visible words.
- *Alternative: two icon buttons, one per direction.* Rejected. One toggle is simpler, and a lone arrow in a pair of buttons is ambiguous.

### Navigation through the URL hash
- **The views:** Today has no hash, the History page is `#history`, and an exercise's detail is `#history/<encodeURIComponent(name)>`.
- **The switch:** it is two links, `href="#"` and `href="#history"`. Each exercise in the list and the History link in each editor are links too. Every navigation is therefore a browser-history entry with no extra code, and the phone's back button walks back through them.
- **Rendering:** `app.js` listens for `hashchange` and shows the view that matches the hash.
- **The detail's back control:** it is labelled "Back" and always calls `history.back()`, so it returns to the list or to the editor, whichever the detail was opened from. A reload clears the hash and starts on Today, so every detail has a previous view inside the app.
- **On load:** `enterApp` clears a leftover hash with `history.replaceState` before showing Today, so a reload always starts on Today.
- **Unexpected hashes:** a name that matches no exercise, or a malformed `%` sequence, shows the list. If two exercises have the same name, the first in header order wins.
- **Missing year tab:** the hash is ignored when the tab is missing.

Before it renders the History page, the `hashchange` handler blurs a focused field in `#editor`, as `selectItem` does. Its `change` event fires synchronously, so `onChange` updates `cells` before `currentRows()` is read. This covers the switch, the back button and edited URLs alike.

- *Alternative: in-memory view state without the hash.* Rejected. The phone's back button would leave the app.
- *Alternative: `pushState` with paths such as `/history`.* Rejected. GitHub Pages answers a reload of such a path with 404.

### Page layout: History sits inside `#workout`
`#workout` becomes:
- `nav#page-switch` with the two links. The current one has `aria-current="page"`;
- `#summary`, unchanged and shown on both pages, so the save status, Retry and "Sign in to save" stay visible during the history;
- `#today-view`, wrapping `#tiles` and `#editor`;
- `#history`, hidden on Today.

Switching only toggles `hidden` on `#today-view` and `#history`, so the editor's DOM and the module state in `today.js` stay as they are. `showMissingTab` already hides `#workout`, so the switch disappears with it.

### A History link in each editor
`buildExercise` puts the `h3` and an `<a href="#history/<encodeURIComponent(name)>">History</a>` into one row, in both editor modes:
- **Accessible name:** the link's `aria-label` is "History of <name>", because the visible "History" alone would not say which exercise.
- **Navigation:** opening the link goes through the same `hashchange` handler as the list. It blurs a focused field first, so a typed set is saved and counted. Nothing in `today.js` reacts to the link itself.
- **Coming back:** the detail's "Back" or the browser's back button returns to an empty hash. The Today view is shown again, with the editor DOM it had, because switching only toggles `hidden`.

- *Alternative: open the history with a long press on the tile.* Rejected. Nobody would discover it, and it competes with the tap that selects the tile.
- *Alternative: a short history inside the editor.* Rejected. It would duplicate the detail, with a second layout to keep in step.

### `history.js` renders, `svg.js` is shared
- **`svg.js`:** `svgElement` and `buildIcon` move here from `today.js`, so the exercise list can show the same icons.
- **`showHistory({ rows, today, tab, name })`:** renders the overview, or the detail when `name` matches an exercise.
- **Window:** the chosen window is module state in `history.js`, starting as `{ days: 30 }`. It lasts until the page reloads.
- **Window controls:** three buttons with `aria-pressed`, and a text input with `inputmode="numeric"` labelled "Days". The input applies on `change`, and takes a whole number of at least 1. Other input gets `aria-invalid` and leaves the window as it was.
- **Sheet text:** it is set only through `textContent`, as on the Today page.

Wording, so that list and detail agree:
- **Last done:** "today", "yesterday", "N days ago", or "not done this year".
- **Frequency:** "Done 4 times in the last 30 days", "Done once this year", "Not done in the last 30 days".
- **Coverage note:** "Only 15 of the last 30 days are covered, those since 01.01.2027. Earlier workouts are in the tab "2026", which the history does not read."

### The graph is inline SVG
- **Size:** `viewBox="0 0 320 180"`, `width: 100%`, and a fixed aspect ratio so the text does not stretch. Margins hold the labels.
- **x-axis:** linear in day number from the covered first day to today. If the window covers only 1 day, the span is set to 1 day so nothing is divided by 0.
- **y-axis:** from the lowest to the highest value, with 10% padding. Equal values get ±1 kg.
- **Marks:** a `polyline` and one `circle` per point, in `currentColor` set to `--done` in CSS.
- **Labels:** the lowest and highest value on the left, and the first and last day of the axis as `dd.mm.` below.
- **Caption:** above the graph, "Estimated 1RM (kg)", or "Assistance (kg), lower is better".
- **Text alternative:** `role="img"` with an `aria-label` built from the points, for example "Estimated 1RM over 4 sessions, from 100 kg on 01.10.2026 to 105 kg on 13.10.2026".

- *Alternative: a chart library from a CDN.* Rejected. The app has no dependencies and no build step, and one line with points is a few dozen lines of SVG.
- *Alternative: `<canvas>`.* Rejected. It has no DOM text for labels or screen readers, and it blurs when scaled.

## Risks / Trade-offs

- **[A workout in progress counts as a session]** Mid-workout, today's session lowers the averages and the graph's last point. The spec requires today's values to count, and the drop recovers as sets are entered → accepted.
- **[Epley at high reps]** The estimates are too high for 15+ rep sets, but consistently so → accepted. The README says that the graph shows a trend.
- **[Little data in January]** The coverage note explains why → accepted, as the user decided not to read the previous year.
- **[Two rows with the same date]** They count as two sessions. The app writes one row per day → accepted.
- **[Many exercises tie for most done]** The line names all of them and wraps → accepted.
- **[Text in the SVG scales with its width]** It is about 1:1 on a phone and about 1.6× at the 32rem desktop width → checked on `localhost` (task 4.4).
- **[Back from Today leaves the app]** This is unchanged from today → accepted.
- **[Values edited in the sheet during the session]** They appear after a reload, as on the Today page → accepted.

## Migration Plan

There is no data migration. The work happens in the `add-history-analysis` worktree, on branch `worktree-add-history-analysis`, which starts at `main`'s head (`3f6855a`). The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the merge.
