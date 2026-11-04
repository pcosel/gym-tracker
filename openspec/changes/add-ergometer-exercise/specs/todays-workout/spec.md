# Spec Delta

## ADDED Requirements

### Requirement: A timed exercise has an intensity field and a time field
A timed exercise SHALL show an intensity field and one time field instead of a weight field and set fields. Neither field SHALL show a unit, and both SHALL bring up the numeric keypad on a phone. A timed exercise SHALL have no set fields and no way to add one.

#### Scenario: Opening Ergometer
- **WHEN** the user selects the tile of Ergometer
- **THEN** its editor shows a field "Intensity" and a field "Time"
- **AND** it shows no "kg", no set fields and no "+ Set"

### Requirement: Typed digits are read as minutes and seconds
The time field SHALL read its digits with the last two as seconds and any before them as minutes, so one or two digits are seconds only. Leading zeros and any character that is not a digit SHALL be ignored.

#### Scenario: Minutes and seconds
- **WHEN** the user types "330" into Ergometer's time field
- **THEN** the field shows "3:30"

#### Scenario: More than ten minutes
- **WHEN** the user types "1205" into the time field
- **THEN** the field shows "12:05"

#### Scenario: Seconds only
- **WHEN** the user types "45" into the time field
- **THEN** the field shows "0:45"

#### Scenario: Leading zero
- **WHEN** the user types "0330" into the time field
- **THEN** the field shows "3:30"

#### Scenario: Time with a colon
- **WHEN** the time field shows "3:30" and the user leaves it unchanged
- **THEN** the time stays 3 minutes 30 seconds

### Requirement: The time field formats the time while the user types
After every change the user makes to the time field, the field SHALL show its digits as a time: minutes, a colon and two digits of seconds, with the cursor at the end. There SHALL be no separate display of the time. Typing SHALL NOT mark the field as invalid or save anything. Both happen only when the user leaves the field.

#### Scenario: Typing a time
- **WHEN** the user types "4", "1" and "5" into Ergometer's empty time field, one after another
- **THEN** the field shows "0:04", then "0:41", then "4:15"
- **AND** nothing is marked as invalid and nothing is saved until the user leaves the field

#### Scenario: Deleting digits
- **WHEN** the time field shows "4:15" and the user deletes three times
- **THEN** the field shows "0:41", then "0:04", and then is empty

#### Scenario: Changing a time
- **WHEN** the time field shows "3:30" from today's row, and the user deletes twice and then types "4" and "5"
- **THEN** the field shows "0:33", "0:03", "0:34" and finally "3:45"

#### Scenario: Seconds above 59 while typing
- **WHEN** the user types "3", "9" and "0" into the empty time field
- **THEN** the field shows "0:03", "0:39" and then "3:90"
- **AND** the field is marked as invalid only once the user leaves it

#### Scenario: Other characters
- **WHEN** the user types a letter or a colon into the time field on a full keyboard
- **THEN** the field stays as it was

### Requirement: A timed exercise is prefilled from the last time
If today's row has no intensity for a timed exercise, the intensity field SHALL hold last time's intensity. If today's row has no time for it, the time field SHALL show last time's time as a placeholder. Prefilled values SHALL NOT be saved on their own.

#### Scenario: Prefill from the last workout
- **WHEN** there is no today's row and Ergometer last held "8" and "3:30"
- **THEN** its intensity field holds 8, and its time field is empty and shows 3:30 as a placeholder

#### Scenario: Today's values come first
- **WHEN** today's row holds "9" and "4:00" for Ergometer, and Ergometer last held "8" and "3:30"
- **THEN** its intensity field holds 9 and its time field holds 4:00

#### Scenario: Never done
- **WHEN** neither a workout row nor the carry-over row holds a readable time for Ergometer
- **THEN** its intensity field and time field start empty, with no placeholder

### Requirement: A timed exercise saves its intensity and time
When the user leaves the intensity field or the time field of a timed exercise after changing it, the app SHALL save that exercise. It SHALL write its intensity cell and time cell in today's row, in the notation described in the sheet-format capability. Without a time, both cells SHALL be left empty, even with an intensity.

#### Scenario: Logging Ergometer
- **WHEN** Ergometer's intensity field holds 8 and the user types "330" into its time field and leaves it
- **THEN** Ergometer's intensity cell in today's row holds "8" and its time cell holds "3:30"

#### Scenario: Without an intensity
- **WHEN** Ergometer's intensity field is empty and the user types "330" into its time field and leaves it
- **THEN** its intensity cell is empty and its time cell holds "3:30"

#### Scenario: Changing only the intensity
- **WHEN** the user changes Ergometer's intensity to 9 before entering a time and leaves the field
- **THEN** nothing is saved for Ergometer: its intensity cell and time cell stay empty

#### Scenario: Clearing the time
- **WHEN** Ergometer was saved with "8" and "3:30", and the user empties its time field and leaves it
- **THEN** both of its cells in today's row are emptied

### Requirement: Invalid timed input is not saved
The intensity field SHALL accept a whole number. The time field SHALL accept a time whose seconds are at most 59. Any other input SHALL be marked as invalid, and the exercise SHALL NOT be saved until it is corrected.

