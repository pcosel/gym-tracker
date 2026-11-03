# Spec Delta

## ADDED Requirements

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
