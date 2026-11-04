# Design

## Context

The motivation is in proposal.md, and the behaviour is in `specs/text-fields/spec.md`. The code this builds on:
- **Text fields:**
  - every text field in the app is an `<input type="text">`. `textInput` in `today.js` creates the editor's and the set table's fields, and `history.js` creates the Days field;
  - a field is marked invalid with `aria-invalid="true"`, and only when it is left: by `markInvalid` in `today.js`, and by the Days field's `change` handler in `history.js`.
- **`styles.css`:**
  - `input[type="text"]` is a `border-box` field, at least 2.75rem high, with `padding: 0 0.5rem`, a 1px `--border` border and a 0.5rem radius;
  - `input[aria-invalid="true"]` sets a 2px `--danger` border and a `#fdecea` background;
  - one global rule draws every focus ring: `:focus-visible { outline: 3px solid var(--done); outline-offset: 2px; }`. It covers fields, buttons and links. The tiles have their own focus rules;
  - the editor's label text is a block `span` right above the field, with no gap (`.exercise label span`). The set table's column header has 0.25rem below it, and the Days label has 0.5rem.
- **Browsers:** a text field matches `:focus-visible` on every focus, from a tap or click as well, which is why the ring shows on the phone.

## Goals / Non-Goals

**Goals:**
- Two CSS rules, scoped to text fields, with no change to `today.js` or `history.js`.
- The field's box, and so the layout, is the same with and without focus.

**Non-Goals:**
- Changing the global `:focus-visible` rule, which would move the ring of buttons and links as well.
- A new colour token. The rules reuse `--done` and `--danger`.

## Decisions

### A negative outline offset, on text fields only
Directly after the global `:focus-visible` rule:

```css
/* A field's ring lies on its border, inside its box, so it never covers the label above. */
input[type="text"]:focus-visible { outline-offset: -3px; }
input[aria-invalid="true"]:focus-visible { outline-color: var(--danger); }
```

- **Geometry:** the outline's outer edge is the border edge plus offset plus width, so `-3px` with the 3px width puts it exactly on the border's outer edge. The ring covers the 3px band inside it: the 1px grey border and 2px of padding, or the 2px red border and 1px of padding. The text keeps 6px to the ring (7px when invalid), and the 2.75rem height leaves plenty above and below.
- **Corners:** current browsers draw an outline along the border radius. With this offset and width, the ring's outer corners have the field's 0.5rem radius.
- **Width and colour:** 3px in `--done`, as for every other focus ring in the app.
- **Cascade:** `input[type="text"]:focus-visible` (0,2,1) beats `:focus-visible` (0,1,0). The two new rules set different properties, so their order between each other does not matter.

- *Alternative: `outline-offset: 0` or `-1px`.* Rejected. The ring would still reach 3px or 2px beyond the border, onto the label's descenders.
- *Alternative: a blue border plus an inset `box-shadow`, with the outline removed.* Rejected. Forced-colours mode drops box shadows, so the focus would be left as a recoloured 1px border. The `highlight-last-workout` design rejected `box-shadow` for its tile border for the same reason.
- *Alternative: a thicker border on focus.* Rejected. The content box would shrink by a pixel or two, so the text would move unless the padding were adjusted for each state, valid and invalid.
- *Alternative: a gap between label and field.* Rejected. It changes the spacing of every editor, and the user asked for the ring on the border.

### Red ring while invalid
The user chose a red ring over a blue one for a field marked invalid. The second rule changes only the outline colour. The pink background stays, and the red border stays underneath the ring. The `aria-invalid` attribute already drives the red border, so the ring follows it without any script change: it turns blue again when the field is left with a valid value and focused again.

- **Contrast:** `--danger` (`#c62828`) is about 5.6:1 against the white card around the field and about 4.9:1 against the pink background, above the 3:1 needed for a UI element. `--done` on white is about 5.2:1.

## Risks / Trade-offs

- **[A focused invalid field looks much like an unfocused one]** Without focus, it has a 2px red border. With focus, it has a 3px red ring in the same place. Focus then shows mainly as one extra pixel of red, the caret, and on the phone the open keyboard → the user chose red over blue. Task 2.4 checks on the phone whether it is clear enough. Going back to blue means deleting the second rule.
- **[Older browsers draw square outlines]** Safari before 16.4 ignores the border radius for outlines. The ring's square corners would show just outside the rounded border, but still inside the field's box, so the label stays clear → accepted.
- **[Forced-colours mode]** The system colour replaces both ring colours, so red and blue look the same. The ring still lies on the border. The red border loses its colour the same way today → accepted.
- **[A future input of another type]** It would keep the outside ring, because the rule matches `type="text"` → accepted. The spec covers every text field, so a new field type would have to follow it.

## Migration Plan

There is no data migration. The worktree branch `worktree-fix-input-label-overlap` starts at `main`'s head (`c2e6848`). The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the commit.

The delta only adds a new capability, so it can be archived before or after the other open changes.
