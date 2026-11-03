# Design

## Context

The motivation is in proposal.md, and the behaviour is in `specs/todays-workout/spec.md` and `specs/sheet-access/spec.md`. The code this builds on:
- **`buildToday(rows, today)` in `workout.js`:**
  - scans upward from `start` for each exercise's `last`, the lowest dated row with a readable set. It already parses column A of each row to skip undated ones, but drops the parsed date;
  - falls back to the carry-over row as `{ ...entry, carryOver: true }`.
- **`probeSpreadsheet()` in `api.js`:** asks for `properties.title,sheets.properties.title` and returns `{ title, tabs }`, with `tabs` as an array of titles. `app.js` checks `tabs.includes(tab)` and writes the title into `#sheet-title`, a `<span>` in `#sheet-line`.
- **`today.js`:**
  - `buildExercise` builds the editor card: an `h3` with the name, then either the two text fields or the weight and set fields. `rebuildExercise` rebuilds it after "+ Set" or "×";
  - `onChange` is the only place where an exercise's `progress` changes after load. It recomputes `progress` with `progressOf` when the cells are valid and re-renders the tile.
- **The page:**
  - It loads ES modules with no build step and no dependencies. The only outside script is Google Identity Services.
  - The access token is kept in memory and in the tab's `sessionStorage`, so any script on the page can read it.
  - `config.js` reads `location` when it is imported, so only the pure modules (`workout.js`, `sheet-format.js`, `icons.js`) run under `npm test`.

## Goals / Non-Goals

**Goals:**
- The new rules are pure and covered by Node tests: which date belongs to the last time, how many days ago it was, and which URL opens which tab.
- The confetti is one self-contained module that `today.js` calls in one place.
- No third-party code runs on the page.

**Non-Goals:**
- Unit tests for DOM code. `today.js`, `app.js` and `confetti.js` are checked in the browser, as before.
- A general animation or "celebration" framework.

## Decisions

### The last time carries its date
In `buildToday`, the scan for `last` keeps the date it already parses:
- **Workout row:** `last` gains `date`, the `{ y, m, d }` from column A.
- **Carry-over row:** `last` gains `year`, the number in A2. `hasCarryOverRow` already guarantees that A2 holds a four-digit year.

`today.js` formats the line, with `formatDate(last.date)` for a workout row, as "Last time: 12.10.2026 (3 days ago)", or as "Last time: 2025" for the carry-over row. The wording stays next to `STATE_TEXT`, where the other screen text lives. `workout.js` keeps returning data, not text.

- *Alternative: return `last.dateText`, column A as displayed.* Rejected. `5.9.2026` would then show without leading zeros, and the spec asks for `dd.mm.yyyy`.
- *Alternative: look up column A in `today.js` from `last.row`.* Rejected. `today.js` does not keep the rows, and the rule would move into untested code.

### The day count is a pure date function
`sheet-format.js` gains `daysBetween(from, to)`, next to `sameDate` and `dateOf`. It returns the number of calendar days from `from` to `to`, two `{ y, m, d }` dates. It takes `Date.UTC(y, m - 1, d)` of each and divides the difference by 86 400 000.
- **Why UTC:** local midnights are 23 or 25 hours apart across a clock change. Local dates would give 2.96 days from 24.10.2026 to 27.10.2026, and UTC gives exactly 3.
- **Today:** `today.js` passes the `today` that `startWorkout` received, the date the screen shows. The count therefore stays fixed until a reload, like the rest of the screen.
- **Wording:** `today.js` appends " (1 day ago)" for 1 and " (N days ago)" for more. A count below 1, from a date that is not before today, adds nothing. The carry-over line has no date, so it never gets a count.

- *Alternative: count from `new Date()` when the editor opens.* Rejected. After midnight it would disagree with the date at the top of the screen.
- *Alternative: "yesterday", or weeks for long gaps.* Rejected. The user asked for the number of days.

### The line sits under the heading, in both editor modes
`buildExercise` appends a `<p class="muted last-time">` right after the `h3` when `exercise.last` is set, before branching on `state.mode`. So the unreadable-cells editor shows the line too. `.muted` already gives `--muted` at 0.85rem. A `.last-time` rule pulls the line up under the heading, whose bottom margin is 0.75rem, and keeps that gap below the line. The line is plain text through `textContent`. `rebuildExercise` recreates it unchanged, because `last` never changes during the session.

- **Contrast:** `--muted` (`#646b78`) on the white card is about 5.3:1, above the 4.5:1 needed for text.

