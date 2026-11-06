# todays-workout Specification

## Purpose

The screen the user works with at the gym. It shows the current day's workout from the year's tab, prefills it from the last time each exercise was done, and saves every change into the sheet as it is made.

## Requirements

### Requirement: Today's workout is loaded after the access check
After a successful access check, the app SHALL read the year's tab and show the workout screen for today, with a progress indication while it reads. "Today" SHALL be the device's local date when the screen loads. The screen SHALL show that date, the spreadsheet's title, and the signed-in email next to "Sign out".

#### Scenario: Opening the app
- **WHEN** the access check succeeds on 15.10.2026
- **THEN** the app shows a progress indication while it reads the tab "2026"
- **AND** then shows the workout screen with the date 15.10.2026, the spreadsheet's title and the signed-in email

#### Scenario: App left open past midnight
- **WHEN** the workout screen was loaded on 15.10.2026 and is still open after midnight
- **THEN** it keeps working on 15.10.2026 until the page is reloaded

### Requirement: Failure to read the tab is reported
If reading the year's tab fails, the app SHALL behave as it does when the access check fails for the same reason, as described in the sheet-access capability.

#### Scenario: Google is temporarily unavailable
- **WHEN** reading the tab receives HTTP 503
- **THEN** the app shows the sign-in screen with a message saying Google is unavailable and to try again shortly
- **AND** signing in again repeats the access check and the read

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

### Requirement: Each exercise has a weight and set fields
Each exercise SHALL show one weight field and a list of set fields. Each set field SHALL have a weight of its own, which defaults to the exercise weight, on the left, and a reps value on the right, as in the sheet's notation. The list SHALL have at least three fields, and at least as many as last time's sets and as today's saved sets. The user SHALL be able to add more set fields and to delete any set field.

#### Scenario: Three fields by default
- **WHEN** an exercise was last done with two sets and has no sets today
- **THEN** it shows three set fields

#### Scenario: More sets last time
- **WHEN** an exercise was last done with four sets
- **THEN** it shows four set fields

#### Scenario: Adding a set field
- **WHEN** the user selects "+ Set" on an exercise showing three set fields
- **THEN** it shows four set fields

#### Scenario: Deleting a set
- **WHEN** an exercise was last done with four sets, the user entered reps 10, 9 and 8 today, and deletes the empty fourth set field
- **THEN** it shows three set fields and nothing is written

#### Scenario: Deleting a set that holds reps
- **WHEN** the reps cell holds "10, 9, 8" and the user deletes the second set field
- **THEN** the reps cell holds "10, 8"

### Requirement: "Last time" is the most recent earlier record
For each exercise, "last time" SHALL be the lowest workout row above today's row whose reps cell for that exercise holds at least one readable set. With no today's row, all workout rows count. If no workout row qualifies, "last time" SHALL be the carry-over row, provided its reps cell for that exercise holds a readable set.

#### Scenario: Weight without reps is skipped
- **WHEN** Bizepsmaschine has a weight but no reps in row 13, and "40" with "9, 6, 6" in row 9, and nothing in between
- **THEN** last time for Bizepsmaschine is row 9

#### Scenario: Carry-over row as fallback
- **WHEN** Beinpresse has no reps in any workout row of the tab "2026", and the carry-over row holds "69" and "15, 15, 15"
- **THEN** last time for Beinpresse is the carry-over row

#### Scenario: Never done
- **WHEN** neither a workout row nor the carry-over row holds reps for Duale Schulterpresse
- **THEN** Duale Schulterpresse has no last time, and its weight field and set fields start empty

### Requirement: Fields are prefilled from the last time
If today's row has no weight for an exercise, the weight field SHALL hold last time's weight. A set field without saved reps today SHALL show last time's reps at the same position as a placeholder. It SHALL take last time's weight for that position as its own when that set had an `@` weight. Prefilled values SHALL NOT be saved on their own.

#### Scenario: Prefill from the last workout
- **WHEN** there is no today's row and Bankdrücken last held "55" and "14"
- **THEN** its weight field holds 55, the first set field shows 14 as a placeholder, and the second and third set fields are empty

#### Scenario: Sets with their own weight
- **WHEN** Bankdrücken last held "50" and "12@40, 10, 10@55"
- **THEN** the weight field holds 50
- **AND** the set fields show the placeholders 12, 10 and 10, with the first set's weight set to 40, the second following the exercise weight, and the third set's weight set to 55

