# Proposal

## Why

The workout screen works, but it is a plain, browser-default list with a dropdown for adding exercises. It does not show at a glance what has been trained today or whether anything beat last time. Between sets, the user wants one quick look that answers "what's left, what's done, did I improve?", and a cleaner, more modern look overall.

## What Changes

- **Exercise tiles.** Every exercise in the header row appears as a rounded square at the top of the workout screen, in header order, labelled with two letters from its name. When two names would give the same two letters, the later one uses a different second letter so every tile stays unique. Icons may replace the letters later.
- **One exercise open at a time.** Tapping a tile opens that exercise's editor below the tiles, and the tile is marked as selected. The editor keeps today's weight and set fields, prefill and saving. Opening a tile writes nothing, as adding an exercise does today. No exercise is open when the screen loads.
- **The tiles replace the list and the "Add an exercise…" dropdown.** **BREAKING** for the screen layout only. The sheet, the notation and the saving behaviour stay the same.
- **Progress colours.** Each tile shows one of three states:
  - not done today;
  - done today, meaning at least one set with reps;
  - improved on last time, meaning at least one set beats the set at the same position last time by more weight, or by the same weight with more reps.
  
  The colour follows the values on screen as the user leaves fields or deletes sets.
- **Done counter.** The top of the screen shows how many exercises are done today.
- **Restyle.** A clean, modern light theme replaces the browser defaults: a colour palette, tile grid, a card for the editor, styled buttons and fields, and labelled `kg` and `reps` columns for the set fields. There is no dark mode.
- **Save status** moves to the top of the screen next to the counter, so a failed save is visible whichever exercise is open.

**Out of scope:**
- Icons for exercises.
- Dark mode.
- Showing last time's values or the size of an improvement anywhere except the tile colour.
- Rest timers, history, or any change to what is written to the sheet.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `todays-workout`:
  - Exercises are shown as tiles with unique two-letter labels instead of a list with an add dropdown.
  - Selecting a tile opens its editor.
  - Each tile shows not done / done / improved, and the screen counts the exercises done today.
  - The definitions of "done today" and "improved on last time" are new.
  - The requirements on today's row and the missing year tab are reworded for tiles.

## Impact

- **Modified files**:
  - `index.html`: the workout screen gets a tile area, the counter, the save status at the top and an editor area. The add dropdown goes.
  - `today.js`: renders the tiles, the selection, the counter and the tile states, and builds one editor at a time. The save queue is unchanged.
  - `workout.js`: gains pure functions for tile labels and an exercise's progress state, covered by `tests/workout.test.js`.
  - `styles.css`: rewritten.
  - `README.md`: the description of the workout screen.
- **The user's data**: unchanged. The app writes exactly what it writes today.
- **Dependencies**: none added. There is still no build step and no web fonts.