### The probe also asks for the tab IDs
The field mask becomes `properties.title,sheets.properties(title,sheetId)`. It still asks for no cell data. `probeSpreadsheet` returns `tabs` as `[{ title, sheetId }]`. `app.js` finds the year's tab with `tabs.find((t) => t.title === tab)`, which replaces `tabs.includes(tab)`.

- *Alternative: a second request for the tab ID.* Rejected. The probe already returns the tabs, and the ID costs nothing extra.

### The link is built by a pure function
`sheet-format.js` gains `sheetUrl(spreadsheetId, sheetId)`:
- it returns `https://docs.google.com/spreadsheets/d/<id>/edit`, with the ID URI-encoded;
- it adds `#gid=<sheetId>` when `sheetId` is a number. A spreadsheet's first tab usually has the ID 0, so the check is `typeof sheetId === 'number'` and not truthiness.

`app.js` calls it with `CONFIG.SPREADSHEET_ID` and the year tab's `sheetId`, or with no ID when the tab is missing. The function goes in `sheet-format.js` because that module is pure and tested, and it already addresses the sheet with `rangeFor`. `api.js` imports `config.js` and cannot run under Node.

### A link that opens a new browser tab
In `index.html`, `#sheet-title` becomes `<a id="sheet-title" target="_blank" rel="noopener">`. `app.js` sets its `textContent` and `href` in `enterApp`, next to where it sets the title today. The link keeps the muted colour of `#sheet-line` and gets an underline, so the line stays quiet but reads as a link. The global `:focus-visible` outline already covers it.

- **Why a new tab:** the save queue and any values not yet saved live in the page's memory. Going to the sheet in the same tab would lose them, and coming back would reload and possibly sign in again.
- *Alternative: a separate "Open sheet" button.* Rejected. The title already names the sheet, and the user asked for the title itself to be the link.

### Confetti starts in `onChange`, when the tile turns green
`onChange` keeps the progress from before. After `renderTile`, it calls `playConfetti(item.tile)`, and vibrates as described below, when that progress was not `improved` and the new one is:

```js
const before = item.progress;
item.progress = progressOf(cells, item.exercise.last, item.exercise.assisted);
renderTile(item);
renderCounter();
if (before !== 'improved' && item.progress === 'improved') {
  playConfetti(item.tile);
  if (navigator.vibrate) navigator.vibrate(VIBRATION);
}
```

Why this covers every scenario in the spec:
- **Only on input.** `onChange` is the only path from a field, from "×", or from switching tiles to a new progress. `startWorkout` sets the progress on load without calling it, so tiles that load green get no confetti.
- **Every time it turns green.** The condition only compares two states. Green, then blue, then green again plays twice.
- **Invalid input.** It leaves `progress` as it was, so it never plays.
- **Saving.** Confetti follows the tile, not the save, and fires before `runQueue`. A failed save does not undo it.

- *Alternative: a pure `turnedImproved(before, after)` in `workout.js`, with tests.* Rejected. It would test a single comparison, while the real risk is reading `before` after the assignment. The browser checks in tasks.md cover that.

### A self-contained canvas animation in `confetti.js`
`confetti.js` exports `playConfetti(tile)`, which takes the tile of the exercise that turned improved. It needs no setup and stops on its own.
- **Reduced motion:** each call checks `matchMedia('(prefers-reduced-motion: reduce)')` and returns at once when it matches. Checking on every call means a changed setting applies without a reload.
- **Layer:** on the first piece, it appends a `<canvas class="confetti" aria-hidden="true">` to `<body>`. `styles.css` makes it `position: fixed; inset: 0; pointer-events: none` above the page. Taps go through, it never takes focus, and the layout does not move. When the last piece has gone, the frame loop stops and the canvas is removed, so nothing runs while idle.
- **The visible area:** it comes from `visualViewport` when present: its `offsetLeft`, `offsetTop`, `width` and `height`, in the same layout-viewport coordinates as `getBoundingClientRect()` and the fixed canvas. Otherwise it is the window. While the phone keyboard is open, the visible area is the part of the screen above it.
- **Where it bursts:** the tile's `getBoundingClientRect()` is read when the call starts.
  - **Tile on screen:** when the rectangle lies entirely within the visible area, one burst pops from the tile's centre, outwards in all directions with an upward bias.
  - **Otherwise:** two cannons fire from the left and right edges of the visible area, at about two thirds of its height, upwards and inwards.
  - Either way, the pieces fall back with gravity and drag. In the switching case, `onChange` runs from the blur before `selectItem` replaces the editor or scrolls, so the rectangle is where the user just saw the tile.
