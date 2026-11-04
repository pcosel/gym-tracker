# Design

## Context

The motivation is in proposal.md, and the behaviour is in `specs/text-fields/spec.md`. The code this builds on:
- **Text fields:**
  - every text field in the app is an `<input type="text">`. `textInput` in `today.js` creates the editor's and the set table's fields, and `history.js` creates the Days field;
  - a field is marked invalid with `aria-invalid="true"`, and only when it is left: by `markInvalid` in `today.js`, and by the Days field's `change` handler in `history.js`;
  - in `today.js`, each field's `input` handler only copies the value into the exercise's state. Its `change` handler calls `onChange`, which updates the tile and queues the save. `saveOne` then computes `cellsFor(state)` from `workout.js`, marks the fields from its `invalid` flags, and keeps the exercise in the `invalid` set, which drives "Not saved: check the marked fields." and the marks when the exercise is opened again;
  - `rebuildExercise`, after a set is deleted, builds the editor anew without marks.
- **`styles.css`:**
  - `input[type="text"]` is a `border-box` field, at least 2.75rem high, with `padding: 0 0.5rem`, a 1px `--border` border and a 0.5rem radius;
  - `input[aria-invalid="true"]` sets a 2px `--danger` border and a `#fdecea` background;
  - one global rule draws every focus ring: `:focus-visible { outline: 3px solid var(--done); outline-offset: 2px; }`. It covers fields, buttons and links. The tiles have their own focus rules;
  - the editor's label text is a block `span` right above the field, with no gap (`.exercise label span`). The set table's column header has 0.25rem below it, and the Days label has 0.5rem.
- **Browsers:** a text field matches `:focus-visible` on every focus, from a tap or click as well, which is why the ring shows on the phone.

## Goals / Non-Goals

**Goals:**
- Two new CSS rules, scoped to text fields, and one changed rule for the invalid mark.
- The field's box, and so the layout, is the same with and without focus, and with and without the invalid mark. The text does not move either.
- The invalid mark follows every keystroke. Saving, the save status and the tiles still wait for the field to be left.

**Non-Goals:**
- Changing the global `:focus-visible` rule, which would move the ring of buttons and links as well.
- A new colour token. The rules reuse `--done` and `--danger`.
- Changing what counts as invalid.

## Decisions

### A negative outline offset, on text fields only
Directly after the global `:focus-visible` rule:

```css
/* A field's ring lies on its border, inside its box, so it never covers the label above. */
input[type="text"]:focus-visible { outline-offset: -3px; }
input[aria-invalid="true"]:focus-visible { outline-color: var(--danger); }
```

- **Geometry:** the outline's outer edge is the border edge plus offset plus width, so `-3px` with the 3px width puts it exactly on the border's outer edge. The ring covers the 3px band inside it: the 1px border, grey or red, and 2px of padding. The text keeps 6px to the ring, and the 2.75rem height leaves plenty above and below.
- **Corners:** current browsers draw an outline along the border radius. With this offset and width, the ring's outer corners have the field's 0.5rem radius.
- **Width and colour:** 3px in `--done`, as for every other focus ring in the app.
- **Cascade:** `input[type="text"]:focus-visible` (0,2,1) beats `:focus-visible` (0,1,0). The two new rules set different properties, so their order between each other does not matter.

- *Alternative: `outline-offset: 0` or `-1px`.* Rejected. The ring would still reach 3px or 2px beyond the border, onto the label's descenders.
- *Alternative: a blue border plus an inset `box-shadow`, with the outline removed.* Rejected. Forced-colours mode drops box shadows, so the focus would be left as a recoloured 1px border. The `highlight-last-workout` design rejected `box-shadow` for its tile border for the same reason.
- *Alternative: a thicker border on focus.* Rejected. The content box would shrink by a pixel or two, so the text would move unless the padding were adjusted for each state, valid and invalid.
- *Alternative: a gap between label and field.* Rejected. It changes the spacing of every editor, and the user asked for the ring on the border.

### Red ring while invalid
The user chose a red ring over a blue one for a field marked invalid. The second rule changes only the outline colour. The pink background stays, and the thin red border lies underneath the ring. The `aria-invalid` attribute already drives the red border and the pink background, so the ring follows it: it turns blue as soon as the field's content is valid again (see "Marking while typing").

- **Contrast:** `--danger` (`#c62828`) is about 5.6:1 against the white card around the field and about 4.9:1 against the pink background, above the 3:1 needed for a UI element. `--done` on white is about 5.2:1.

### Invalid mark: thin red border, pink background
The invalid rule changes only the border's colour, not its width:

