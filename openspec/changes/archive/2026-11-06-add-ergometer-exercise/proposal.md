# Proposal

## Why

The user now trains on a stationary bike ergometer and has added an "Ergometer" column pair to both the development and the production sheet. Ergometer does not fit the weight-and-sets notation: its first cell holds a whole-number intensity and its second cell one time as minutes and seconds, such as "3:30". Today the app reads "3:30" as an unreadable reps cell. Ergometer would therefore always open as two plain text fields, never get a last time or a prefill, never turn green, and give nothing in the History averages or graph.

## What Changes

- **A timed exercise.** An exercise named "Ergometer", ignoring case, is a timed exercise. Its column pair is intensity first, time second, instead of weight and reps.
- **Sheet notation for timed exercises.**
  - The intensity cell holds one whole number, with no unit.
  - The time cell holds minutes and seconds as `m:ss`, such as "3:30" or "12:05". Leading zeros of the minutes are ignored, so a time typed by hand, which Google Sheets displays as "03:30", is read as 3:30.
  - The app writes the time as `m:ss` text, without a leading zero on the minutes.
- **The Ergometer editor.** Instead of a weight field and set fields, Ergometer shows:
  - an intensity field with no unit;
  - one time field with the numeric keypad. Typed digits are read with the last two as seconds, and the field shows them as `m:ss` while the user types: "4", "41" and "415" show as 0:04, 0:41 and 4:15.
- **Prefill.** The intensity comes from the last time as a value, and the last time's time appears as a placeholder. An intensity alone is never saved, just as a weight alone is not.
- **Tile states.**
  - Ergometer counts as done today when its time cell holds a time.
  - It counts as improved on higher intensity than last time, or on a longer time at the same intensity. Confetti and vibration follow, as for every tile.
  - "Last time" and "the last workout" use the time cell in place of the reps cell.
- **An icon.** Ergometer gets its own icon: a rider leaning forward on a stationary bike, with the flywheel at the front. It is drawn in the existing icon style and was approved by the user at real size while planning. The data is in design.md, and [ergometer-icon.svg](ergometer-icon.svg) shows it in the three tile states.
- **History.**
  - Ergometer sessions count for "last done", how often, workouts and "most done".
  - They add no sets or reps to the year so far, and Ergometer is never the biggest gain in estimated 1RM.
  - Its detail shows the average intensity and the average time per session, and a graph of the time per session.

**Out of scope:**
- Other timed or cardio exercises, and a marker in the header that makes any exercise timed. Ergometer is identified by its name.
- Distance, calories, heart rate, several intervals per day, or a unit for the intensity.
- Changing the sheet's existing Ergometer cells. Cells the app cannot read are edited as text, as for every exercise.

## Capabilities

### New Capabilities
<!-- None. Ergometer is a new kind of exercise within the existing capabilities. -->

### Modified Capabilities
- `sheet-format`: the header row gains timed exercises, whose column pair is intensity and time. New notations cover the intensity cell and the time cell, including a time typed by hand, how the app writes both cells, and when they are unreadable.
- `todays-workout`: Ergometer gets an intensity field and a time field instead of a weight field and set fields, with its own prefill, saving, validation, "done", "improved", "last time" and "last workout" rules, and a seventeenth icon.
- `workout-history`: Ergometer sessions are defined by the time cell, add no sets or reps, never count for the biggest gain, and have intensity and time averages and a time graph. This capability is still in the change `add-history-analysis`, which has to be archived before this one.

## Impact

- **Modified files**:
  - `sheet-format.js`: timed exercises in `parseHeader`, and parsing and formatting of intensity and time.
  - `workout.js`: today's entries, prefill, cells, typed-time input and the "improved" rule for a timed exercise.
  - `today.js`: the Ergometer editor with its time formatting while typing, invalid marking and tile progress.
  - `icons.js`: the Ergometer icon, copied from the appendix of design.md.
  - `stats.js` and `history.js`: timed sessions, the year so far, averages and the time graph.
  - `README.md`: the sheet notation, the Ergometer editor, the 17 icons and the History page.
  - `tests/`: new cases in all four test files.
- **The user's data**: the app writes Ergometer cells only when the user logs Ergometer, as `m:ss` text and a whole-number intensity. No other cell changes.
- **Dependencies**: none added.