#### Scenario: Today's values come first
- **WHEN** today's row holds "75" and "10" for Latzug, and Latzug last held "75" and "9, 7, 8"
- **THEN** the weight field holds 75, the first set field holds 10, and the second and third set fields show 7 and 8 as placeholders

#### Scenario: Unreadable entry last time
- **WHEN** an exercise last held "?, 9, 7" as reps
- **THEN** the first set field shows no placeholder, and the second and third show 9 and 7

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

### Requirement: Each change is saved when the field is left
When the user leaves a weight field or set field after changing it, the app SHALL save that exercise. It SHALL write the exercise's weight cell and reps cell in today's row, in the notation described in the sheet-format capability. Only set fields that hold reps SHALL be included. An exercise without any reps SHALL leave both cells empty, even when it has a weight.

#### Scenario: Logging the first set
- **WHEN** Latzug's weight field holds 75 and the user enters 10 in the first set field and leaves it
- **THEN** Latzug's weight cell in today's row holds "75" and its reps cell holds "10"

#### Scenario: Set with its own weight
- **WHEN** Latzug's sets hold 10, 9 and 8, the third with its own weight of 70, at an exercise weight of 75
- **THEN** Latzug's reps cell holds "10, 9, 8@70"

#### Scenario: Empty set fields are left out
- **WHEN** the first set field holds 10, the second is empty and the third holds 8
- **THEN** the reps cell holds "10, 8"

#### Scenario: Changing only the weight
- **WHEN** the user changes an exercise's weight to 80 before entering any set and leaves the field
- **THEN** nothing is saved for the exercise: its weight cell and reps cell stay empty

#### Scenario: Clearing an exercise
- **WHEN** the user empties the weight field and every set field of an exercise
- **THEN** both of its cells in today's row are emptied

#### Scenario: Deleting the reps again
- **WHEN** the user entered reps for an exercise, so it was saved, and then empties every set field but leaves the weight
- **THEN** both of its cells in today's row are emptied

#### Scenario: Prefilled values alone are not saved
- **WHEN** the user adds an exercise and changes nothing
- **THEN** nothing is written to the sheet

### Requirement: The exercise weight applies to sets without their own weight
Changing the exercise weight SHALL change the weight of every set that has no weight of its own, just as editing the weight cell in the sheet does. Sets with their own weight SHALL keep it. A set whose own weight equals the exercise weight SHALL be saved without `@`.

#### Scenario: Raising the weight
- **WHEN** an exercise holds 75 with the sets 10, 10 and 8 at its own weight of 70, and the user changes the weight to 80
- **THEN** the weight cell holds "80" and the reps cell holds "10, 10, 8@70"

#### Scenario: Own weight equal to the exercise weight
- **WHEN** a set's own weight is 80 and the exercise weight is 80
- **THEN** that set is saved without `@`

### Requirement: Today's row is created with the first save
If there is no today's row, the first save that writes a weight or reps SHALL create it in the first row below every row that holds any value. That save SHALL write today's date into column A together with the exercise's cells. Later saves SHALL use the same row. A save with nothing to write SHALL NOT create the row.

#### Scenario: First save of the day
- **WHEN** the lowest row holding any value is row 13 and the user saves the first set of Latzug on 15.10.2026
- **THEN** A14 holds "15.10.2026", Z14 holds "75" and AA14 holds "10"
- **AND** later saves on that screen write to row 14

#### Scenario: Opening the app without training
- **WHEN** the user opens the workout screen and enters nothing
- **THEN** no row is created

#### Scenario: Weight changed before the first set
- **WHEN** there is no today's row and the user changes an exercise's weight before entering any set and leaves the field
- **THEN** no row is created and nothing is written to the sheet

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

### Requirement: The sheet ends up with the latest values
When the user makes changes while an earlier save is still in progress, the sheet SHALL end up holding the values that were entered last.

#### Scenario: Quick changes
- **WHEN** the user enters 10 in the first set field and 9 in the second, and leaves the second field before the first save has finished
- **THEN** the reps cell finally holds "10, 9"

### Requirement: Unreadable cells are edited as text
If today's weight cell or reps cell for an exercise is unreadable, the exercise SHALL show two text fields that hold the cells' text as displayed, with no set fields and no prefill. Saving SHALL write exactly the entered text.

#### Scenario: Reps with a question mark
- **WHEN** today's reps cell for an exercise displays "?, 9, 7"
- **THEN** the exercise shows a text field holding "?, 9, 7"
- **AND** after the user changes it to "8, 9, 7" and leaves the field, the cell holds "8, 9, 7"

