# Proposal

## Why

The exercise tiles show two letters per exercise. They are hard to tell apart at a glance: Bankdrücken is "Ba" and Bauchmaschine "Bu", and both shoulder presses start with "S". They also look plain next to the rest of the screen. The user trains on a fixed set of 16 machines, so each of them can get its own pictogram, recognisable between sets without reading.

## What Changes

- **Icons for 16 exercises.** The tiles of the following exercises show a pictogram instead of letters:
  - Bankdrücken, Bauchmaschine, Rückenheben, Bizepsmaschine, Seitheber, Schulterpresse, Trizepspull, Ruderzug;
  - Butterfly, Beinpresse, Klimmzüge, Beinstrecker, Latzug, Duale Schulterpresse, Brustpresse, Crunchmaschine.

  The tile keeps its colours, its selection mark, its tooltip and its accessible name. The icon takes the tile's text colour, so it works on all three state colours. [icons.svg](icons.svg) shows the approved drawings.
- **Matching by name.** A header name gets an icon when it equals one of the 16 names, ignoring upper and lower case and an "(assistiert)" marker. Any other spelling, such as "Klimmzug", shows letters as before. A renamed column therefore falls back to letters visibly instead of showing a wrong icon.
- **Assisted exercises.** Any exercise can be marked as assisted with "(assistiert)" in its name, as the real sheet's "Klimmzüge (assistiert)" now is.
  - An assisted exercise shows the same icon as the exercise itself.
  - Klimmzüge is the only exception: assisted, its icon has an upward arrow for the assistance; without the marker, it shows the same figure without the arrow.
- **Letters only where there is no icon.** Every other exercise keeps the two-letter label. Labels stay unique, but only tiles that show letters count. A new "Bauchpresse" therefore shows "Ba", because Bankdrücken and Bauchmaschine now show icons.
- **Drawn for this app, not taken from a library.** No free icon set covers these machines. A search across Iconify's index of open-source icon sets (about 200,000 icons) finds nothing for leg press, lat pulldown, triceps, lateral raise, shoulder press, back extension or leg extension. Mixing the few partial matches would combine six or more styles. Instead:
  - The 16 icons follow one style, agreed with the user in review rounds at real tile size, partly against photos of the actual machines.
  - Together they are about 4 KB of SVG data inside the app's code, with no extra file, request or licence.

**Out of scope:**
- Icons anywhere else, such as the editor heading.
- Choosing or assigning icons in the app or in the sheet. An icon for a new exercise is a code change.
- Changes to the tile colours, sizes or layout, to the editor, or to what is written to the sheet.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `todays-workout`:
  - Tiles of the 16 exercises show an icon instead of a label, also when they are marked "(assistiert)".
  - Assisted Klimmzüge show an assistance arrow.
  - Label uniqueness only counts tiles that show labels.

  The tile requirements come from the change `exercise-tiles`, which is archived.

## Impact

- **New file** `icons.js`: the 16 icons as drawing data, and the lookup of an exercise name.
- **Modified files**:
  - `workout.js`:
    - the tile labels skip exercises with an icon;
    - the "(assistiert)" marker is recognised by one shared function, used by the "improved" rule and the icon lookup.

    Both are covered by `tests/workout.test.js`.
  - `today.js`: a tile shows the icon or the label.
  - `styles.css`: the icon size inside a tile.
  - `README.md`: the description of the tiles.
- **New tests** for the name lookup.
- **The user's data**: unchanged. The app writes exactly what it writes today.
- **Dependencies**: none added. There is still no build step, and nothing new is loaded from third parties.
- **Base**: `main` (`ba3f675`) holds the archived `exercise-tiles` and the assisted-exercise rule. The worktree branch is brought up to `main` before implementation.