#### Scenario: Decimal intensity
- **WHEN** the user enters "8.5" as Ergometer's intensity and leaves the field
- **THEN** the field is marked as invalid and nothing is written for Ergometer

#### Scenario: Too many seconds
- **WHEN** the user types "390" into Ergometer's time field
- **THEN** the field shows "3:90"
- **AND** after the user leaves the field, it is marked as invalid and nothing is written for Ergometer

#### Scenario: Intensity that is not a number
- **WHEN** the user enters "abc" as Ergometer's intensity and leaves the field
- **THEN** the field is marked as invalid and nothing is written for Ergometer

### Requirement: A timed exercise improves with more intensity, then more time
A timed exercise done today SHALL count as improved when its intensity is higher than last time, or when its intensity is the same and its time is longer. An empty intensity SHALL count as 0. The same intensity and time as last time SHALL NOT count as improved.

#### Scenario: Higher intensity, shorter time
- **WHEN** Ergometer last held "8" and "5:00", and today holds "9" and "3:00"
- **THEN** Ergometer counts as improved, because 9 is a higher intensity than 8

#### Scenario: Same intensity, longer time
- **WHEN** Ergometer last held "8" and "3:30", and today holds "8" and "4:00"
- **THEN** Ergometer counts as improved

#### Scenario: Equal to last time
- **WHEN** Ergometer last held "8" and "3:30", and today holds "8" and "3:30"
- **THEN** Ergometer counts as done today but not as improved

#### Scenario: Lower intensity, longer time
- **WHEN** Ergometer last held "8" and "3:30", and today holds "7" and "10:00"
- **THEN** Ergometer counts as done today but not as improved, because 7 is a lower intensity than 8

#### Scenario: Without an intensity
- **WHEN** Ergometer last held an empty intensity and "3:30", and today holds an empty intensity and "4:00"
- **THEN** Ergometer counts as improved

#### Scenario: Turning green
- **WHEN** Ergometer last held "8" and "3:30", has no values today, and the user types "8" and "400" and leaves the time field
- **THEN** its tile changes to the "improved" colour

## MODIFIED Requirements

### Requirement: Each exercise has a weight and set fields
Each exercise other than a timed exercise SHALL show one weight field and a list of set fields. Each set field SHALL have a weight of its own, which defaults to the exercise weight, on the left, and a reps value on the right, as in the sheet's notation. The list SHALL have at least three fields, and at least as many as last time's sets and as today's saved sets. The user SHALL be able to add more set fields and to delete any set field.

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
For each exercise, "last time" SHALL be the lowest workout row above today's row whose reps cell for that exercise holds at least one readable set. For a timed exercise, it SHALL be the lowest such row whose time cell holds a readable time. With no today's row, all workout rows count. If no workout row qualifies, "last time" SHALL be the carry-over row, provided its reps cell for that exercise holds a readable set, or for a timed exercise its time cell a readable time.

#### Scenario: Weight without reps is skipped
- **WHEN** Bizepsmaschine has a weight but no reps in row 13, and "40" with "9, 6, 6" in row 9, and nothing in between
- **THEN** last time for Bizepsmaschine is row 9

#### Scenario: Carry-over row as fallback
- **WHEN** Beinpresse has no reps in any workout row of the tab "2026", and the carry-over row holds "69" and "15, 15, 15"
- **THEN** last time for Beinpresse is the carry-over row

#### Scenario: Never done
- **WHEN** neither a workout row nor the carry-over row holds reps for Duale Schulterpresse
- **THEN** Duale Schulterpresse has no last time, and its weight field and set fields start empty

#### Scenario: Timed exercise
- **WHEN** Ergometer has an intensity but no time in row 13, "20 min" as its time in row 12, and "8" with "3:30" in row 9
- **THEN** last time for Ergometer is row 9, because row 13 holds no time and the time in row 12 is unreadable

### Requirement: Today's row is created with the first save
If there is no today's row, the first save that writes any cell of an exercise SHALL create it in the first row below every row that holds any value. That save SHALL write today's date into column A together with the exercise's cells. Later saves SHALL use the same row. A save with nothing to write SHALL NOT create the row.

#### Scenario: First save of the day
- **WHEN** the lowest row holding any value is row 13 and the user saves the first set of Latzug on 15.10.2026
- **THEN** A14 holds "15.10.2026", Z14 holds "75" and AA14 holds "10"
- **AND** later saves on that screen write to row 14

#### Scenario: Ergometer first
- **WHEN** the lowest row holding any value is row 13 and the user logs Ergometer with "8" and "330" on 15.10.2026, before any other exercise
- **THEN** A14 holds "15.10.2026", and Ergometer's intensity and time cells in row 14 hold "8" and "3:30"

#### Scenario: Opening the app without training
- **WHEN** the user opens the workout screen and enters nothing
- **THEN** no row is created

#### Scenario: Weight changed before the first set
- **WHEN** there is no today's row and the user changes an exercise's weight before entering any set and leaves the field
- **THEN** no row is created and nothing is written to the sheet

