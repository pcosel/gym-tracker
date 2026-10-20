# Spec Delta

## ADDED Requirements

### Requirement: Exercises are shown as tiles
The workout screen SHALL show one tile for every exercise of the header row, in the order of the header row, above the exercise editor. Each tile SHALL show the exercise's label and SHALL have the exercise's full name and its state today as its accessible name.

#### Scenario: Tiles for every exercise
- **WHEN** the header row names Bankdrücken, Latzug and Beinpresse, and only Latzug has values today
- **THEN** the workout screen shows three tiles, for Bankdrücken, Latzug and Beinpresse, in that order

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the tile of Latzug, which is done today
- **THEN** it announces the full name "Latzug" and that it is done today

### Requirement: Tile labels are unique
A tile's label SHALL be the first letter of the exercise's name followed by its second letter, the first in upper case and the second in lower case. Only letters SHALL count. If a tile earlier in header order already has that label, ignoring case, the second letter SHALL be the next letter of the name that gives an unused label. If no letter does, the label SHALL stay the first two letters.

#### Scenario: Plain label
- **WHEN** the header row names Latzug
- **THEN** its tile shows "La"

#### Scenario: Name with several words
- **WHEN** the header row names Duale Schulterpresse
- **THEN** its tile shows "Du"

#### Scenario: Two names with the same first letters
- **WHEN** the header row names Bankdrücken, then Bauchmaschine
- **THEN** Bankdrücken's tile shows "Ba" and Bauchmaschine's tile shows "Bu"

#### Scenario: Repeated letters are skipped
- **WHEN** the header row names Bankdrücken, Bauchmaschine, then Bauchpresse
- **THEN** Bauchpresse's tile skips "Ba" and "Bu", both taken, and shows "Bc"

### Requirement: Selecting a tile opens its exercise
Selecting a tile SHALL show that exercise's editor below the tiles and mark the tile as selected. Only one exercise SHALL be open at a time. Selecting another tile SHALL keep the values entered in the exercise left. Selecting a tile SHALL NOT write anything. When the screen loads, no exercise SHALL be open.

#### Scenario: Opening an exercise not done today
- **WHEN** the user selects the tile of Beinpresse, which has no values today
- **THEN** Beinpresse's editor appears with its weight and set fields prefilled from the last time
- **AND** the sheet is unchanged

#### Scenario: Opening an exercise done today
- **WHEN** today's row holds "75" and "10, 9" for Latzug and the user selects its tile
- **THEN** Latzug's editor shows the weight 75 and the sets 10 and 9

#### Scenario: Weight without reps
- **WHEN** today's row holds a weight of 40 for Bizepsmaschine and no reps, and the user selects its tile
- **THEN** Bizepsmaschine's editor shows the weight 40 and no saved sets

#### Scenario: Switching exercises
- **WHEN** the user enters 10 in Latzug's first set field and then selects the tile of Brustpresse
- **THEN** Latzug's change is saved as when leaving the field
- **AND** only Brustpresse's editor is shown, and selecting Latzug's tile again shows 10 in its first set field

#### Scenario: Nothing open on load
- **WHEN** the workout screen loads
- **THEN** no tile is selected and no exercise editor is shown

### Requirement: "Done today" means at least one set with reps
An exercise SHALL count as done today when its reps cell for today holds at least one set. The cells counted SHALL be those the exercise would save from the values on screen, as of the last time the user left a field of it or deleted a set. A weight alone SHALL NOT count.

#### Scenario: Reps loaded from the sheet
- **WHEN** today's row holds "75" and "10" for Latzug
- **THEN** Latzug counts as done today when the screen loads

#### Scenario: First set entered
- **WHEN** Latzug has no values today and the user enters 10 in its first set field and leaves it
- **THEN** Latzug counts as done today

#### Scenario: Weight only
- **WHEN** the user changes an exercise's weight but enters no reps
- **THEN** the exercise does not count as done today

#### Scenario: Reps removed again
- **WHEN** Latzug is done today with one set, and the user deletes that set
- **THEN** Latzug no longer counts as done today

#### Scenario: Unreadable reps today
- **WHEN** today's reps cell for an exercise displays "?, 9, 7"
- **THEN** the exercise counts as done today

### Requirement: "Improved" means more reps, heaviest weight first
An exercise done today SHALL count as improved when it beats last time. For each time, the reps SHALL be added up per weight and listed from the heaviest weight down, except for assisted exercises. The first entry where the lists differ SHALL decide: the heavier weight wins, or at the same weight the larger total. If one list ends first, the other wins. Equal lists SHALL NOT count as improved. A set's weight SHALL be its `@` weight, otherwise the weight cell's, otherwise 0 kg.

#### Scenario: Same sets in another order
- **WHEN** Latzug last held "75" and "9, 11, 9", and today holds "75" and "11, 9, 9"
- **THEN** Latzug counts as done today but not as improved, because both times add up to 29 reps at 75 kg

