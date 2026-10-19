# Design

## Context

The workout screen is rendered by `today.js`:
- `startWorkout` builds one `item` per header exercise (`{ exercise, state, shown, element }`) from `buildToday` and `initialState` in `workout.js`.
- It inserts an editor `<section>` for every shown item into `#exercises`.
- It offers the rest through `#add-select`.

Each item's editor state lives in `item.state` and is updated on `input`. On `change`, `onChange(item)` marks the exercise dirty and runs the save queue, which calls `cellsFor(item.state)` and writes the two cells. `styles.css` is about 60 lines of layout with browser-default controls.

The motivation is in proposal.md. The behaviour is in `specs/todays-workout/spec.md`.

## Goals / Non-Goals

**Goals:**
- Labels and progress states are pure functions in `workout.js`, covered by Node tests like the rest of the rules.
- The save queue, `cellsFor`, `writesFor` and everything written to the sheet stay as they are.
- The styling is plain CSS with custom properties, still with no build step, framework or web font.

**Non-Goals:**
- Keeping the selected tile across reloads.
- A sticky or fixed tile bar (see Decisions).
- Animations beyond a short colour transition on tiles.

## Decisions

### Screen layout

```
+------------------------------------------+
| Gym Tracker            me@x.de [Sign out]|  header, compact, muted email
| Sheet: Gym 2026                          |  muted, small
+------------------------------------------+
| Fri 17.10.2026                           |  summary line
| 3 exercises done today      Saved        |  counter + save status (+ Retry)
|                                          |
| +--+ +--+ +--+ +--+ +--+                 |  tile grid, header order,
| |Ba| |Bu| |La| |Br| |Be|                 |  auto-fill columns,
| +--+ +--+ +--+ +--+ +--+                 |  square tiles about 3.5rem
| +--+ +--+ +--+                           |
| |Bi| |Du| |..|                           |
| +--+ +--+ +--+                           |
|                                          |
| +--------------------------------------+ |
| | Latzug                               | |  editor card for the selected
| | Weight (kg) [ 75          ]          | |  exercise, or a hint
| |  #   kg        reps                  | |  "Tap an exercise to log it."
| |  1  [ 75   ]  [ 10   ]   x           | |  when none is selected
| |  2  [ 75   ]  [  9   ]   x           | |
| | [          + Set          ]          | |
| +--------------------------------------+ |
+------------------------------------------+
```

`index.html` changes inside `#workout`:
- `#add-select` is replaced by `#summary`, which holds the counter, `#save-status` and the two existing buttons.
- `#tiles` is a `role="group"` with `aria-label="Exercises"`.
- `#exercises` becomes `#editor`, which holds at most one editor or the hint.

`#tab-missing` stays outside `#workout`, so a missing tab still hides tiles, counter and editor in one step.

- **The tile area is not sticky.** With the phone keyboard open, a pinned grid of two or three tile rows would leave almost no room for the fields. The editors are short (three to five sets), so the tiles and the status are rarely more than a short scroll away.
  - *Alternative: a sticky summary line.* It was left out for the same keyboard reason. It is easy to add later.
- **The save status moves into the summary line.** This satisfies "visible whichever exercise is open" without a second status element per editor.

### Tile labels: `tileLabels(names)` in `workout.js`
The function takes the header names in order and returns one label per name, following the spec's rule:
1. The candidate letters are the name's letters, matched with `/\p{L}/u`.
2. The first candidate is first letter + second letter. If that pair is taken (compared in lower case), it tries the first letter with each later letter in turn and takes the first unused pair.
3. If no pair is unused, the label is the first pair.
4. The label is shown as first letter upper case, second lower case.

Edge cases the spec does not cover:
- A name with one letter gets a one-letter label.
- A name with no letters gets its first two characters.

It runs once per `startWorkout`, because the header does not change while the screen is open.
- *Alternative: compute labels while rendering each tile.* Rejected, because uniqueness depends on the tiles before it, so it has to be computed over the whole list.

### Progress state: `progressOf(cells, last)` in `workout.js`
The function returns `'none' | 'done' | 'improved'` from two inputs:
- `cells`: a `{ weightText, repsText }` pair.
- `last`: the exercise's existing `last` entry from `buildToday`.

The same function serves both moments:
- **On load**, `cells` is today's cells from the sheet (`exercise.today`, or empty text when it is `null`).
- **After an edit**, `cells` is `cellsFor(item.state)` when that is `ok`.

These are the cells that are or will be in the sheet, which is exactly how the spec defines "done" and "improved". It also makes the "keep the previous state while invalid" rule fall out naturally: when `cellsFor` is not `ok`, the state is not recomputed.

Inside, using `parseWeight` and `parseReps` from `sheet-format.js`:
- **done**: `parseReps(repsText).sets.length > 0`. Unreadable entries count, so `"?, 9, 7"` is done.
- **not improved**: no `last`, or an unreadable weight or reps cell today.
- **comparison**: today's set *n* is compared with `last.reps.sets[n]`, skipping `null` positions.
  - The effective weight is `set.weight ?? weightCell ?? 0`.
  - A set beats the other when its weight is greater, or the weights are equal and its reps are greater.
- Today's sets are compared as they appear in the cell, so position *n* is the *n*-th set with reps, not the *n*-th field. This matches what "last time" will read from the sheet next time.

