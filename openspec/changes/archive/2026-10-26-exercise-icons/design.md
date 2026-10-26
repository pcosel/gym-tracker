# Design

## Context

The tiles come from the change `exercise-tiles`, which is archived on `main` (`ba3f675`):
- `startWorkout` in `today.js` computes `tileLabels(names)` from `workout.js` once for all header names.
- `buildTile` writes the label with `textContent`. `renderTile` sets `data-state`, `aria-pressed`, `aria-label` and `title`.
- `styles.css` sizes the tiles at least 3.5rem square, auto-filling a grid of at most 32rem. A tile sets its text colour per state: `--text` on white, white on `--done` and `--improved`.
- `parseHeader` already trims header names.
- `buildToday` marks an exercise as assisted when its name contains "(assistiert)", ignoring case (`/\(assistiert\)/i`). Only the "improved" comparison uses the flag. The name stays as written on the tile, in the tooltip, in the accessible name and in the editor heading. The real sheet's pull-up column is now named "Klimmzüge (assistiert)".

The page loads nothing from third parties except Google's sign-in script, and has no build step. The motivation is in proposal.md, and the behaviour is in `specs/todays-workout/spec.md`.

## Goals / Non-Goals

**Goals:**
- The icon lookup and the label rule are pure functions, covered by Node tests like the rest of the rules.
- Icons are drawn with DOM APIs from constant data, and nothing is parsed as HTML.
- A future icon is one new data entry in the same style, with no other code change.

**Non-Goals:**
- An icon editor, user-chosen icons, or icons stored in the sheet.
- Hiding an icon's name from the tooltip, or other changes to the tile's accessible name.
- Animating icons.

## Decisions

### Draw the icons instead of using a library
An Iconify search found no complete set for these machines. The index covers about 200,000 icons from more than 150 open-source sets. Other sources were ruled out too:
- **Partial matches** come from six or more sets with different stroke weights, fills and grids: a bench press and a chest press from Hugeicons, a pull-up from Pinhead, a rowing machine from MingCute, biceps from Lucide.
- **Commercial stock sites** need attribution and also mix artists.
- **Muscle-group pictograms** would give 3 chest, 3 back, 2 shoulder and 2 abdominal exercises the same picture.

A library would have been copied in as SVG text anyway, because nothing may load from a CDN. So all it would have saved is the drawing, and it would have done so for about five icons.

The icons were drawn in review rounds with the user at the real tile size and in the full grid, partly against photos of the actual machines.

### Drawing style
New icons have to follow these rules, so the set stays one family:
- **Grid and stroke:**
  - 24 × 24 viewBox, no fill;
  - 2-unit stroke in `currentColor`, with round caps and joins.
- **Shapes:**
  - a filled dot of radius 2.1 is a head;
  - a ring is a weight or a pad.
- **Contacts:**
  - arms are separate strokes with a gap to the torso;
  - hands touch what they grip: handles, levers, bars, weights;
  - machine parts form one connected shape.
- **Clarity:**
  - parallel strokes keep at least one stroke width of white between them;
  - no arrows, except the assistance arrow on assisted Klimmzüge.
- **Balancing:**
  - each icon is centred on (12, 12);
  - it is scaled so the larger side of its ink box is 20.5 units;
  - stroke width and the radii of dots and rings do not scale.

The appendix holds the data after balancing, and `icons.svg` in this change shows it in the three tile states.

### `icons.js`: data plus a lookup, no DOM
`icons.js` exports two things:
- `ICONS`: an object keyed by the exercise's base name, without any "(assistiert)" marker. Each value is `{ d, dots, rings }`:
  - `d`: one SVG path with all strokes;
  - `dots`: `[cx, cy, r]` triples for heads;
  - `rings`: `[cx, cy, r]` triples for weights and pads.

  An entry may also have an `assisted` variant of the same shape, drawn for the marked name. Only Klimmzüge has one (see "Assisted exercises").