#### Scenario: One set better, two worse
- **WHEN** Latzug last held "75" and "9, 9, 9", and today holds "75" and "11, 8, 8"
- **THEN** Latzug counts as done today but not as improved, because both times add up to 27 reps

#### Scenario: One more rep
- **WHEN** Latzug last held "75" and "9, 9, 9", and today holds "75" and "10, 9, 9"
- **THEN** Latzug counts as improved, because 28 reps beat 27

#### Scenario: Gains outweigh a loss
- **WHEN** Latzug last held "75" and "9, 9, 9", and today holds "75" and "12, 12, 8"
- **THEN** Latzug counts as improved, because 32 reps beat 27

#### Scenario: Losses outweigh gains
- **WHEN** Latzug last held "75" and "10, 10, 10", and today holds "75" and "11, 11, 2"
- **THEN** Latzug counts as done today but not as improved, because 24 reps are fewer than 30

#### Scenario: Equal to last time
- **WHEN** Latzug last held "75" and "10, 9", and today holds "75" and "10, 9"
- **THEN** Latzug counts as done today but not as improved

#### Scenario: Extra set
- **WHEN** Latzug last held "75" and "10", and today holds "75" and "10, 6"
- **THEN** Latzug counts as improved, because 16 reps beat 10

#### Scenario: Workout in progress
- **WHEN** Latzug last held "75" and "9, 7, 8", and today holds "75" and "9, 8" so far
- **THEN** Latzug counts as done today but not as improved, because 17 reps are fewer than 24
- **AND** it counts as improved once a third set of 8 or more reps is entered

#### Scenario: More weight with fewer reps
- **WHEN** Latzug last held "75" and "10, 10, 10", and today holds "80" and "8, 7, 7"
- **THEN** Latzug counts as improved, because 80 kg is heavier than any weight last time

#### Scenario: Less weight with more reps
- **WHEN** Latzug last held "75" and "8", and today holds "70" and "12"
- **THEN** Latzug counts as done today but not as improved, because 70 kg is lighter than 75 kg

#### Scenario: Own weight of a set
- **WHEN** Bankdrücken last held "50" and "12@40, 10, 10", and today holds "50" and "12@45, 10, 10"
- **THEN** Bankdrücken counts as improved, because both times have 20 reps at 50 kg, and 45 kg beats 40 kg

#### Scenario: One heavier set
- **WHEN** Latzug last held "75" and "10, 10, 10", and today holds "80" and "10, 8@75, 8@75"
- **THEN** Latzug counts as improved, because 80 kg is heavier than any weight last time

#### Scenario: The heaviest weight decides first
- **WHEN** Bankdrücken last held "50" and "10, 10, 10, 12@40", and today holds "50" and "10, 10, 9, 15@40"
- **THEN** Bankdrücken counts as done today but not as improved, because 29 reps at 50 kg are fewer than 30, whatever happened at 40 kg

#### Scenario: Extra lighter set
- **WHEN** Bankdrücken last held "50" and "10, 10, 10", and today holds "50" and "12@30, 10, 10, 10"
- **THEN** Bankdrücken counts as improved, because both times have 30 reps at 50 kg, and only today has sets at a lighter weight

### Requirement: "Improved" needs readable cells both times
An exercise SHALL NOT count as improved when it has no last time, or when its weight or reps cell is unreadable today or last time. It SHALL still count as done today when its reps cell holds a set.

#### Scenario: Never done before
- **WHEN** Duale Schulterpresse has no last time and today holds "30" and "12"
- **THEN** it counts as done today but not as improved

#### Scenario: Unreadable entry last time
- **WHEN** an exercise last held "?, 9, 7" at 50 kg, and today holds "50" and "1, 10, 7"
- **THEN** it counts as done today but not as improved, because last time's total is unknown

#### Scenario: Unreadable weight last time
- **WHEN** an exercise last held "25 (Seil)" and "10, 10", and today holds "25" and "10, 10"
- **THEN** it counts as done today but not as improved

#### Scenario: Unreadable weight today
- **WHEN** an exercise last held "20" and "5", and today holds "25 (Seil)" and "10"
- **THEN** it counts as done today but not as improved

### Requirement: Assisted exercises improve with less weight
An exercise whose name contains "(assistiert)", ignoring case, SHALL count as assisted, and its weight SHALL be the assistance it got. For an assisted exercise, the reps per weight SHALL be listed from the lightest weight up, so that at the first difference the lighter weight wins, or at the same weight the larger total. Everything else about "improved" SHALL stay the same. An empty weight SHALL count as 0 kg, meaning no assistance.

#### Scenario: Less assistance
- **WHEN** Klimmzüge (assistiert) last held "30" and "8, 8, 8", and today holds "25" and "6, 6, 5"
- **THEN** it counts as improved, because 25 kg is less assistance than any weight last time

#### Scenario: More assistance with more reps
- **WHEN** Klimmzüge (assistiert) last held "25" and "8, 8", and today holds "30" and "10, 10"
- **THEN** it counts as done today but not as improved, because 30 kg is more assistance than 25 kg

