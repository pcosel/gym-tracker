# Tasks

Worktree: last-time-link-confetti

Groups 1–5 are implemented in the git worktree above, on branch `worktree-last-time-link-confetti`, which starts at `main`'s head (`3f6855a`).
- **Serving:** run `python -m http.server 8000 --directory <worktree path>` and open `http://localhost:8000`.
- **Sheet:** every browser check before group 6 runs against the development sheet, never the real one. Restore every cell or tab title you change for a check, and delete any row for today that a check creates.

## 1. Branch up to date

- [x] 1.1 In the worktree, check that the branch contains `main`'s head (`git merge-base --is-ancestor main HEAD`). If `main` has moved on, rebase the branch onto `main`. Verify that `npm test` passes before any change.

## 2. Date of the last time in the editor

- [x] 2.1 In `workout.js`, have `buildToday` give `last` a `date` for a workout row and a `year` for the carry-over row, as in design.md ("The last time carries its date"). Update the comment above `buildToday` to describe both fields. Keep the existing tests unchanged. Add tests to `tests/workout.test.js`, using the existing `tab()` rows unless stated otherwise:
  - "Last time in an earlier workout": Latzug's `last.date` is `{ y: 2026, m: 9, d: 12 }`, from row 5;
  - "Last time before the last workout": with `['13.10.2026', '', '', '75', '10']` added, Bankdrücken's `last.date` is still 12.09.2026, while the last workout is row 6;
  - "Date without leading zeros": with `['5.10.2026', '', '', '75', '10']` added, Latzug's `last.date` is `{ y: 2026, m: 10, d: 5 }`;
  - "Exercise done today": with `['15.10.2026', '', '', '75', '10']` added, Latzug's `last.date` is still 12.09.2026;
  - "Carry-over row": Beinpresse's `last.year` is 2025, and it has no `date`;
  - Bizepsmaschine's `last.date` is 01.09.2026, from row 3, because row 5 holds only a weight.

  "Never done" is covered by the existing test, where `last` is `null`. Verify that `npm test` passes.
- [x] 2.2 In `sheet-format.js`, add `daysBetween(from, to)` as in design.md ("The day count is a pure date function"). Add tests to `tests/sheet-format.test.js`:
  - "A few days ago": 12.10.2026 to 15.10.2026 is 3;
  - "One day ago": 14.10.2026 to 15.10.2026 is 1;
  - "Across a month": 12.09.2026 to 15.10.2026 is 33;
  - "Across a clock change": 24.10.2026 to 27.10.2026 is exactly 3, not 2.96;
  - across a year: 30.12.2025 to 02.01.2026 is 3;
  - the same day is 0, and a later date, 20.10.2026 to 15.10.2026, is -5.

  Verify that `npm test` passes.
- [x] 2.3 In `today.js`, have `buildExercise` add the last-time line, with its day count, under the heading in both editor modes. Add the `.last-time` rule to `styles.css`. Both follow design.md ("The line sits under the heading, in both editor modes" and "The day count is a pure date function"). Verify on `localhost`:
  - "Last time in an earlier workout": opening an exercise shows "Last time: dd.mm.yyyy (N days ago)" in grey under its name. The date matches the row its placeholders come from in the development sheet;
  - "A few days ago": for two exercises with different dates, each count matches the calendar up to the date at the top of the screen;
  - "One day ago": set the date of an exercise's last-time row in the development sheet to yesterday and reload. The line ends with "(1 day ago)". Then restore the date;
  - "Last time before the last workout": an exercise skipped in the last workout, so its tile has no border, shows an earlier date than one whose tile has the border;
  - "Carry-over row": an exercise whose prefill comes from row 2 shows "Last time: 2025", with no count. If the development sheet has none, empty one exercise's workout rows and restore them afterwards;
  - "Never done": an exercise without any reps shows no line;
  - "Exercise done today": after entering a set, and after "+ Set" and "×", the line is still there with the same date and count;
  - "Unreadable cells today": type "?, 9, 7" into a reps cell of today's row in the development sheet and reload. That exercise's text-field editor shows the line;
  - the console shows no errors.
- [x] 2.4 Update `README.md` ("Prefill"): the editor shows the date of the last time in grey, with how many days ago it was in brackets. For the carry-over row, it shows only the year, with no count. An exercise never done shows nothing. Verify that the README matches what 2.3 showed.

## 3. The sheet's title links to the sheet

