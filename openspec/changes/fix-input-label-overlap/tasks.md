# Tasks

Worktree: fix-input-label-overlap

Groups 1–3 are implemented in the git worktree above, on branch `worktree-fix-input-label-overlap`, which starts at `main`'s head (`c2e6848`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 4 runs against the development sheet, never the real one. Restore every cell you change for a check, and delete any row for today that a check creates.

## 1. Branch up to date

- [x] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, rebase the branch onto `main`. Verify that `npm test` passes before any change.

## 2. Ring on the border

- [x] 2.1 In `styles.css`, add the two rules and their comment directly after the global `:focus-visible` rule, as in design.md ("A negative outline offset, on text fields only"). Leave the global rule and the tile rules unchanged. Verify on `localhost`, in DevTools device mode at 360px width:
  - "Field with its label right above": tapping an exercise's weight field shows the ring on its border, and "Weight (kg)" stays fully visible. Check this in a zoomed screenshot. Do the same for Ergometer's intensity and time fields, and for a text field for unreadable cells, if the development sheet has such an exercise;
  - "Field in the set table": for a set's reps field, `getBoundingClientRect()` gives the same values with and without focus, and `getComputedStyle(field).outlineOffset` is `-3px`;
  - "Days field on the History page": tapping the Days field in an exercise's detail shows the ring on its border, and "Days" stays fully visible;
  - "Leaving the field": tapping outside the field removes the ring and shows the grey border again;
  - pressing Tab onto a tile, a "×" button, "+ Set", the "History" link and the Today / History switch still shows their ring outside the element, as before;
  - the console shows no errors.
- [x] 2.2 Verify the invalid colour on `localhost`:
  - "Correcting an invalid field": enter "abc" in a set's reps field, leave it, and tap it again. The ring is red and the background stays pink;
  - "Field corrected": change it to "10", leave it, and tap it again. The ring is blue;
  - on the Days field, enter "0", leave it, and tap it again. The ring is red;
  - with DevTools' Rendering option "forced-colors: active", a focused field still shows its ring on its border.

  Then delete the set from the development sheet, or today's row if this check created it.
- [x] 2.3 Update `README.md` ("Saving"): after "Other input is marked and not saved.", add that a marked field has a red border, and that its focus ring is red as well while you type in it. Verify that the sentence matches what 2.2 showed.
- [x] 2.4 (Manual, user) On `localhost` at 360px width, confirm that the ring no longer touches the label, and that a focused invalid field is easy to tell from an invalid field without focus. If it is not, change the colour in `styles.css` and design.md before group 3.
  - Result: the normal ring looks good. A focused invalid field looked too similar to an unfocused one, so the user chose to drop the red border of the invalid mark instead of changing the ring colour (2.5).
- [x] 2.5 In `styles.css`, reduce `input[aria-invalid="true"]` to the pink background, as in design.md ("Invalid mark: pink background, grey border"). Verify on `localhost`, at 360px width:
  - "Field marked invalid": enter "abc" in a set's reps field and leave it. The field shows the pink background and the 1px grey border, with no red border. `getBoundingClientRect()` and the text's position are the same as before it was marked;
  - "Correcting an invalid field" and "Field corrected" as in 2.2, and the background is white again once the field is corrected;
  - on the Days field, "0" gives the same look as "abc", and the ring is red when it is focused again.

  Update the README sentence from 2.3 to say that a marked field has a pink background, and that its focus ring is red while you type in it. Then delete the set from the development sheet, or today's row if this check created it.
- [x] 2.6 (Manual, user) On `localhost` at 360px width, confirm that an invalid field without focus is still easy to spot, and that a focused invalid field is easy to tell from one without focus.
  - Result: the user preferred a red border to the grey one, at the same 1px width (2.7).