### Requirement: Invalid input is not saved
A weight field SHALL accept a non-negative number with a dot or a comma as decimal separator. A set field SHALL accept a whole number of reps. Any other input SHALL be marked as invalid, and the exercise SHALL NOT be saved until it is corrected.

#### Scenario: Decimal comma
- **WHEN** the user enters "17,5" as the weight
- **THEN** the weight cell holds "17.5"

#### Scenario: Not a number
- **WHEN** the user enters "abc" in a set field and leaves it
- **THEN** the field is marked as invalid and nothing is written for that exercise

### Requirement: Sheet text is shown as text
Exercise names and cell text from the sheet SHALL be displayed as plain text and never interpreted as HTML.

#### Scenario: Header that looks like markup
- **WHEN** a header cell holds `<b>Latzug</b>`
- **THEN** the screen shows the characters `<b>Latzug</b>` literally

### Requirement: Exercises are shown as tiles
The workout screen SHALL show one tile for every exercise of the header row, in the order of the header row, above the exercise editor. Each tile SHALL show the exercise's icon if it has one, and its label otherwise. An icon SHALL stay visible in each of the tile's state colours. Each tile SHALL have the exercise's full name and its state today as its accessible name.

#### Scenario: Tiles for every exercise
- **WHEN** the header row names Bankdrücken, Latzug and Beinpresse, and only Latzug has values today
- **THEN** the workout screen shows three tiles, for Bankdrücken, Latzug and Beinpresse, in that order

#### Scenario: Icon or label
- **WHEN** the header row names Latzug, then Kniebeuge
- **THEN** Latzug's tile shows its icon and Kniebeuge's tile shows "Kn"

#### Scenario: Icon on a coloured tile
- **WHEN** Latzug is done today
- **THEN** its tile shows the "done" colour, and its icon is drawn in the tile's text colour for that state

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the tile of Latzug, which is done today
- **THEN** it announces the full name "Latzug" and that it is done today

### Requirement: Tile labels are unique
A tile without an icon SHALL show a label: the first letter of the exercise's name followed by its second letter, the first in upper case and the second in lower case. Only letters SHALL count. If an earlier tile already shows that label, ignoring case, the second letter SHALL be the next letter of the name that gives an unused label. If no letter does, the label SHALL stay the first two letters. Tiles with an icon SHALL NOT take a label.

#### Scenario: Plain label
- **WHEN** the header row names Kniebeuge
- **THEN** its tile shows "Kn"

#### Scenario: Name with several words
- **WHEN** the header row names Schräges Bankdrücken
- **THEN** its tile shows "Sc"

#### Scenario: Two names with the same first letters
- **WHEN** the header row names Wadenheben, then Wadenpresse
- **THEN** Wadenheben's tile shows "Wa" and Wadenpresse's tile shows "Wd"

#### Scenario: Repeated letters are skipped
- **WHEN** the header row names Wadenheben, Wadenpresse, then Wadenstrecker
- **THEN** Wadenstrecker's tile skips "Wa" and "Wd", both taken, and shows "We"

#### Scenario: Icon tiles do not take labels
- **WHEN** the header row names Bankdrücken, Bauchmaschine, then Bauchpresse
- **THEN** Bankdrücken and Bauchmaschine show their icons, and Bauchpresse's tile shows "Ba"

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

### Requirement: Sixteen exercises have an icon
The exercises with the German names Bankdrücken, Bauchmaschine, Rückenheben, Bizepsmaschine, Seitheber, Schulterpresse, Trizepspull, Ruderzug, Butterfly, Beinpresse, Klimmzüge, Beinstrecker, Latzug, Duale Schulterpresse, Brustpresse and Crunchmaschine SHALL each have an icon of their own. A header name SHALL get an icon when it equals one of these German names, ignoring upper and lower case and an "(assistiert)" marker. Every other exercise SHALL have no icon.

#### Scenario: Exercise with an icon
- **WHEN** the header row names Latzug
- **THEN** Latzug's tile shows its icon and no letters

#### Scenario: Different case
- **WHEN** the header row names "LATZUG"
- **THEN** its tile shows Latzug's icon

#### Scenario: Assisted exercise
- **WHEN** the header row names "Latzug (assistiert)"
- **THEN** its tile shows Latzug's icon

#### Scenario: Different spelling
- **WHEN** the header row names "Klimmzug"
- **THEN** its tile shows no icon and the label "Kl"

#### Scenario: Every icon is different
- **WHEN** the header row names all sixteen exercises
- **THEN** no two of their tiles show the same icon