```css
input[aria-invalid="true"] { border-color: var(--danger); background: #fdecea; }
```

It replaces `border: 2px solid var(--danger)`, so a marked field keeps the 1px width from `input[type="text"]`, in red.

- **Why:** in task 2.4, the user found a focused invalid field (3px red ring) too hard to tell from an unfocused one (2px red border). In task 2.6, with a grey border and only the pink background, the user preferred a red border. A 1px red border keeps the mark visible, and focus shows as a ring three times as thick.
- **Geometry:** the border stays 1px wide, so the text no longer moves by 1px when a field is marked invalid.
- **Contrast:** the red border is about 5.6:1 against the white card, so the mark no longer depends on the pink background, which is only about 1.1:1.

- *Alternative: the 2px red border, as before.* Rejected in task 2.4. It looks too much like the focused field's ring.
- *Alternative: the grey border with only the pink background.* Implemented in task 2.5, and rejected by the user in task 2.6 in favour of a red border.
- *Alternative: a transparent 1px border, or `border: none`.* Rejected. The mark would rest on the faint pink alone, and `border: none` would also move the text by 1px.

### Marking while typing
The user found that a field which is marked only when it is left looks wrong while typing: red with a valid value, or plain with an invalid one. The mark now follows the content.

- **`invalidFields(state, { typing })` in `workout.js`:** returns the `invalid` flags of `cellsFor(state)`, or `null` when nothing is invalid. With `typing: true`, a weight or a set's own weight that is digits plus a trailing "," or "." (`/^\d+[.,]$/`) counts as its digits, so "7," is not marked while it is on its way to "7,5". It is a pure function, covered by tests. What counts as invalid stays in `cellsFor`.
- **`today.js`:**
  - in the 'sets' and 'timed' editors, every `input` handler marks after updating the state, with `markInvalid(item, invalidFields(item.state, { typing: true }))`. The time field marks after it has formatted its digits, so the mark matches what the field shows. The 'text' editor for unreadable cells never marks, as today;
  - `onChange` marks with `invalidFields(item.state)` right away, so a field left with "7," is marked at once, without waiting for the save queue. `saveOne` keeps its marks and the `invalid` set as they are;
  - `rebuildExercise` marks the new editor with `invalidFields(item.state)`, so deleting a set no longer drops the marks of the other fields.
- **`history.js`:** the Days field's validity test moves into one helper. Its new `input` handler marks with it, and its `change` handler still applies the window. A whole number has no separator to spare.
- **Status and tiles:** unchanged. They follow the save, which still happens when the field is left.

- *Alternative: mark on every keystroke, "7," included.* Rejected by the user. The weight would flash red in the middle of every decimal.
- *Alternative: clear the mark while typing, but set it only when the field is left.* Rejected by the user. A field typed invalid would look valid until it is left.
- *Alternative: mark after a short pause in typing.* Rejected. The mark would lag behind the content, which is the problem being fixed.

## Risks / Trade-offs

- **[An invalid field has a red edge with and without focus]** Without focus, it has a 1px red border. With focus, it has a 3px red ring in the same place, plus the caret and, on the phone, the open keyboard → the user chose this in task 2.6. Task 2.8 checks that the two are easy to tell apart.
- **[Older browsers draw square outlines]** Safari before 16.4 ignores the border radius for outlines. The ring's square corners would show just outside the rounded border, but still inside the field's box, so the label stays clear → accepted.
- **[Forced-colours mode]** The system colour replaces both ring colours, so red and blue look the same. The ring still lies on the border. The red border becomes the system colour and the pink background is dropped, so without focus an invalid field looks exactly like a valid one, as both borders are 1px → accepted.
- **[A future input of another type]** It would keep the outside ring, because the rule matches `type="text"` → accepted. The spec covers every text field, so a new field type would have to follow it.
- **[The Ergometer time can flash red]** The last two digits are the seconds, so typing "39:05" passes through "3:90", which is marked until the next digit → accepted by the user. Times whose digits never put more than 59 in the seconds, such as "12:34", do not flash.
- **[Red field, status "Saved"]** While the user types an invalid value, the field is red but the status still shows the last save, because nothing has been saved or refused yet → accepted. The status changes when the field is left.

## Migration Plan

There is no data migration. The worktree branch `worktree-fix-input-label-overlap` starts at `main`'s head (`c2e6848`). The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the commit.

The delta only adds a new capability, so it can be archived before or after the other open changes. The revised `add-ergometer-exercise` delta no longer says that typing never marks the time field, so the two deltas agree in either order.