- *Alternative: compute from `item.state` directly.* That duplicates `cellsFor`'s parsing and validation, and empty-field compaction could drift from what is saved.

### Rendering and selection in `today.js`
- Each item gains `progress` and `label`. `shown`, `insertExercise` and `renderAddChoices` go away.
- **Tiles** are `<button type="button">` elements built once in `startWorkout`. Each has:
  - `textContent` = the label;
  - `data-state` = the progress;
  - `aria-pressed` for the selection;
  - `aria-label` = `` `${name}, ${stateText}` ``, with the state text "not done today", "done today" or "improved on last time".
  
  `renderTile(item)` updates the state attributes in place, without rebuilding.
- **Selecting a tile:**
  1. If the focused element is an input inside `#editor`, call `.blur()` first. That fires its `change` synchronously, so the edit is saved and the progress updated before the editor is replaced. This avoids relying on whether a tap on a button blurs the field, which iOS Safari does not guarantee.
  2. Rebuild `#editor` from the selected item's `state` with the existing `buildExercise`.
  3. Update `aria-pressed` on the old and new tiles.
  4. Call `#editor.scrollIntoView({ block: 'nearest' })`.
  
  Selecting the open tile again does nothing.
- **Progress update:** `onChange(item)` first runs `cellsFor(item.state)`. If that is `ok`, it sets `item.progress = progressOf(cells, last)`, then calls `renderTile(item)` and `renderCounter()`, and only then marks the exercise dirty and runs the queue. Set deletion already goes through `onChange` when it changes the cells.
- **Counter:** `renderCounter()` counts the items with a `progress` other than `'none'` and writes "1 exercise done today" or "N exercises done today". The `#summary` element is not a live region, so changes are not announced. The tile's accessible name already carries the state.
- **Hint:** with no selection, `#editor` holds a muted paragraph "Tap an exercise to log it."
- **Editor header row:** a non-list header (`#`, `kg`, `reps`) above `.sets`, using the same grid columns, with `aria-hidden="true"` because each input already has a full `aria-label`.

### Visual system in `styles.css`
Colours and sizes are custom properties on `:root`, in light mode only:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f6f8` | page background |
| `--surface` | `#ffffff` | cards, fields, "not done" tiles |
| `--text` | `#1c2230` | body text, "not done" letters, selection ring |
| `--muted` | `#646b78` | secondary text, set numbers, column headings |
| `--border` | `#e2e5ea` | field and tile borders |
| `--done` | `#2563eb` | "done" tile, primary buttons, focus ring |
| `--improved` | `#15803d` | "improved" tile |
| `--danger` | `#c62828` | invalid fields, failed save text |
| `--radius` | `0.875rem` | tiles; cards use `1rem`, fields `0.5rem` |

- **Contrast:** white on `--done` is about 5.2:1 and on `--improved` about 5.0:1. Both pass WCAG AA even for small text, and the bold letters are large text anyway. The "not done" tile uses `--text` on `--surface` with a `--border` outline.
- **Selection:** a 3px `--text` outline with 2px offset, so it reads the same on all three tile colours.
- **Keyboard focus:** a `--done` focus ring through `:focus-visible`.
- **Typography:** keeps `system-ui`. Tile letters are 1.15rem, semibold, with `letter-spacing: 0.02em`. Headings are tighter (h2 1.15rem, h3 1.05rem).
- **Controls:** buttons and fields get a consistent 2.75rem minimum height, which keeps the existing touch target. Fields keep `font-size: 1rem`, so iOS does not zoom.
  - Primary button: `--done`.
  - "+ Set": full width, secondary, with `--surface` and a `--border` outline.
  - "×": borderless, in `--muted`.
- **Grid:** `grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr))`, `aspect-ratio: 1` and a `0.5rem` gap. With a 32rem maximum width this gives 5 to 7 tiles per row on a phone and about 8 on a desktop.
- **Transitions:** tiles transition `background-color` and `color` over 150 ms, disabled under `prefers-reduced-motion: reduce`.
- **Other screens:** sign-in, checking, denied and config get the same card and button styling, with no change in content.

- *Alternative: a CSS framework or utility CDN.* Rejected, because it would add an external dependency to a page that now loads nothing from third parties except Google's sign-in script.

## Risks / Trade-offs

- **[Two-letter labels are cryptic]** With letters only, Bankdrücken and Bauchmaschine show "Ba" and "Bu". The full name appears as the editor heading and in the tile's accessible name, and icons are planned. Mitigation: a `title` attribute with the full name, for desktop hover.
- **[Colour is the only visual state cue]** Blue and green are distinguishable for the common colour-vision deficiencies at these lightness levels, and the state is in the accessible name. A small corner mark for "improved" can be added later if it proves hard to tell apart.
- **[Done or improved before the save succeeds]** The tile reflects the values on screen. If a save then fails, the tile is coloured but the summary line shows "Not saved" with "Retry", as the spec requires. This keeps the tiles responsive and leaves the failure signal in one place.
- **[Status scrolls away on long editors]** The summary line is not sticky. Editors are short, so this is accepted. See the sticky alternative under "Screen layout".
- **[Selecting a tile while a save is in progress]** The queue is keyed by exercise and does not depend on the open editor, so switching exercises during a save is safe. The existing "latest values win" behaviour still holds.

## Migration Plan

There is no data migration, because the sheet is untouched. The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the merge commit.
