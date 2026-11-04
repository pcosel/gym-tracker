# Proposal

## Why

When a text field has focus, its blue ring is drawn outside the field's border and reaches 5px beyond it. In the exercise editor the label sits directly on top of its field, so the ring cuts through the label text, as with "Weight (kg)". In the set table the column header is far enough away, so the problem only shows on fields with a label right above them. A field marked invalid has a 2px red border, so a red focus ring on that border would hardly show.

A field is also marked or unmarked only when the user leaves it. While typing, it can look invalid with a valid value, or valid with an invalid one.

## What Changes

- **Ring on the border.** A focused text field shows its 3px ring on its own border, inside the field's box, instead of outside it. The ring's outer edge lines up with the border's outer edge. The field keeps its size and position, and nothing around it is covered.
- **Every text field.** This applies to all text fields alike: weight, intensity, time and reps in the exercise editor, the kg and reps fields in the set table, the text fields for unreadable cells, and the Days field on the History page.
- **Thin red border while invalid.** A field marked invalid keeps its pink background, and its red border becomes 1px, as thin as the normal grey border, instead of 2px. While it has focus, its 3px ring is red instead of blue, so focus on an invalid field is clearly visible and still says that the field is invalid. Once the field is no longer marked invalid, its ring is blue again.
- **Mark while typing.** A field's invalid mark follows its content as the user types, in both directions. A weight ending in its decimal separator, such as "7,", is only marked when the field is left, because it is on its way to "7,5". Saving, the save status and the tiles still change only when the field is left.

**Out of scope:**
- The focus ring of buttons, tiles and links, which keeps its place outside the element.
- The spacing between labels and fields.
- What counts as invalid.

## Capabilities

### New Capabilities
- `text-fields`: how the app's text fields look while they have focus or are marked invalid, and when the mark appears, on every screen.

### Modified Capabilities
<!-- None. -->

## Impact

- **Modified files**:
  - `styles.css`: the focus ring of text fields, its colour while a field is marked invalid, and the invalid mark itself, whose red border becomes 1px.
  - `workout.js`: a pure function for the fields to mark, which spares a weight ending in its decimal separator while the user types.
  - `today.js`: the editor's fields mark on every keystroke, and right away when they are left.
  - `history.js`: the Days field marks on every keystroke.
  - `tests/workout.test.js`: tests for the new function.
  - `README.md`: how a marked field looks, and that the mark follows the typing.
- **The user's data**: unchanged. Nothing about reading or writing the sheet changes, and saving still waits for the field to be left.
- **Dependencies**: none added.
- **Other changes**:
  - `add-ergometer-exercise` says that typing never marks the time field. This change revises that delta, so it only says that typing does not save. The time field's mark then follows the typing, like every other field.
  - Apart from that, the new capability has no requirements in common with `add-history-analysis`, `add-ergometer-exercise` or `last-time-link-confetti`, so this change can be archived before or after any of them.
