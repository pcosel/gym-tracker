# Spec Delta

## ADDED Requirements

### Requirement: Ergometer is a timed exercise
An exercise whose name is "Ergometer", ignoring upper and lower case, SHALL be a timed exercise. Its two columns SHALL hold an intensity and a time instead of a weight and reps. Every other exercise SHALL keep its weight and reps columns.

#### Scenario: Ergometer in the header
- **WHEN** row 1 holds "Ergometer" in AH1, merged across AH1:AI1
- **THEN** Ergometer is a timed exercise, with its intensity in column AH and its time in column AI

#### Scenario: Different case
- **WHEN** row 1 names "ERGOMETER"
- **THEN** it is a timed exercise

#### Scenario: Different spelling
- **WHEN** row 1 names "Fahrradergometer"
- **THEN** it is not a timed exercise, and its columns hold a weight and reps

### Requirement: Intensity cell notation
The intensity cell of a timed exercise SHALL hold the intensity as one whole number, without a unit. On reading, the app SHALL ignore surrounding spaces.

#### Scenario: Intensities
- **WHEN** intensity cells display "8", " 12" and "10 "
- **THEN** the app reads the intensities 8, 12 and 10

### Requirement: Time cell notation
The time cell of a timed exercise SHALL hold one time as whole minutes, a colon and two digits of seconds from 00 to 59. The minutes SHALL have no upper limit. On reading, the app SHALL ignore surrounding spaces and leading zeros of the minutes.

#### Scenario: Minutes and seconds
- **WHEN** time cells display "3:30", "12:05" and "0:45"
- **THEN** the app reads 3 minutes 30 seconds, 12 minutes 5 seconds and 45 seconds

#### Scenario: An hour or more
- **WHEN** a time cell displays "75:00"
- **THEN** the app reads 75 minutes

#### Scenario: Leading zero
- **WHEN** a time cell displays "03:30"
- **THEN** the app reads 3 minutes 30 seconds

#### Scenario: Time typed by hand
- **WHEN** the user typed "3:30" into an Ergometer time cell in Google Sheets, which stored it as a time of day and displays "03:30"
- **THEN** the app reads 3 minutes 30 seconds

### Requirement: Intensity and time cells hold one value
An intensity cell and a time cell SHALL each hold exactly one value. Unlike the reps cell, they SHALL NOT hold a list. A cell with more than one value, separated by commas, spaces or anything else, SHALL be unreadable.

#### Scenario: Several intensities
- **WHEN** Ergometer's intensity cell displays "8, 9" or "8 9"
- **THEN** the app treats it as unreadable

#### Scenario: Several times
- **WHEN** Ergometer's time cell displays "3:30, 2:00" or "3:30 2:00"
- **THEN** the app treats it as unreadable
- **AND** it does not change it unless the user edits it

## MODIFIED Requirements

### Requirement: Exercises come from the header row
Row 1 SHALL define the exercises. From column B on, each exercise SHALL occupy two adjacent columns, weight first and reps second, or for a timed exercise intensity first and time second. Its name SHALL be the trimmed text in row 1 above the first of its columns. A pair with an empty header cell there SHALL NOT be an exercise. The app SHALL NOT depend on a fixed order, number or set of exercises.

#### Scenario: Merged header
- **WHEN** row 1 holds "Datum" in A1, "Bankdrücken" in B1 merged across B1:C1, and "Bauchmaschine" in D1 merged across D1:E1
- **THEN** Bankdrücken uses column B for weight and column C for reps
- **AND** Bauchmaschine uses columns D and E

#### Scenario: Unmerged header
- **WHEN** row 1 holds "Latzug" in Z1, and AA1 is empty and not merged
- **THEN** Latzug uses column Z for weight and column AA for reps

#### Scenario: A new year reorders the exercises
- **WHEN** the tab for a new year lists the exercises in a different order, or adds or drops one
- **THEN** the app maps each exercise to its columns in that tab without any code change

#### Scenario: Timed exercise
- **WHEN** row 1 holds "Ergometer" in AH1, merged across AH1:AI1
- **THEN** Ergometer uses column AH for its intensity and column AI for its time

### Requirement: Cells are written as plain text
The app SHALL store every cell it writes as the exact text it sends, so that Google Sheets never converts it into a date, a time or a number.

#### Scenario: Reps in an "Automatic" column
- **WHEN** the app writes "12, 10, 10" into a reps cell of a column formatted as "Automatic"
- **THEN** the cell holds the text "12, 10, 10" and not a date

#### Scenario: Date cell
- **WHEN** the app writes the date 15 October 2026 into column A
- **THEN** the cell holds the text "15.10.2026"

#### Scenario: Time in an "Automatic" column
- **WHEN** the app writes "3:30" into Ergometer's time cell in a column formatted as "Automatic"
- **THEN** the cell holds the text "3:30" and not a time of day

### Requirement: Written cells use the standard notation
When the app formats cells itself, it SHALL write:
- the date as `dd.mm.yyyy` with leading zeros;
- the weight as a number with a dot as decimal separator and no trailing zeros;
- the sets joined by a comma and a space, with `@` and a weight only on sets whose weight differs from the weight cell;
- the intensity as a whole number without leading zeros;
- the time as minutes without leading zeros, a colon and two digits of seconds.

#### Scenario: Sets with their own weight
- **WHEN** the app saves a weight of 50 and the sets 12 reps at 40 kg, 10 reps at 50 kg and 10 reps at 55 kg
- **THEN** the weight cell holds "50" and the reps cell holds "12@40, 10, 10@55"

#### Scenario: Number formatting
- **WHEN** the app saves the weights 17.5 and 20.0 and the date 5 September 2026
- **THEN** it writes "17.5", "20" and "05.09.2026"

#### Scenario: Intensity and time
- **WHEN** the app saves Ergometer with the intensity 8 and a time of 3 minutes 5 seconds
- **THEN** the intensity cell holds "8" and the time cell holds "3:05"

#### Scenario: Short and long times
- **WHEN** the app saves the times 45 seconds and 75 minutes
- **THEN** it writes "0:45" and "75:00"

### Requirement: Unreadable cells are recognised
A weight cell that is not one number SHALL be unreadable. So SHALL a reps cell with an entry that does not follow the reps notation, an intensity cell that is not one whole number, and a time cell that does not follow the time notation. The app SHALL NOT rewrite an unreadable cell on its own.

#### Scenario: Notes and typos
- **WHEN** cells display "25 (Seil)" as a weight, or "?, 9, 7" or "10, 7,@60 7" as reps
- **THEN** the app treats each of them as unreadable
- **AND** it does not change them unless the user edits them

#### Scenario: Intensity that is not a whole number
- **WHEN** Ergometer's intensity cells display "8.5" and "8 (Stufe)"
- **THEN** the app treats both as unreadable

#### Scenario: Time that does not follow the notation
- **WHEN** Ergometer's time cells display "20 min", "3.30", "3:5", "3:75" and "1:03:30"
- **THEN** the app treats each of them as unreadable
- **AND** it does not change them unless the user edits them
