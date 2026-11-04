# Proposal

## Why

When a text field has focus, its blue ring is drawn outside the field's border and reaches 5px beyond it. In the exercise editor the label sits directly on top of its field, so the ring cuts through the label text, as with "Weight (kg)". In the set table the column header is far enough away, so the problem only shows on fields with a label right above them.

## What Changes

- **Ring on the border.** A focused text field shows its 3px ring on its own border, inside the field's box, instead of outside it. The ring's outer edge lines up with the border's outer edge. The field keeps its size and position, and nothing around it is covered.
- **Every text field.** This applies to all text fields alike: weight, intensity, time and reps in the exercise editor, the kg and reps fields in the set table, the text fields for unreadable cells, and the Days field on the History page.
- **Red ring while invalid.** A field marked invalid already has a red border and a pink background. While it has focus, its ring is red instead of blue, so the ring does not hide that the field is invalid. Once the field is no longer marked invalid, its ring is blue again.

**Out of scope:**
- The focus ring of buttons, tiles and links, which keeps its place outside the element.
- The spacing between labels and fields.
- When a field is marked invalid, and what counts as invalid.

## Capabilities

### New Capabilities
- `text-fields`: how the app's text fields look while they have focus or are marked invalid, on every screen.

### Modified Capabilities
<!-- None. -->

## Impact

- **Modified files**:
  - `styles.css`: the focus ring of text fields, and its colour while a field is marked invalid.
  - `README.md`: one sentence on the ring of a marked field.
- **Scripts**: unchanged. No JavaScript changes, so `npm test` covers nothing new.
- **The user's data**: unchanged. Nothing about reading or writing the sheet changes.
- **Dependencies**: none added.
- **Other changes**: the new capability has no requirements in common with `add-history-analysis`, `add-ergometer-exercise` or `last-time-link-confetti`, so this change can be archived before or after any of them.