- **Pieces:** about 100 from a tile, or 60 per cannon. They are small rectangles that spin and flutter, and fade out at the end of a life of about 2 to 2.5 seconds.
- **Colours:** `--improved` and `--done`, read from `:root`, so the confetti matches the tiles. There are also three fixed accents: amber, pink and violet.
- **Frame rate:** movement uses the time between frames, clamped to 1/30 s, so a 120 Hz phone does not run it at double speed. A tab coming back from the background does not jump either.
- **Sharpness:** the canvas is scaled by `devicePixelRatio`, capped at 2.
- **Overlaps:** a second call while pieces are still flying adds a new burst to the same canvas and loop. The total is capped at 300 pieces.

The canvas is sized to the window each time a burst starts. A rotation during the 2.5 seconds is not followed.

- *Alternative: the `canvas-confetti` library from a CDN.* Rejected. It is third-party code on a page whose access token any script can read from `sessionStorage`. The README keeps the token out of `localStorage` for exactly that kind of exposure. It would also be the first dependency.
- *Alternative: DOM elements animated with CSS.* Rejected. Gravity, drag and flutter for over a hundred pieces are simpler on one canvas than as per-element keyframes. They would also add and remove a hundred nodes per burst.
- *Alternative: always burst from the sides.* Rejected. When the improvement is caught by tapping the next exercise's tile, the burst would appear over that exercise's editor, as if it were for that one.
- *Alternative: always burst from the tile.* Rejected. While the user types into the third set field with the keyboard open, the tiles have usually scrolled out of view, so the burst would happen off screen.
- *Alternative: no confetti when switching to another tile.* Rejected by the user. It needs an extra listener that notices a tap on a tile before the field's change event fires. It would also skip the confetti whenever the user goes straight from the last set to the next exercise.

### The vibration is one call next to the confetti
`onChange` calls `navigator.vibrate(VIBRATION)` right after `playConfetti()`, under the same condition, and only when the browser has `navigator.vibrate`. `VIBRATION` is a constant in `today.js`, `100`: a single buzz of 0.1 seconds.
- **Same trigger:** it runs exactly when the confetti would, so the confetti's reasoning about load, invalid input and saving holds for it too.
- **Reduced motion:** the call sits outside `playConfetti()`, so the reduced-motion check there does not skip it.
- **User activation:** Chrome only lets a page vibrate after the user has interacted with it. `onChange` only runs from the user's input, so that always holds.
- **Support:** Chrome on Android vibrates. Where a browser has no `navigator.vibrate`, as on every iPhone, the check skips the call.

- *Alternative: vibrate inside `playConfetti()`.* Rejected. The reduced-motion check returns first, and a module named for confetti would hide the vibration.
- *Alternative: Safari 18's haptic feedback on a switch control (`<input type="checkbox" switch>`), toggled through a hidden label.* Rejected. It is an undocumented side effect, it needs a hidden control on the page, and any Safari update may end it.

## Risks / Trade-offs

- **[A typo such as 100 instead of 10]** The tile turns green and confetti plays before the user corrects it → accepted. The tile has the same problem today.
- **[`#gid` in the Google Sheets app]** On a phone, the link may open the Sheets app, which might ignore `#gid` and show the last viewed tab → checked on the phone (task 6.2). Opening the right spreadsheet is still useful.
- **[First tab with ID 0]** A truthiness check would drop `#gid=0` → covered by a test in task 3.1.
- **[Slow phones]** 120 pieces for about 2.5 seconds, with the loop stopping afterwards → checked on the phone (task 6.2). The piece count is one constant in `confetti.js`.
- **[iOS keyboard and fixed layers]** A fixed canvas covers the layout viewport, part of which lies behind the keyboard. The burst origins come from `visualViewport`, so the pieces start in the visible part → checked on the phone (task 6.2). DevTools cannot show a phone keyboard.
- **[The page scrolls during a burst from a tile]** `selectItem` scrolls the editor into view right after the burst starts, which can move the tile while the pieces keep their place on screen → accepted. The pieces leave the tile within a fraction of a second.
- **[Vibration off on the phone]** Android may silence the call when vibration is turned off in its settings → accepted, as the user's own choice.
- **[Feeling the buzz]** It can only be felt on the phone, which cannot sign in on `localhost` → checked after the deploy (task 6.2). If it feels wrong, `VIBRATION` changes in a follow-up commit.
- **[Title link while the year's tab is missing]** It opens the spreadsheet on whatever tab Google Sheets picks, which is where the user adds the new year's tab → intended.

## Migration Plan

There is no data migration. The worktree branch `worktree-last-time-link-confetti` starts at `main`'s head (`3f6855a`). The change ships with the next GitHub Pages deploy of `main`. To roll back, revert the merge commit.

The `sheet-access` delta modifies one requirement and the `todays-workout` delta only adds requirements. No other change is in flight, so archiving order is not a concern.