- `iconFor(name)`: returns `{ d, dots, rings }` or `null`:
  1. Split the name with `splitAssisted` from `workout.js` (see below).
  2. Look up the base name, normalised with `normalize('NFC')` and `toLowerCase()`, among the keys normalised the same way. NFC guards against a header typed with decomposed umlauts.
  3. Return the `assisted` variant when the name is assisted and the entry has one. Otherwise return the entry itself.

  The lookup map is built once when the module loads.

Because the module has no DOM code, Node tests can import it.
- *Alternative: inline SVG markup strings set with `innerHTML`.* Rejected. The data is constant, so it would be safe, but the screen's rule is that nothing is inserted as HTML, and the structured form is just as small.
- *Alternative: an SVG sprite file referenced with `<use>`.* Rejected, because it adds a file and a request, and `currentColor` inheritance through `<use>` is less obvious to maintain.
- *Alternative: `<img>` with data URLs.* Rejected, because an image cannot take the tile's `currentColor`.

### Assisted exercises: one marker rule, and an arrow only for Klimmzüge
- **One rule for the marker:** `workout.js` exports `splitAssisted(name)`. It returns:
  - `base`: the name with every "(assistiert)" removed, ignoring case, spaces collapsed and trimmed;
  - `assisted`: whether there was a marker.

  `buildToday` uses it for its `assisted` flag, with no change in behaviour, and `icons.js` imports it. That way the marker's spelling is defined in one place.
- **Same icon for the assisted variant:** "Latzug (assistiert)" shows Latzug's icon. The marker changes how "improved" is judged, not which machine it is.
- **The arrow belongs to assisted pull-ups:** the user decided that an upward assistance arrow only makes sense for Klimmzüge.
  - "Klimmzüge (assistiert)" shows the approved drawing with the arrow at the lower right.
  - "Klimmzüge" shows the same figure without the arrow, balanced like every other icon. Without the arrow, the figure is centred and about 8% larger.
- *Alternative: a generic badge, a small up-arrow in the corner of every assisted tile.* Rendered and rejected by the user.
- *Alternative: a separate key "Klimmzüge (assistiert)".* Rejected. The lookup would still need the marker normalisation for case and spacing, and the variant keeps the two drawings of one exercise together.

### Labels only for tiles without an icon: `tileLabels(names, hasIcon)`
`tileLabels` gains a second parameter, a predicate that defaults to `() => false`:
- for a name with an icon, it returns `null` and does not add anything to the taken set;
- the rule for every other name stays as it is.

The default keeps the existing tests and call shape valid. `today.js` passes `(name) => iconFor(name) !== null`.
- *Alternative: in `today.js`, compute labels for the names without icons and map them back.* Rejected, because the rule from the spec, "tiles with an icon do not take a label", would then live in untested DOM code.

### Rendering in `today.js`
- **Item:** each item gains `icon`, from `iconFor(exercise.name)`, next to `label`.
- **`buildTile`, tile with an icon:** append an `<svg>` built with `document.createElementNS`.
  - Attributes: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `aria-hidden="true"`, `focusable="false"`.
  - Contents: one `<path>` with `d`; one `<circle>` per dot with `fill="currentColor"` and `stroke="none"`; one `<circle>` per ring.
- **`buildTile`, tile without an icon:** set `textContent = label` as today.
- **`renderTile`:** unchanged. The tile's `aria-label` and `title` already carry the full name and the state, and the SVG is hidden from assistive technology.

### Size in the tile
`#tiles button svg { width: 2rem; height: 2rem; display: block; }`. The icons were reviewed at 32px in tiles of 56–59px, which is what the grid gives at 360px width and at the 32rem maximum. With `rem`, the icon keeps that proportion if the root font size changes. Letter tiles keep `font-size: 1.15rem`.

## Risks / Trade-offs

