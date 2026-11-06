# Spec Delta

## ADDED Requirements

### Requirement: The editor shows the date of the last time
An open exercise's editor SHALL show the date of the exercise's last time below its name, in the muted colour of secondary text, as "Last time: " followed by the date as `dd.mm.yyyy`. When the last time is the carry-over row, the line SHALL say "Last time: " followed by the year in that row. An exercise without a last time SHALL show no such line.

#### Scenario: Last time in an earlier workout
- **WHEN** today is 15.10.2026, Latzug's last time is row 13, holding "12.10.2026", and the user selects its tile
- **THEN** its editor shows "Last time: 12.10.2026 (3 days ago)" in grey below the name "Latzug"

#### Scenario: Date without leading zeros
- **WHEN** Latzug's last time is a row holding "5.9.2026"
- **THEN** its editor shows "Last time: 05.09.2026"

#### Scenario: Last time before the last workout
- **WHEN** today is 15.10.2026, the last workout is row 13, holding "12.10.2026" with reps for Latzug only, and Bankdrücken last held reps in row 9, holding "01.10.2026"
- **THEN** Bankdrücken's editor shows "Last time: 01.10.2026 (14 days ago)", the date of its own last time
- **AND** it does not show the last workout's date "12.10.2026"

#### Scenario: Exercise done today
- **WHEN** today's row holds "75" and "10" for Latzug, and Latzug's last time is a row holding "12.10.2026"
- **THEN** its editor shows "Last time: 12.10.2026"
- **AND** it still does after the user enters another set and leaves the field

#### Scenario: Carry-over row
- **WHEN** Beinpresse's last time is the carry-over row, and A2 holds "2025"
- **THEN** its editor shows "Last time: 2025"

#### Scenario: Never done
- **WHEN** Duale Schulterpresse has no last time
- **THEN** its editor shows no last-time line

#### Scenario: Unreadable cells today
- **WHEN** today's reps cell for Latzug displays "?, 9, 7", and Latzug's last time is a row holding "12.10.2026"
- **THEN** its editor shows the two text fields and "Last time: 12.10.2026"

### Requirement: The last time shows how many days ago it was
After the date of the last time, the editor SHALL show in brackets how many calendar days before today that date is, as "(1 day ago)" for one day and "(N days ago)" otherwise. Today SHALL be the date the workout screen shows. The carry-over row, and a date that is not before today, SHALL show no count.

#### Scenario: A few days ago
- **WHEN** today is 15.10.2026 and Latzug's last time is a row holding "12.10.2026"
- **THEN** its editor shows "Last time: 12.10.2026 (3 days ago)"

#### Scenario: One day ago
- **WHEN** today is 15.10.2026 and Latzug's last time is a row holding "14.10.2026"
- **THEN** its editor shows "Last time: 14.10.2026 (1 day ago)"

#### Scenario: Across a month
- **WHEN** today is 15.10.2026 and Bizepsmaschine's last time is a row holding "12.09.2026"
- **THEN** its editor shows "Last time: 12.09.2026 (33 days ago)"

#### Scenario: Across a clock change
- **WHEN** today is 27.10.2026 and Latzug's last time is a row holding "24.10.2026", with the change from summer time on 25.10.2026 in between
- **THEN** its editor shows "Last time: 24.10.2026 (3 days ago)"

#### Scenario: Carry-over row
- **WHEN** Beinpresse's last time is the carry-over row, and A2 holds "2025"
- **THEN** its editor shows "Last time: 2025", with no count

#### Scenario: Date after today
- **WHEN** today is 15.10.2026, there is no today's row, and Latzug's last time is a row holding "20.10.2026"
- **THEN** its editor shows "Last time: 20.10.2026", with no count

#### Scenario: App left open past midnight
- **WHEN** the workout screen was loaded on 15.10.2026, Latzug's last time is a row holding "12.10.2026", and the screen is still open after midnight
- **THEN** its editor shows "(3 days ago)" until the page is reloaded

### Requirement: Confetti plays when an exercise turns improved
Each time the user's input changes an exercise's tile to the "improved" state, the screen SHALL play a confetti animation on the visible part of the screen. It SHALL NOT play when the screen loads, or when the tile already was "improved" before the change. The animation SHALL NOT block taps, and screen readers SHALL NOT announce it. It SHALL NOT play when the device asks for reduced motion.