- [x] 3.1 In `sheet-format.js`, add `sheetUrl(spreadsheetId, sheetId)` as in design.md ("The link is built by a pure function"). Add tests to `tests/sheet-format.test.js`:
  - an ID and the tab ID 1234567 give `https://docs.google.com/spreadsheets/d/<ID>/edit#gid=1234567`;
  - the tab ID 0 gives `#gid=0`;
  - no tab ID (`undefined`) gives the URL without `#gid`;
  - a spreadsheet ID with a character that needs encoding comes out encoded.

  Verify that `npm test` passes.
- [x] 3.2 Make the probe return `tabs` as `[{ title, sheetId }]` in `api.js`, with the new field mask. In `index.html`, turn `#sheet-title` into the link. In `app.js`, find the year's tab and set the link's text and `href`. Add the link's style to `styles.css`. All of this follows design.md ("The probe also asks for the tab IDs" and "A link that opens a new browser tab"). Verify on `localhost`:
  - "Owner signs in": the title shows as before, underlined, in the muted colour;
  - "Opening the sheet": selecting the title opens a new browser tab on the development sheet's "2026" tab. Its URL holds the development spreadsheet ID and `#gid=`, and the workout screen stays open in its tab with any entered value;
  - "Local run opens the development sheet": the link's `href` never holds the production spreadsheet ID;
  - in DevTools' Network tab, the probe's `fields` parameter asks for `sheetId` and the response holds no cell values;
  - "Year tab is missing": rename the development sheet's "2026" tab, reload, and check that the missing-tab message shows and the link has no `#gid`. Then rename the tab back;
  - keyboard focus (Tab) on the link shows the focus outline;
  - the console shows no errors.
- [x] 3.3 Update `README.md`:
  - "Access check": the new field mask, with `sheetId`;
  - the App row of the screens table: the title links to the year's tab, in a new browser tab.

  Verify that the README matches what 3.2 showed.

## 4. Confetti

- [x] 4.1 Add `confetti.js` with `playConfetti(tile)`, and the `.confetti` rule to `styles.css`, as in design.md ("A self-contained canvas animation in `confetti.js`"). Verify in the DevTools console on `localhost`, with `const { playConfetti } = await import('./confetti.js')` and `const tile = document.querySelector('#tiles button')`:
  - "Tile on screen": with the first tile entirely on screen, `playConfetti(tile)` pops one burst from its centre. The pieces fall and fade out within about 1.2 seconds;
  - "Tile out of view" and "Tile partly on screen": scrolled so that the first tile is entirely, then partly, out of view, `playConfetti(tile)` bursts from both sides;
  - after that, the `canvas.confetti` element is gone from the Elements panel;
  - three quick calls add up on one canvas, without a second canvas;
  - with the Rendering option "prefers-reduced-motion: reduce", a call shows nothing and adds no canvas;
  - in device mode at 360px and 430px width, the burst fits the screen and the pieces look sharp.
- [x] 4.2 In `today.js`, have `onChange` call `playConfetti(item.tile)` when the tile turns green, as in design.md ("Confetti starts in `onChange`, when the tile turns green"). Verify on `localhost`, with an exercise whose last time has readable reps:
  - "Turning green": enter sets until the tile turns green. Confetti plays when you leave the field, together with the colour change;
  - "From not done straight to improved": on an exercise not done today, a first entry that already beats last time plays confetti;
  - "Already improved": another set on a green tile plays no confetti;
  - "Turning green again": "×" on a set that makes the tile blue, then re-entering it, plays confetti again;
  - "Switching exercises": after typing the set that makes the tile green, select another tile without leaving the field first. Confetti bursts from the tile that turned green, not from the tile just selected, while the other exercise's editor opens;
  - "Tile out of view": in device mode at 360px width, scroll until the tiles are out of view, then leave the field that makes the tile green. Confetti bursts from both sides;
  - "Done but not improved" and "Invalid input": a set that leaves the tile blue, and "abc" in a set field, play no confetti;
  - "Improved on load": reload while a tile is green. No confetti plays;
  - "Save fails": with DevTools' Network set to "Offline", turn a tile green. Confetti plays and the status shows "Not saved". Then go back online and retry;
  - "Taps during the animation": while confetti plays, tap a set field. It gets the focus;
  - "Reduced motion": with "prefers-reduced-motion: reduce", turning a tile green changes its colour and plays no confetti;
  - the console shows no errors.
