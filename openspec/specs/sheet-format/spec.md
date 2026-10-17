# sheet-format Specification

## Purpose

Defines the layout and notation of the gym spreadsheet, which the user also edits by hand, and how the app reads and writes it so that the sheet keeps exactly the format it already has.

## Requirements

### Requirement: One tab per year
The app SHALL work only with the tab whose title is the current year in four digits, taken from the device's local date. It SHALL NOT read or write any other tab, and it SHALL NOT create tabs.

#### Scenario: Current year's tab
- **WHEN** the device date is 15.10.2026 and the spreadsheet has the tabs "2026", "2025" and "2024"
- **THEN** every request the app makes for cell values addresses the tab "2026" only

#### Scenario: Tab for a new year is missing
- **WHEN** the device date is 02.01.2027 and the spreadsheet has no tab "2027"
- **THEN** the app reads no cell values and creates no tab

### Requirement: Exercises come from the header row
Row 1 SHALL define the exercises. From column B on, each exercise SHALL occupy two adjacent columns, weight first and reps second. Its name SHALL be the trimmed text in row 1 above the weight column. A pair with an empty header cell there SHALL NOT be an exercise. The app SHALL NOT depend on a fixed order, number or set of exercises.

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

### Requirement: Rows have fixed roles
Row 1 SHALL be the header row. Row 2 SHALL be the carry-over row when its column A holds a four-digit year. The app SHALL read the carry-over row but never write to it. Any other row whose column A holds a date as day.month.year SHALL be the record of one workout day. Rows whose column A holds anything else SHALL be ignored.

#### Scenario: Carry-over row
- **WHEN** cell A2 holds 2025
- **THEN** row 2 is the carry-over row, and the app never writes to any cell in it

#### Scenario: Workout row
- **WHEN** cell A13 holds the text "12.10.2026"
- **THEN** row 13 is the record of the workout on 12 October 2026

#### Scenario: Date without leading zeros
- **WHEN** a cell in column A holds "5.9.2026"
- **THEN** its row is the record of the workout on 5 September 2026

### Requirement: Weight cell notation
The weight cell SHALL hold the exercise's weight in kilograms as one number. On reading, the app SHALL accept a dot or a comma as the decimal separator and SHALL ignore surrounding spaces.

#### Scenario: Whole and decimal weights
- **WHEN** weight cells display "45", " 45", "17.5" and "17,5"
- **THEN** the app reads the weights 45, 45, 17.5 and 17.5

### Requirement: Reps cell notation
The reps cell SHALL hold the exercise's sets in order, separated by commas. Each set SHALL be a whole number of reps, optionally followed by `@` and the weight that set used. A set without `@` used the weight in the weight cell. On reading, spaces around entries and empty entries SHALL be ignored.

#### Scenario: Sets with their own weight
- **WHEN** the weight cell displays "50" and the reps cell displays "12@40, 10, 10@55"
- **THEN** the app reads 12 reps at 40 kg, 10 reps at 50 kg and 10 reps at 55 kg

#### Scenario: Any number of sets
- **WHEN** reps cells display "14", "10, 9, " and "10, 10, 10, 8"
- **THEN** the app reads one, two and four sets

#### Scenario: Irregular spacing
- **WHEN** reps cells display "9,  8, 7" and "10, 10, 10 "
- **THEN** the app reads three sets from each

#### Scenario: Decimal set weight
- **WHEN** a reps cell displays "15@22.5, 15, 13"
- **THEN** the app reads the first set as 15 reps at 22.5 kg

### Requirement: Cells are read as displayed
The app SHALL read each cell's text as Google Sheets displays it, not the value stored underneath.

#### Scenario: Reps that Google Sheets stored as a date
- **WHEN** a reps cell in a column formatted as "Automatic" holds a date that Google Sheets created from the typed text, and it displays "12, 10, 10"
- **THEN** the app reads three sets of 12, 10 and 10 reps

#### Scenario: Two-digit year display
- **WHEN** such a cell displays "10, 8, 07"
- **THEN** the app reads three sets of 10, 8 and 7 reps

### Requirement: Cells are written as plain text
The app SHALL store every cell it writes as the exact text it sends, so that Google Sheets never converts it into a date or a number.

#### Scenario: Reps in an "Automatic" column
- **WHEN** the app writes "12, 10, 10" into a reps cell of a column formatted as "Automatic"
- **THEN** the cell holds the text "12, 10, 10" and not a date

#### Scenario: Date cell
- **WHEN** the app writes the date 15 October 2026 into column A
- **THEN** the cell holds the text "15.10.2026"

### Requirement: Written cells use the standard notation
When the app formats cells itself, it SHALL write:
- the date as `dd.mm.yyyy` with leading zeros;
- the weight as a number with a dot as decimal separator and no trailing zeros;
- the sets joined by a comma and a space, with `@` and a weight only on sets whose weight differs from the weight cell.

#### Scenario: Sets with their own weight
- **WHEN** the app saves a weight of 50 and the sets 12 reps at 40 kg, 10 reps at 50 kg and 10 reps at 55 kg
- **THEN** the weight cell holds "50" and the reps cell holds "12@40, 10, 10@55"

#### Scenario: Number formatting
- **WHEN** the app saves the weights 17.5 and 20.0 and the date 5 September 2026
- **THEN** it writes "17.5", "20" and "05.09.2026"

### Requirement: Unreadable cells are recognised
A weight cell that is not one number SHALL be unreadable. So SHALL a reps cell with an entry that does not follow the reps notation. The app SHALL NOT rewrite an unreadable cell on its own.

#### Scenario: Notes and typos
- **WHEN** cells display "25 (Seil)" as a weight, or "?, 9, 7" or "10, 7,@60 7" as reps
- **THEN** the app treats each of them as unreadable
- **AND** it does not change them unless the user edits them

### Requirement: Writes touch only the cells being changed
The app SHALL write only the cells whose content it is changing. It SHALL NOT rewrite whole rows or ranges, cells of other exercises or other rows, formatting, merged cells or other tabs.

#### Scenario: Saving one exercise
- **WHEN** the app saves Latzug in row 14
- **THEN** the only cells it writes are Z14 and AA14, plus A14 when it creates that row
- **AND** every other cell, the formatting and every other tab stay unchanged