#### Scenario: Turning green
- **WHEN** Latzug last held "75" and "9, 9, 9", today holds "75" and "9, 9", and the user enters 10 in the third set field and leaves it
- **THEN** its tile changes to the "improved" colour and confetti plays

#### Scenario: From not done straight to improved
- **WHEN** Latzug last held "75" and "10", has no values today, and the user enters 11 in its first set field and leaves it
- **THEN** its tile changes from the "not done" colour to the "improved" colour and confetti plays

#### Scenario: Already improved
- **WHEN** Latzug is improved today and the user enters another set and leaves the field
- **THEN** its tile stays in the "improved" colour and no confetti plays

#### Scenario: Turning green again
- **WHEN** Latzug turned improved, the user deletes a set so that it is only done, and then enters that set again and leaves the field
- **THEN** confetti plays again when the tile changes back to the "improved" colour

#### Scenario: Switching exercises
- **WHEN** the user enters a set that makes Latzug improved and, without leaving the field first, selects the tile of Brustpresse
- **THEN** Latzug's tile changes to the "improved" colour and confetti plays from Latzug's tile, not from Brustpresse's
- **AND** Brustpresse's editor opens

#### Scenario: Done but not improved
- **WHEN** the user enters a set that makes an exercise done today but not improved
- **THEN** no confetti plays

#### Scenario: Improved on load
- **WHEN** today's row already holds values that make Latzug improved, and the workout screen loads
- **THEN** Latzug's tile shows the "improved" colour and no confetti plays

#### Scenario: Invalid input
- **WHEN** Latzug is done today and the user enters "abc" in a set field and leaves it
- **THEN** its tile stays in the "done" colour and no confetti plays

#### Scenario: Save fails
- **WHEN** an exercise turns improved and saving it fails
- **THEN** confetti plays, and the screen shows that the changes are not saved

#### Scenario: Taps during the animation
- **WHEN** confetti is playing and the user taps a set field
- **THEN** the set field gets the focus, as without confetti

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion and an exercise turns improved
- **THEN** its tile changes to the "improved" colour and no confetti plays

### Requirement: Confetti bursts from the improved exercise's tile
When the tile of the exercise that turned improved lies entirely within the visible part of the screen, above an open on-screen keyboard, the confetti SHALL burst from that tile. Otherwise it SHALL burst from both sides of the visible part of the screen.

#### Scenario: Tile on screen
- **WHEN** Latzug's tile is entirely on screen and the user leaves a field of Latzug with a set that makes it improved
- **THEN** the confetti bursts from Latzug's tile

#### Scenario: Tile out of view
- **WHEN** the tiles have scrolled out of view while the user types into Latzug's third set field, and that set makes Latzug improved
- **THEN** the confetti bursts from both sides of the visible part of the screen

#### Scenario: Tile partly on screen
- **WHEN** only part of Latzug's tile is on screen as Latzug turns improved
- **THEN** the confetti bursts from both sides of the visible part of the screen

### Requirement: The phone vibrates when an exercise turns improved
Each time the user's input changes an exercise's tile to the "improved" state, the device SHALL vibrate once, briefly, when its browser supports vibration, also when the device asks for reduced motion. It SHALL NOT vibrate when the screen loads, or when the tile already was "improved" before the change. Without support for vibration, everything else SHALL work as it does with it.

#### Scenario: Turning green on an Android phone
- **WHEN** the user's input turns Latzug's tile "improved" in Chrome on an Android phone
- **THEN** the phone vibrates once, briefly, together with the confetti

#### Scenario: No vibration without a change to improved
- **WHEN** Latzug is already improved and the user enters another set, or the workout screen loads with Latzug improved
- **THEN** the phone does not vibrate

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion and the user's input turns an exercise's tile "improved"
- **THEN** the phone vibrates once, briefly and no confetti plays

#### Scenario: Browser without vibration
- **WHEN** the browser does not support vibration, as on an iPhone, and the user's input turns an exercise's tile "improved"
- **THEN** the tile changes to the "improved" colour and confetti plays, without an error