- [x] 4.3 In `today.js`, add the `VIBRATION` constant and have `onChange` call `navigator.vibrate(VIBRATION)` next to `playConfetti()`, as in design.md ("The vibration is one call next to the confetti"). Verify on `localhost` in Chrome, with a logpoint in DevTools' Sources panel on the `navigator.vibrate` line of `today.js`, so that each call logs and the logpoint survives a reload:
  - "Turning green on an Android phone": turning a tile green logs once, together with the confetti;
  - "No vibration without a change to improved": another set on a green tile logs nothing, and neither does a reload with a green tile;
  - "Reduced motion": with "prefers-reduced-motion: reduce", turning a tile green logs once and plays no confetti;
  - "Browser without vibration": after `delete Navigator.prototype.vibrate` in the console, turning a tile green logs nothing, confetti plays, and the console shows no errors. Reload to restore it.
- [x] 4.4 Update `README.md`:
  - "Tiles": every time a tile turns green from your input, confetti plays and the phone vibrates once, briefly. The confetti bursts from that tile when it is on screen, and from both sides otherwise. Neither happens on load or on a tile that is already green. Reduced motion skips the confetti but not the vibration, and iPhones do not vibrate;
  - the Files table gains `confetti.js`.

  Verify that the README matches what 4.2 and 4.3 showed.
- [x] 4.5 (Manual, user) On `localhost`, in device mode at 360px width, turn a tile green and confirm that the confetti looks good. If the amount, the speed or the colours are not right, change the constants in `confetti.js`, and update design.md if they differ from it, before group 5.

## 5. Integration and merge

- [x] 5.1 Run `npm test`. On `localhost`, do one complete pass on a day without a row for today in the development sheet:
  1. Open an exercise and note its last-time date and day count.
  2. Log sets until its tile turns green.
  3. Open the sheet through the title link and check the new row there.
  4. Reload the page.

  Verify that confetti played once, at the change to green, and not on reload. Also verify that the last-time date and day count are still the ones noted, and that only today's row changed in the development sheet.
- [x] 5.2 Commit all work in the worktree. From the main checkout, fast-forward `main` to the worktree branch (`git merge --ff-only worktree-last-time-link-confetti`). Do not push. Verify that `git log main -1` matches the worktree branch head, and that `git status` on `main` is clean.
- [x] 5.3 (Manual, user) Push `main` to `origin`. Verify that the `pages-build-deployment` run for that commit succeeds, or that the deployed `today.js` matches the commit.

## 6. Live verification

These checks run against the deployed site after 5.3, so they are checked off in a follow-up commit.

- [x] 6.1 Read-only check on a desktop browser at `https://pcosel.github.io/gym-tracker/`. Sign in and open a few tiles without typing. Check that each last-time date matches the real sheet, and that its day count matches the calendar. Select the title and check that it opens the real sheet on this year's tab, in a new browser tab. Verify that the Network tab shows no `values:batchUpdate` and that the console shows no errors from this app's code.

  Result (desktop Playwright browser, 06.11.2026): six tiles opened without typing showed 02.11.2026 (4 days ago) for Bankdrücken, Bauchmaschine and Bizepsmaschine, 05.11.2026 (1 day ago) for Rückenheben and Schulterpresse, and 19.10.2026 (18 days ago) for Seitheber. All day counts match the calendar. The title link opened a new browser tab on `Fitti_Copy` at the 2026 tab (`gid=115733138`). The network log holds only the probe, the `values/'2026'` read and `userinfo`, with no `values:batchUpdate`. The console errors came from the missing `favicon.ico` and Google's sign-in script (Cross-Origin-Opener-Policy), none from this app's code. The dates were read from the app, not compared cell by cell against the sheet.
- [x] 6.2 (Manual, user) At the next workout, log it with the app on the phone. Record in this task:
  - whether confetti showed above the keyboard when a tile turned green while typing, and ran smoothly;
  - whether, when going straight from the last set to the next exercise's tile, the confetti clearly came from the exercise that improved;
  - whether the phone vibrated at the same moment, and whether its length felt right. If not, note the change to `VIBRATION` for a follow-up commit;
  - whether the title link opened the sheet on this year's tab, in the Sheets app or the browser;
  - whether the last-time date and its day count were useful at a glance.

  Result (first workout on the deployed site, on the phone):

  - Confetti looked good and ran smoothly. With the exercise tile on screen it came in from the sides, and with the page scrolled further up it came out of the exercise's tile;
  - the phone vibrated at the right moment and the length felt good, so `VIBRATION` stays as it is;
  - the title link opened the sheet, which the user used to delete a test row from that workout;
  - the last-time date and its day count were useful at a glance.

## Workflow follow-up

- Run `/opsx:archive` for this change on `main` once group 6 passes. Commit the checked-off tasks and the archive together. The user pushes `main` by hand.
- Remove the `last-time-link-confetti` worktree and its `worktree-last-time-link-confetti` branch once `main` contains them.
