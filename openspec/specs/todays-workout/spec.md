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
- **AND** it shows no exercises and no way to add one

### Requirement: Today's row is found by its date
Today's row SHALL be the workout row whose date is today. If several rows have today's date, the app SHALL use the topmost one, the one with the smallest row number. If none has, there SHALL be no today's row yet, and the screen SHALL show no exercises until the user adds one.

#### Scenario: Workout already started
- **WHEN** row 14 holds "15.10.2026" with values for Latzug and Brustpresse only
- **THEN** the workout screen shows Latzug and Brustpresse with the values from row 14

#### Scenario: No workout yet today
- **WHEN** no row holds today's date
- **THEN** the workout screen shows no exercises and a way to add one
- **AND** the sheet is unchanged

#### Scenario: Today's date in two rows
- **WHEN** rows 14 and 16 both hold "15.10.2026"
- **THEN** the workout screen shows the values from row 14
- **AND** saves write to row 14

### Requirement: Exercises are listed and added
The workout screen SHALL list every exercise that has a weight or reps in today's row, in the order of the header row. The user SHALL be able to add any other exercise from the header row. Adding an exercise SHALL NOT write anything.

#### Scenario: Adding an exercise
- **WHEN** the user adds Beinpresse
- **THEN** Beinpresse appears with its weight and set fields prefilled from the last time
- **AND** the sheet is unchanged

#### Scenario: Choice of exercises to add
- **WHEN** the screen lists Latzug and Brustpresse and the user opens the choice of exercises to add
- **THEN** it offers every other exercise from the header row, and neither Latzug nor Brustpresse

#### Scenario: Weight without reps
- **WHEN** today's row holds a weight of 40 for Bizepsmaschine and no reps
- **THEN** the workout screen lists Bizepsmaschine with the weight 40 and no saved sets

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
The workout screen SHALL show whether changes are being saved, have been saved or failed to save. When a save fails, the entered values SHALL stay on screen and the screen SHALL offer to retry, which saves the current values.

#### Scenario: Saved
- **WHEN** a save succeeds
- **THEN** the screen shows that the changes are saved

#### Scenario: No connection
- **WHEN** a save fails because Google cannot be reached
- **THEN** the screen shows that the changes are not saved and offers to retry
- **AND** the entered values stay on screen
- **AND** retrying once the connection is back writes the values currently on screen

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