### Requirement: Unreadable cells are edited as text
If today's weight cell or reps cell for an exercise is unreadable, or today's intensity cell or time cell for a timed exercise, the exercise SHALL show two text fields that hold the cells' text as displayed, with no set fields and no prefill. Saving SHALL write exactly the entered text.

#### Scenario: Reps with a question mark
- **WHEN** today's reps cell for an exercise displays "?, 9, 7"
- **THEN** the exercise shows a text field holding "?, 9, 7"
- **AND** after the user changes it to "8, 9, 7" and leaves the field, the cell holds "8, 9, 7"

#### Scenario: Time with a unit
- **WHEN** today's cells for Ergometer display "8" and "20 min"
- **THEN** Ergometer shows a text field "Intensity" holding "8" and a text field "Time" holding "20 min"
- **AND** after the user changes the time to "20:00" and leaves the field, the time cell holds "20:00"

### Requirement: "Done today" means at least one set with reps
An exercise SHALL count as done today when its reps cell for today holds at least one set. A timed exercise SHALL count as done today when its time cell for today holds a time, readable or not. The cells counted SHALL be those the exercise would save from the values on screen, as of the last time the user left a field of it or deleted a set. A weight alone, or an intensity alone, SHALL NOT count.

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

#### Scenario: Time entered
- **WHEN** Ergometer has no values today and the user types "330" into its time field and leaves it
- **THEN** Ergometer counts as done today

#### Scenario: Intensity only
- **WHEN** the user changes Ergometer's intensity but enters no time
- **THEN** Ergometer does not count as done today

#### Scenario: Unreadable time today
- **WHEN** today's time cell for Ergometer displays "20 min"
- **THEN** Ergometer counts as done today

### Requirement: "Improved" means more reps, heaviest weight first
An exercise done today SHALL count as improved when it beats last time. For each time, the reps SHALL be added up per weight and listed from the heaviest weight down, except for assisted exercises. The first entry where the lists differ SHALL decide: the heavier weight wins, or at the same weight the larger total. If one list ends first, the other wins. Equal lists SHALL NOT count as improved. A set's weight SHALL be its `@` weight, otherwise the weight cell's, otherwise 0 kg. A timed exercise SHALL instead be compared by intensity and time.

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
An exercise SHALL NOT count as improved when it has no last time, or when its weight or reps cell is unreadable today or last time, or for a timed exercise its intensity or time cell. It SHALL still count as done today when its reps cell holds a set, or for a timed exercise when its time cell holds a time.

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

#### Scenario: Unreadable intensity last time
- **WHEN** Ergometer last held "8 (Stufe)" and "3:30", and today holds "9" and "4:00"
- **THEN** it counts as done today but not as improved

#### Scenario: Unreadable time today
- **WHEN** Ergometer last held "8" and "3:30", and today holds "9" and "20 min"
- **THEN** it counts as done today but not as improved

#### Scenario: Ergometer never done before
- **WHEN** Ergometer has no last time and today holds "8" and "3:30"
- **THEN** it counts as done today but not as improved

### Requirement: "The last workout" is the most recent earlier workout with reps
The last workout SHALL be the lowest workout row above today's row in which at least one exercise's reps cell holds a set, or a timed exercise's time cell holds a time. With no today's row, all workout rows count. The carry-over row SHALL NOT be the last workout. If no workout row qualifies, there SHALL be no last workout. An exercise SHALL count as done in the last workout when its reps cell in that row holds at least one set, readable or not, or for a timed exercise when its time cell holds a time, readable or not. A weight alone, or an intensity alone, SHALL NOT count.

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

#### Scenario: Only Ergometer
- **WHEN** today is 15.10.2026, there is no today's row, and the lowest workout row is row 13, holding "12.10.2026" with only "8" and "3:30" for Ergometer
- **THEN** row 13 is the last workout, and Ergometer counts as done in the last workout

#### Scenario: Ergometer intensity only
- **WHEN** the last workout holds an intensity for Ergometer and no time
- **THEN** Ergometer does not count as done in the last workout

### Requirement: Exercises with an icon of their own
The exercises with the German names Bankdrücken, Bauchmaschine, Rückenheben, Bizepsmaschine, Seitheber, Schulterpresse, Trizepspull, Ruderzug, Butterfly, Beinpresse, Klimmzüge, Beinstrecker, Latzug, Duale Schulterpresse, Brustpresse, Crunchmaschine and Ergometer SHALL each have an icon of their own. Ergometer's icon SHALL show a figure on a stationary bike. A header name SHALL get an icon when it equals one of these German names, ignoring upper and lower case and an "(assistiert)" marker. Every other exercise SHALL have no icon.

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
- **WHEN** the header row names all seventeen exercises
- **THEN** no two of their tiles show the same icon

#### Scenario: Ergometer
- **WHEN** the header row names Ergometer
- **THEN** its tile shows a figure on a stationary bike and no letters

## RENAMED Requirements

- FROM: `### Requirement: Sixteen exercises have an icon`
- TO: `### Requirement: Exercises with an icon of their own`