- **[A renamed header column loses its icon]** The tile falls back to letters, which is visible. The README lists the 16 names.
- **[The marker spelled differently]** A name like "Klimmzüge (assisted)" has no recognised marker:
  - its base name does not match, so it shows letters;
  - it is not treated as assisted for "improved" either, as before.

  Both are visible on the tile, and the README names the exact marker.
- **[Similar icons]**
  - Schulterpresse and Duale Schulterpresse differ by one raised hand.
  - Brustpresse and Ruderzug are both seated with an arm forward. Brustpresse has a chair backrest and a short handle. Ruderzug has a stool, a sloping thigh and a long diagonal lever.

  Both pairs were checked at real size in the full grid. The editor heading and the tooltip still name the exercise.
- **[Thin details at small sizes]** The smallest elements are the 1.4-radius rings on Seitheber, and rings in general were judged hard to read when used as pads on the chest or back. Mitigation: the remaining rings were all approved at 32px. The set is not designed for sizes below 32px.
- **[Forced-colours or high-contrast modes]** The icon uses `currentColor`, so it follows whatever text colour the browser forces on the button.
- **[Hand-written coordinates are hard to edit]** The appendix is the source of truth, and the drawing rules above say how a new icon has to look. A future icon should be drawn and reviewed the same way: at real size, in the full grid.

## Migration Plan

There is no data migration. The worktree branch starts at `4eda6c7` and has no commits of its own. Before implementation it is fast-forwarded to `main` (`ba3f675`), which holds:
- the archived `exercise-tiles` with the tile requirements this change modifies;
- the assisted-exercise rule.

The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the merge commit.

## Appendix: icon data

Balanced positions, in the order of the user's list. The keys are base names; `iconFor` matches them ignoring case and the "(assistiert)" marker. [icons.svg](icons.svg) is rendered from exactly this data.

![The 16 exercise icons in the three tile states](icons.svg)

