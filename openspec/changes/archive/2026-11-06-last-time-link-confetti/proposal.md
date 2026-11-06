# Proposal

## Why

The workout screen leaves three small gaps:
- **The editor does not say how old its placeholders are.** They come from the exercise's last time, which can be one session or several weeks ago.
- **The sheet's title is plain text.** To look at the details, the user has to find the sheet in Google Sheets by hand.
- **An improvement is shown only by the tile turning green.** Beating last time is the point of the workout, and it deserves a moment of its own.

## What Changes

- **Date of the last time in the editor.** Below the exercise's name, the editor shows in grey when the exercise was last done, followed in brackets by how many days ago that was, for example "Last time: 12.10.2026 (3 days ago)". This is the date of the row its prefill comes from: the exercise's "last time", not the last workout.
  - When the last time is the carry-over row, the line says "Last time: 2025", with the year in A2 and no count.
  - An exercise that has no last time shows no line.
  - The date is shown as `dd.mm.yyyy`, so `5.9.2026` in the sheet reads "05.09.2026".
  - The count is in calendar days, up to the date the screen shows. One day reads "(1 day ago)" and a long gap stays in days, such as "(45 days ago)". Like the rest of the screen, it does not change at midnight until the page is reloaded.
  - A date that is not before today shows no count. That only happens in a hand-edited sheet.
  - The line stays the same while the user logs today's sets, because today's row never counts as last time.
- **The sheet's title is a link.** It opens the spreadsheet in Google Sheets in a new browser tab, so the workout screen and its save queue stay open.
  - The link opens on the current year's tab.
  - When that tab is missing, the link opens the spreadsheet without choosing a tab.
  - On `localhost` it opens the development sheet, like every other request.
- **Confetti when an exercise turns green.** Every time an exercise's tile changes to "improved" because of the user's input, confetti bursts from that tile when the tile is on screen. That is the case right after tapping the next exercise's tile, so the celebration is clearly about the exercise that improved, not the one opening. Otherwise, for example while the keyboard has pushed the tiles out of view, it bursts from both sides of the screen.
  - It plays again whenever the tile turns green again, for example after a set is deleted and entered again.
  - It never plays on load, even for tiles that are already green.
  - It never plays when the tile was already green before the change.
  - It does not play when the device asks for reduced motion.
  - It never blocks a tap, and screen readers do not announce it. The tile's accessible name already says "improved on last time".
- **A short vibration with the confetti.** On a phone whose browser supports vibration, such as Chrome on Android, the phone buzzes once, briefly, at the same moment.
  - It has the same trigger as the confetti, so it never fires on load or on a tile that is already green.
  - It also fires when the device asks for reduced motion, because a vibration is not motion. There it is the only celebration besides the tile's colour.
  - On iPhones and desktop browsers nothing happens, and everything else works as before.

**Out of scope:**
- What was done last time, beyond the placeholders.
- A link to a particular row or cell.
- Sound, or any celebration other than confetti and vibration.
- Vibration on iPhones, whose browsers do not support it.
- Changes to the "improved" rule, the prefill, the counter or anything written to the sheet.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `todays-workout`: five added requirements: the date of the last time in the editor, how many days ago it was, the confetti, where the confetti bursts from, and the vibration. No existing requirement changes.
- `sheet-access`: "Connected screen shows the sheet" changes, so that the title links to the sheet.

## Impact

- **Modified files**:
  - `workout.js`: `buildToday` also returns the date of each exercise's last time. Covered by `tests/workout.test.js`.
  - `sheet-format.js`: a pure function that counts the days between two dates, and one that builds the link to the spreadsheet and tab. Covered by `tests/sheet-format.test.js`.
  - `api.js`: the access check also asks for each tab's ID (`sheetId`). It still asks for no cell data.
  - `app.js`: sets the title link.
  - `index.html`: the title becomes a link.
  - `today.js`: the editor shows the last-time line, and `onChange` starts the confetti and the vibration when the tile turns green.
  - `styles.css`: the grey line, the link and the confetti layer.
  - `README.md`: the access check's field mask, the link, the last-time line and the confetti.
- **New file**: `confetti.js`, a small canvas animation with no dependencies.
- **The user's data**: unchanged. The app reads the same tab once and writes exactly what it writes today.
- **Dependencies**: none added. The confetti is drawn by the app itself, not loaded from a CDN.