- [x] 2.7 In `styles.css`, give `input[aria-invalid="true"]` the `--danger` border colour next to the pink background, as in design.md ("Invalid mark: thin red border, pink background"). Verify on `localhost`, at 360px width:
  - "Field marked invalid": enter "abc" in a set's reps field and leave it. The field shows the pink background and a 1px red border. Its size, and the text's place inside it, are the same as before it was marked;
  - "Correcting an invalid field": tapping it again shows the red 3px ring on its border;
  - "Field corrected": after "10", the ring is blue, the background white, and the border grey once the field is left;
  - on the Days field, "0" gives the same look as "abc".

  Update the README sentence to say that a marked field has a red border and a pink background, and that its focus ring is red while you type in it. Then delete the set from the development sheet, or today's row if this check created it.
- [x] 2.8 (Manual, user) On `localhost` at 360px width, confirm that a focused invalid field is easy to tell from one without focus.
  - Result: confirmed by the user, it looks good.

## 2b. Mark while typing

- [x] 2.9 In `tests/workout.test.js`, add tests for `invalidFields` first and see them fail, then add it to `workout.js` as in design.md ("Marking while typing"). The tests cover:
  - a valid state gives `null`, and an invalid one gives the same flags as `cellsFor`;
  - with `typing: true`, a weight or a set's own weight of "7," or "7." is not flagged, while without it, it is;
  - with `typing: true`, "abc", "7,5," and ",5" are still flagged, and an Ergometer time of "390" is flagged;
  - the 'text' mode gives `null`.

  Verify that `npm test` passes.
- [x] 2.10 In `today.js`, mark on every `input` in the 'sets' and 'timed' editors, in `onChange`, and in `rebuildExercise`. In `history.js`, mark the Days field on every `input`. Update the comment above the time field's `input` handler. All as in design.md ("Marking while typing"). Verify on `localhost`, at 360px width:
  - "Typing an invalid value": typing "a" into an empty set field of Latzug marks it at once. The Network tab shows no `values:batchUpdate`, and the status and the tile do not change;
  - "Typing a correction": replacing it with "10" removes the mark at once. Leaving the field saves it;
  - "Weight on its way to a decimal": typing "7", "," and "5" into the weight field never marks it. Leaving it with "7," marks it;
  - "Ergometer time with too many seconds": typing 3, 9, 0 and 5 marks the field at "3:90" and unmarks it at "39:05";
  - "Days field": typing "0" marks it at once, and the window stays as it was;
  - deleting an empty set while another set field holds "abc" keeps that field marked;
  - the console shows no errors.

  Update `README.md`: the mark follows the typing, a weight ending in "," or "." is marked only when left, and the Ergometer seconds above 59 are marked at once. Then restore every field you changed, and delete the set from the development sheet, or today's row if this check created it.
- [x] 2.11 (Manual, user) On `localhost`, type valid and invalid values into a few fields and confirm that the mark follows the typing without flashing where it should not.
  - Result: accepted by the user on the strength of the checks in 2.10.

## 3. Integration and merge

- [x] 3.1 Run `npm test`. On `localhost`, do one complete pass: focus an exercise's weight field, a set's weight field, a set's reps field and the History Days field, each in turn. Verify that each shows the ring on its border, with no label covered. Also verify that the development sheet shows no changes beyond those already undone in 2.2, 2.5, 2.7 and 2.10.
- [x] 3.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-fix-input-label-overlap`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [ ] 3.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `styles.css` matches the commit.

## 4. Live verification

These checks run against the deployed site after 3.3, so they are checked off in a follow-up commit.

- [ ] 4.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in, open an exercise, tap its weight field without typing and then tap outside it. Verify that the ring lies on the field's border, that the Network tab shows no `values:batchUpdate`, and that the console shows no errors from this app's code.
- [ ] 4.2 (Manual, user) On the phone, open the deployed site and tap a weight field and a set field. Record in this task whether the ring lies on the border with rounded corners and leaves the label readable.

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 4 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `fix-input-label-overlap` worktree and its `worktree-fix-input-label-overlap` branch once `main` contains them.