### Requirement: Assisted Klimmzüge show the assistance
When Klimmzüge is marked "(assistiert)", its icon SHALL show an upward arrow for the assistance. Without the marker, Klimmzüge SHALL show the same figure without the arrow. No other exercise SHALL show an assistance arrow, with or without the marker.

#### Scenario: Assisted Klimmzüge
- **WHEN** the header row names "Klimmzüge (assistiert)"
- **THEN** its tile shows the pull-up figure with an upward arrow

#### Scenario: Marker in another case
- **WHEN** the header row names "Klimmzüge (Assistiert)"
- **THEN** its tile shows the pull-up figure with an upward arrow

#### Scenario: Klimmzüge without assistance
- **WHEN** the header row names "Klimmzüge"
- **THEN** its tile shows the same pull-up figure without the arrow

### Requirement: "The last workout" is the most recent earlier workout with reps
The last workout SHALL be the lowest workout row above today's row in which at least one exercise's reps cell holds a set. With no today's row, all workout rows count. The carry-over row SHALL NOT be the last workout. If no workout row qualifies, there SHALL be no last workout. An exercise SHALL count as done in the last workout when its reps cell in that row holds at least one set, readable or not. A weight alone SHALL NOT count.

#### Scenario: Previous workout
- **WHEN** today is 15.10.2026, there is no today's row, and the lowest workout row is row 13, holding "12.10.2026" with reps for Latzug and Brustpresse
- **THEN** row 13 is the last workout, and Latzug and Brustpresse count as done in the last workout

#### Scenario: Workout already started
- **WHEN** today is 15.10.2026, row 14 holds "15.10.2026" with reps for Brustpresse, and row 13 holds "12.10.2026" with reps for Latzug
- **THEN** row 14 is today's row, and row 13 is the last workout

#### Scenario: Row without reps is skipped
- **WHEN** today is 15.10.2026, there is no today's row, the lowest workout row is row 13, holding "12.10.2026" with only a weight for Bizepsmaschine, and row 12 holds "10.10.2026" with reps for Latzug
- **THEN** row 12 is the last workout, and Bizepsmaschine does not count as done in the last workout

#### Scenario: Exercise skipped in the last workout
- **WHEN** the last workout has reps for Latzug only, and Bankdrücken last held reps in an earlier row
- **THEN** Bankdrücken does not count as done in the last workout
- **AND** that earlier row is still Bankdrücken's last time

#### Scenario: Unreadable reps in the last workout
- **WHEN** Latzug's reps cell in the last workout displays "?, 9, 7"
- **THEN** Latzug counts as done in the last workout

#### Scenario: Start of a year
- **WHEN** the tab "2027" holds the header row, a carry-over row with reps for Latzug, and no workout row with reps
- **THEN** there is no last workout, and no exercise counts as done in the last workout

### Requirement: Tiles mark exercises done in the last workout
A tile in the "not done" state SHALL have a border in the "done" colour when its exercise counts as done in the last workout, and keep the "not done" colour. Tiles in the "done" and "improved" states SHALL NOT show this border. The border SHALL appear and disappear as the tile's state changes. While a tile shows the border, its accessible name SHALL also say that the exercise was done in the last workout.

#### Scenario: Done in the last workout, not yet today
- **WHEN** Latzug counts as done in the last workout and is not done today
- **THEN** its tile shows the "not done" colour with a border in the "done" colour

#### Scenario: Not done in the last workout
- **WHEN** Bankdrücken does not count as done in the last workout and is not done today
- **THEN** its tile shows the "not done" colour without the border

#### Scenario: Done again today
- **WHEN** Latzug's tile shows the border and the user enters its first set and leaves the field
- **THEN** its tile changes to the "done" colour, like every tile done today

#### Scenario: Reps removed again
- **WHEN** Latzug counts as done in the last workout and is done today with one set, and the user deletes that set
- **THEN** its tile shows the "not done" colour with the border again

#### Scenario: No last workout
- **WHEN** there is no last workout
- **THEN** no tile shows the border

#### Scenario: Selected tile
- **WHEN** the user selects a tile that shows the border
- **THEN** the tile shows both the border and the selection mark

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the tile of Latzug, which is not done today and was done in the last workout
- **THEN** it announces the full name "Latzug", that it is not done today, and that it was done in the last workout

#### Scenario: The counter counts only today
- **WHEN** three tiles show the border and no exercise is done today
- **THEN** the screen shows that 0 exercises are done today

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