```js
export const ICONS = {
  'Bankdrücken': {
    d: 'M7.62 14.01L15.35 14.01 M4.53 17.1L19.98 17.1 M6.59 17.1L6.59 21.22 M17.92 17.1L17.92 21.22 M15.35 14.01L18.95 12.98L19.98 21.22 M9.68 13.7L9.99 7.31',
    dots: [[5.15, 13.08, 2.1]],
    rings: [[9.99, 5.25, 2.4]],
  },
  'Bauchmaschine': {
    d: 'M7.29 10.16L13.03 13.95L13.64 7.08L19.58 7.08 M2.78 16.92L21.23 16.92',
    dots: [[5.13, 8.62, 2.1]],
  },
  'Rückenheben': {
    d: 'M2.83 17.21L10.43 10.16L17.48 7.34 M10.21 14.28L14.01 14.28 M12.05 14.28L12.05 18.83',
    dots: [[19.97, 6.36, 2.1]],
  },
  'Bizepsmaschine': {
    d: 'M5.8 7.85L5.8 14.75L10.8 14.75L10.8 21.25 M8.6 10.15L13.3 13.35L15.9 7.35',
    dots: [[5.8, 5.15, 2.1]],
    rings: [[16.9, 5.15, 2.4]],
  },
  'Seitheber': {
    d: 'M12 9.23L12 16.28 M9.29 10.32L3.54 7.5 M14.71 10.32L20.46 7.5 M8.2 21.17L8.2 16.28L15.8 16.28L15.8 21.17',
    dots: [[12, 6.41, 2.1]],
    rings: [[5.6, 4.35, 1.4], [18.4, 4.35, 1.4]],
  },
  'Schulterpresse': {
    d: 'M12 9.64L12 16.61 M9.44 10.46L6.88 8.93L6.88 2.78 M14.56 10.46L17.12 8.93L17.12 2.78 M4.83 2.78L8.93 2.78 M15.07 2.78L19.17 2.78 M8.41 21.23L8.41 16.61L15.59 16.61L15.59 21.23',
    dots: [[12, 7.08, 2.1]],
  },
  'Trizepspull': {
    d: 'M8.09 7.38L8.09 14.91L6.66 21.3 M8.09 14.91L10 21.3 M10.67 9.09L11.14 12.81L14.48 15.48 M14.48 15.48L16.2 2.7 M15.05 2.7L17.34 2.7',
    dots: [[8.09, 4.8, 2.1]],
  },
  'Ruderzug': {
    d: 'M8.06 6.6L8.06 13.06L12.3 15.99L11.5 21.24 M4.43 15.79L7.86 15.79 M10.49 8.31L16.31 8.31 M15.94 6.9L19.57 20.63',
    dots: [[8.06, 3.87, 2.1]],
  },
  'Butterfly': {
    d: 'M12 9.12L12 16.38 M9.12 9.86L4.53 8.58L8.16 2.82 M14.88 9.86L19.47 8.58L15.84 2.82 M8.26 21.18L8.26 16.38L15.74 16.38L15.74 21.18',
    dots: [[12, 6.45, 2.1]],
  },
  'Beinpresse': {
    d: 'M5.74 9.48L9.32 14.31 M2.8 11.05L7.53 17.89L13.84 17.89 M9.32 14.31L14.16 8.43L18.78 10.74 M21.2 7.37L17.2 15.15',
    dots: [[4.17, 7.27, 2.1]],
  },
  'Klimmzüge': {
    d: 'M3.37 2.83L20.63 2.83 M7.14 2.83L9.3 10.38 M16.86 2.83L14.7 10.38 M9.3 10.38L14.7 10.38 M12 10.38L12 17.39 M12 17.39L8.76 20.09 M12 17.39L15.24 20.09 M6.61 21.17L17.39 21.17',
    dots: [[12, 7.47, 2.1]],
    assisted: {
      d: 'M2.75 2.75L18.75 2.75 M6.25 2.75L8.25 9.75 M15.25 2.75L13.25 9.75 M8.25 9.75L13.25 9.75 M10.75 9.75L10.75 16.25 M10.75 16.25L7.75 18.75 M10.75 16.25L13.75 18.75 M5.75 19.75L15.75 19.75 M19.25 21.25L19.25 13.75 M17.25 15.75L19.25 13.75L21.25 15.75',
      dots: [[10.75, 7.05, 2.1]],
    },
  },
  'Beinstrecker': {
    d: 'M6.74 7.73L6.74 15.38L12.83 15.38L16.93 20.48 M2.86 18.7L10.06 18.7',
    dots: [[6.74, 4.74, 2.1]],
    rings: [[19.37, 17.15, 1.6]],
  },
  'Latzug': {
    d: 'M4.52 7.29L5.84 5.53L18.16 5.53L19.48 7.29 M12 5.53L12 2.63 M12 12.4L12 16.97 M9.71 13.19L7.42 11.78L7.42 8.08 M14.29 13.19L16.58 11.78L16.58 8.08 M8.92 21.37L8.92 17.85L15.08 17.85L15.08 21.37',
    dots: [[12, 10.02, 2.1]],
  },
  'Duale Schulterpresse': {
    d: 'M12 10.36L12 16.93 M9.58 11.13L7.17 9.68L7.17 2.72 M5.23 2.72L9.1 2.72 M14.42 11.13L16.83 9.68L16.83 6.2 M14.9 6.2L18.77 6.2 M8.62 21.28L8.62 16.93L15.38 16.93L15.38 21.28',
    dots: [[12, 7.94, 2.1]],
  },
  'Brustpresse': {
    d: 'M8.9 6.87L8.9 14.24L14.78 14.24L14.78 21.18 M4.63 6.55L4.63 17.45L11.57 17.45 M12.11 8.9L19.37 8.9 M19.37 6.23L19.37 11.57',
    dots: [[8.9, 3.99, 2.1]],
  },
  'Crunchmaschine': {
    d: 'M15.14 6.88L10.72 15.03L17.24 11.3L16.08 21.09 M6.18 17.82L13.05 17.82',
    dots: [[16.54, 4.2, 2.1]],
  },
};
```
