# Proposal

## Why

The tiles only show today: white for not done, blue for done, green for improved. At the start of a workout every tile is white, so the screen does not show which exercises the user did in the last workout. To find out, the user has to open the sheet.

## What Changes

- **Last workout on the tiles.** A tile that is not done today gets a 2px border in the "done" blue when its exercise was done in the last workout. The tile stays white, so it still reads as "not done today".
- **"The last workout" is one row.** It is the nearest workout row above today's row, or the lowest workout row if there is no row for today yet, in which at least one exercise has reps. Rows with only a date or only weights are skipped. An exercise counts as done there when its reps cell holds at least one set, as for "done today". A weight alone does not count.
- **Not the same as an exercise's "last time".** "Last time" is per exercise and reaches back as far as needed, for the prefill and the "improved" rule. The border shows only the last workout as a whole. An exercise skipped in the last workout gets no border, even though it still has a "last time".
- **No last workout, no border.** When the year's tab has no workout row with reps above today's row, as at the start of a year, no tile gets the border. The carry-over row does not count: it holds last year's final values for every exercise, not one workout.
- **Done today replaces the border.** Once the exercise has a set today, its tile turns blue or green as before. If the reps are deleted again, the tile turns white again and shows the border again.
- **Accessible name.** A tile with the border says "done in the last workout" after its state, for example "Latzug, not done today, done in the last workout".

**Out of scope:**
- The date of the last workout, or how long ago it was.
- More than one past workout, such as "done two workouts ago".
- A border on tiles that are done or improved today.
- Changes to the counter, which still counts only exercises done today.
- Changes to the editor, the prefill, the "improved" rule or anything written to the sheet.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `todays-workout`: two added requirements, for what "the last workout" is and for the border on the tiles. No existing requirement changes.

## Impact

- **Modified files**:
  - `workout.js`: `buildToday` also finds the last workout's row, and marks each exercise done there or not. Covered by `tests/workout.test.js`.
  - `today.js`: a tile carries the mark and adds it to its accessible name while not done today.
  - `styles.css`: the border.
  - `README.md`: the description of the tiles.
- **The user's data**: unchanged. The app reads the same tab once and writes exactly what it writes today.
- **Dependencies**: none added.
- **Other changes**: `exercise-icons` is complete but not archived yet, and also modifies `todays-workout`. This change only adds requirements, so the two can be archived in either order.