#### Scenario: Same assistance with more reps
- **WHEN** Klimmzüge (assistiert) last held "25" and "8, 8, 8", and today holds "25" and "9, 8, 8"
- **THEN** it counts as improved, because 25 reps beat 24

#### Scenario: No assistance
- **WHEN** Klimmzüge (assistiert) last held "20" and "8, 8", and today holds an empty weight and "3"
- **THEN** it counts as improved, because no assistance beats 20 kg

#### Scenario: Marker in another case
- **WHEN** Dips (Assistiert) last held "20" and "10", and today holds "15" and "8"
- **THEN** it counts as improved, because it is an assisted exercise and 15 kg is less assistance than 20 kg

#### Scenario: Name without the marker
- **WHEN** Assisted Pullups last held "30" and "8", and today holds "25" and "8"
- **THEN** it counts as done today but not as improved, because without "(assistiert)" in its name it is not an assisted exercise

### Requirement: Tiles show each exercise's state today
Each tile SHALL show whether its exercise is not done today, done today, or improved, with a distinct colour for each state. An improved exercise SHALL show only the improved colour. A tile SHALL change its state as soon as the exercise's state changes. While an exercise has input marked as invalid, its tile SHALL keep its previous state.

#### Scenario: Colour changes with the first set
- **WHEN** the user enters the first set of an exercise not done today and leaves the field
- **THEN** its tile changes from the "not done" colour to the "done" colour

#### Scenario: Colour changes with an improvement
- **WHEN** Latzug last held "75" and "10, 10, 10", today holds "75" and "10, 10, 10", and the user enters 1 in a fourth set field and leaves it
- **THEN** its tile changes from the "done" colour to the "improved" colour

#### Scenario: Invalid input
- **WHEN** an exercise is done today and the user enters "abc" in a set field and leaves it
- **THEN** its tile stays in the "done" colour

### Requirement: The number of exercises done today is shown
The workout screen SHALL show how many exercises count as done today, including improved ones. The number SHALL change together with the tiles.

#### Scenario: Counting
- **WHEN** Latzug and Brustpresse are done today and Bankdrücken is improved
- **THEN** the screen shows that 3 exercises are done today

#### Scenario: Nothing done yet
- **WHEN** no exercise has reps today
- **THEN** the screen shows that 0 exercises are done today

## MODIFIED Requirements

### Requirement: Missing year tab is reported
If the spreadsheet has no tab for the current year, the workout screen SHALL name the missing tab and say that it has to be added in Google Sheets. It SHALL offer no editing and the app SHALL write nothing.

#### Scenario: New year without a tab
- **WHEN** the device date is 02.01.2027 and the spreadsheet has no tab "2027"
- **THEN** the workout screen says that the tab "2027" is missing and has to be added in Google Sheets
- **AND** it shows no exercise tiles, no count of exercises done and no exercise editor

### Requirement: Today's row is found by its date
Today's row SHALL be the workout row whose date is today. If several rows have today's date, the app SHALL use the topmost one, the one with the smallest row number. If none has, there SHALL be no today's row yet, and no exercise SHALL count as done today until the user enters reps.

#### Scenario: Workout already started
- **WHEN** row 14 holds "15.10.2026" with values for Latzug and Brustpresse only
- **THEN** the tiles of Latzug and Brustpresse show their state from row 14, and every other tile shows "not done"
- **AND** opening Latzug or Brustpresse shows the values from row 14

#### Scenario: No workout yet today
- **WHEN** no row holds today's date
- **THEN** every tile shows "not done" and the screen shows that 0 exercises are done today
- **AND** the sheet is unchanged

#### Scenario: Today's date in two rows
- **WHEN** rows 14 and 16 both hold "15.10.2026"
- **THEN** the workout screen shows the values from row 14
- **AND** saves write to row 14

### Requirement: Save status is shown
The workout screen SHALL show whether changes are being saved, have been saved or failed to save. The status SHALL be visible whichever exercise is open, and when none is. When a save fails, the entered values SHALL stay on screen and the screen SHALL offer to retry, which saves the current values.

#### Scenario: Saved
- **WHEN** a save succeeds
- **THEN** the screen shows that the changes are saved

#### Scenario: No connection
- **WHEN** a save fails because Google cannot be reached
- **THEN** the screen shows that the changes are not saved and offers to retry
- **AND** the entered values stay on screen
- **AND** retrying once the connection is back writes the values currently on screen

#### Scenario: Failure after switching exercises
- **WHEN** a save of Latzug fails after the user has already opened Brustpresse
- **THEN** the screen shows that the changes are not saved while Brustpresse is open

## REMOVED Requirements

### Requirement: Exercises are listed and added
**Reason**: The list of today's exercises and the "Add an exercise…" choice are replaced by a tile for every exercise of the header row, which opens its editor when selected.
**Migration**: Select an exercise's tile to open it. Opening an exercise writes nothing, as adding one did. Its scenarios move to "Selecting a tile opens its exercise".
