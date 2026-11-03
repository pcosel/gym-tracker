# Design

## Context

The motivation is in proposal.md, and the behaviour is in `specs/todays-workout/spec.md`. The code this builds on:
- **`buildToday(rows, today)` in `workout.js`:**
  - finds `todayRow`, the topmost row with today's date, starting at `firstWorkoutRow` (3 with a carry-over row, 2 without);
  - for each exercise, scans upward from `start` (the row above `todayRow`, or the last row) for `last`, the lowest dated row with a readable set, and falls back to the carry-over row;
  - returns `{ todayRow, nextRow, exercises }`.
- **`today.js`:**
  - `buildTile` creates each tile once;
  - `renderTile` sets `data-state`, `aria-pressed`, `aria-label` and `title`, on load, on selection, and from `onChange` when the progress changes;
  - `ensureRow` calls `buildToday` again after a re-read, but only uses `todayRow` and `nextRow`.
- **`styles.css`:**
  - tiles are `box-sizing: border-box` squares with `border: 1px solid var(--border)`, and "done" and "improved" set the border colour to their fill;
  - the selected tile has a 3px `--text` outline 2px outside the tile, and keyboard focus a 3px `--done` outline.

## Goals / Non-Goals

**Goals:**
- The rule for "the last workout" is a pure function in `workout.js`, covered by Node tests like the other rules.
- The border follows the tile's state through CSS, with no extra bookkeeping in `today.js`.

**Non-Goals:**
- Recomputing the last workout during the session.
- Any change to `last`, the prefill or `progressOf`.

## Decisions

### Find the last workout in `buildToday`, from the reps cells
`buildToday` parses the header once, before the exercises are mapped. Then:
1. **`lastWorkoutRow`:** scan from `start` down to `firstWorkoutRow`, the same range as for `last`. Skip rows without a date. The first row in which any exercise's reps cell has at least one entry (`parseReps(text).sets.length > 0`) is the last workout. Without one, `lastWorkoutRow` is `null`.
2. **`doneLastWorkout`:** each exercise gains this flag. It is true when `lastWorkoutRow` is set and the exercise's reps cell in that row has at least one entry.
3. **Return value:** it gains `lastWorkoutRow`, so tests can check the row itself.

The scan never reaches the carry-over row, because `firstWorkoutRow` is already 3 when there is one. Entries count whether readable or not, as for "done today" in `progressOf`.

- *Alternative: `doneLastWorkout = exercise.last?.row === lastWorkoutRow`.* Rejected. `last` needs a readable set, so a cell holding only "?" would count as done in the last workout but would not be its last time. `last` can also be the carry-over row. Each rule keeps its own wording from the spec.
- *Alternative: compute it in `today.js`.* Rejected, because the rule would then live in untested DOM code.

### Computed once, on load
The last workout lies above today's row, and the app only ever writes today's row, so saves cannot change it. The re-read in `ensureRow` leaves it alone, just as it leaves `last` alone.

### A data attribute, styled together with the state
`renderTile` calls `tile.toggleAttribute('data-last-workout', exercise.doneLastWorkout)`. Every tile attribute is then set in one function, as `title` already is although it never changes. One CSS rule draws the border:

```css
#tiles button[data-state="none"][data-last-workout] { border: 2px solid var(--done); }
```

Because the selector includes `data-state="none"`, the border disappears when the tile turns "done" or "improved" and comes back when it returns to "none". `onChange` already re-renders the tile on both of those changes.

- **Width:** 2px, as the user chose, so it can be told apart from the 1px grey border at arm's length.
- **Tile size:** with `border-box` the tile keeps its size, and the centred icon or label does not move.
- **Contrast:** `--done` on white is about 5.2:1, above the 3:1 needed for a UI element.
- **State to "done":** the tile goes from a 2px blue border to a blue fill with a 1px blue border, so no colour jumps. The transition list stays as it is.

- *Alternative: a fourth `data-state` value such as `last`.* Rejected. `data-state` is today's progress, and the last workout is independent of it. Two attributes keep both facts readable, and CSS combines them.
- *Alternative: an inset `box-shadow` instead of a wider border.* Rejected. The user asked for a border, and forced-colours mode removes box shadows but keeps the border's width.

### Accessible name
`renderTile` adds ", done in the last workout" to the name and state when the progress is `none` and `doneLastWorkout` is true. An example is "Latzug, not done today, done in the last workout". `title` stays the exercise name.

- *Alternative: mention it on done and improved tiles as well.* Rejected. The name would then say more than the tile shows, and the spec ties the phrase to the border.

## Risks / Trade-offs

- **[A workout split across two rows of the same date]** Only the lower row counts. The app writes one row per day, so this happens only in hand-edited sheets → accepted.
- **[Rows out of date order]** The last workout goes by row position, like "last time" → accepted. The app always appends below every row.
- **[Keyboard focus on a bordered tile]** The 3px blue focus outline sits 2px outside a blue border, which gives two blue lines with a gap → checked on `localhost` (task 3.2).
- **[Forced-colours mode]** The border colour is replaced by the system colour, so the mark shows only as a thicker border. The state colours are lost the same way today. The accessible name still carries the mark.
- **[A last workout weeks ago]** The border still shows it, without a date → out of scope in proposal.md.

## Migration Plan

There is no data migration. The worktree branch `worktree-highlight-last-workout` starts at `main`'s head (`6ca8262`). The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the merge commit.

The delta only adds requirements, so it can be archived before or after `exercise-icons`, which is complete and still waits to be archived.
