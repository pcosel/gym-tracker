# Tasks

Worktree: fix-input-label-overlap

Groups 1–3 are implemented in the git worktree above, on branch `worktree-fix-input-label-overlap`, which starts at `main`'s head (`c2e6848`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 4 runs against the development sheet, never the real one. Restore every cell you change for a check, and delete any row for today that a check creates.

## 1. Branch up to date

- [ ] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, rebase the branch onto `main`. Verify that `npm test` passes before any change.

## 2. Ring on the border

- [ ] 2.1 In `styles.css`, add the two rules and their comment directly after the global `:focus-visible` rule, as in design.md ("A negative outline offset, on text fields only"). Leave the global rule and the tile rules unchanged. Verify on `localhost`, in DevTools device mode at 360px width:
  - "Field with its label right above": tapping an exercise's weight field shows the ring on its border, and "Weight (kg)" stays fully visible. Check this in a zoomed screenshot. Do the same for Ergometer's intensity and time fields, and for a text field for unreadable cells, if the development sheet has such an exercise;
  - "Field in the set table": for a set's reps field, `getBoundingClientRect()` gives the same values with and without focus, and `getComputedStyle(field).outlineOffset` is `-3px`;
  - "Days field on the History page": tapping the Days field in an exercise's detail shows the ring on its border, and "Days" stays fully visible;
  - "Leaving the field": tapping outside the field removes the ring and shows the grey border again;
  - pressing Tab onto a tile, a "×" button, "+ Set", the "History" link and the Today / History switch still shows their ring outside the element, as before;
  - the console shows no errors.
- [ ] 2.2 Verify the invalid colour on `localhost`:
  - "Correcting an invalid field": enter "abc" in a set's reps field, leave it, and tap it again. The ring is red and the background stays pink;
  - "Field corrected": change it to "10", leave it, and tap it again. The ring is blue;
  - on the Days field, enter "0", leave it, and tap it again. The ring is red;
  - with DevTools' Rendering option "forced-colors: active", a focused field still shows its ring on its border.

  Then delete the set from the development sheet, or today's row if this check created it.
- [ ] 2.3 Update `README.md` ("Saving"): after "Other input is marked and not saved.", add that a marked field has a red border, and that its focus ring is red as well while you type in it. Verify that the sentence matches what 2.2 showed.
- [ ] 2.4 (Manual, user) On `localhost` at 360px width, confirm that the ring no longer touches the label, and that a focused invalid field is easy to tell from an invalid field without focus. If it is not, change the colour in `styles.css` and design.md before group 3.

## 3. Integration and merge

- [ ] 3.1 Run `npm test`. On `localhost`, do one complete pass: focus an exercise's weight field, a set's weight field, a set's reps field and the History Days field, each in turn. Verify that each shows the ring on its border, with no label covered. Also verify that the development sheet shows no changes beyond those already undone in 2.2.
- [ ] 3.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-fix-input-label-overlap`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [ ] 3.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `styles.css` matches the commit.

## 4. Live verification

These checks run against the deployed site after 3.3, so they are checked off in a follow-up commit.

- [ ] 4.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in, open an exercise, tap its weight field without typing and then tap outside it. Verify that the ring lies on the field's border, that the Network tab shows no `values:batchUpdate`, and that the console shows no errors from this app's code.
- [ ] 4.2 (Manual, user) On the phone, open the deployed site and tap a weight field and a set field. Record in this task whether the ring lies on the border with rounded corners and leaves the label readable.

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 4 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `fix-input-label-overlap` worktree and its `worktree-fix-input-label-overlap` branch once `main` contains them.
