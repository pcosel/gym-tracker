# Spec Delta

## ADDED Requirements

### Requirement: A timed exercise averages intensity and time
For a timed exercise, the detail SHALL show the average intensity and the average time per session instead of the averages of reps and weight. The average intensity SHALL be taken over the sessions with an intensity, rounded to one decimal and shown without a unit. The average time SHALL be rounded to whole seconds and shown as minutes and seconds.

#### Scenario: Two sessions
- **WHEN** the sessions of Ergometer in the window hold "8" and "3:30", and "9" and "4:00"
- **THEN** the detail shows an intensity of 8.5 and a time of 3:45 per session
- **AND** it shows no reps and no kg

#### Scenario: Session without an intensity
- **WHEN** the sessions of Ergometer in the window hold an empty intensity and "3:30", and "8" and "4:30"
- **THEN** the detail shows an intensity of 8 and a time of 4:00 per session

#### Scenario: Rounding the time
- **WHEN** the sessions of Ergometer in the window hold the times "3:40", "3:40" and "3:41"
- **THEN** the detail shows a time of 3:40 per session

#### Scenario: No intensity at all
- **WHEN** no session of Ergometer in the window holds an intensity
- **THEN** the detail shows the time per session and no intensity

### Requirement: A timed exercise plots its time
For a timed exercise, the graph SHALL show the time of each session instead of the estimated 1RM. Sessions with an unreadable cell SHALL give no point. The graph's caption SHALL say that it shows the time per session, and its values and its accessible name SHALL give times as minutes and seconds, without a unit.

#### Scenario: Time per session
- **WHEN** Ergometer's sessions in the window hold "8" and "3:30" on 01.10.2026, and "8" and "4:00" on 13.10.2026
- **THEN** the graph has two points, at 3:30 and at 4:00
- **AND** it shows 3:30 as its lowest and 4:00 as its highest value

#### Scenario: Unreadable time
- **WHEN** a session of Ergometer holds "8" and "20 min"
- **THEN** that session gives no point

#### Scenario: Accessible name
- **WHEN** Ergometer's graph has 4 points, the first at 3:30 on 01.10.2026 and the last at 5:00 on 13.10.2026
- **THEN** a screen reader announces the time over 4 sessions, from 3:30 on 01.10.2026 to 5:00 on 13.10.2026

## MODIFIED Requirements

### Requirement: A session is a counted row with sets
A session of an exercise SHALL be a counted workout row whose reps cell for that exercise holds at least one set, readable or not, or for a timed exercise whose time cell holds a time, readable or not. A weight alone, or an intensity alone, SHALL NOT make a session. A workout SHALL be a counted workout row in which at least one exercise has a session.

#### Scenario: Weight only
- **WHEN** the row dated "12.10.2026" holds a weight of 40 for Bizepsmaschine and no reps in any reps cell
- **THEN** that row is no session of Bizepsmaschine and no workout

#### Scenario: Unreadable reps
- **WHEN** Latzug's reps cell in the row dated "12.10.2026" displays "?, 9, 7"
- **THEN** that row is a session of Latzug

#### Scenario: Ergometer
- **WHEN** the row dated "12.10.2026" holds "8" and "3:30" for Ergometer and nothing else
- **THEN** that row is a session of Ergometer and a workout

#### Scenario: Ergometer intensity only
- **WHEN** the row dated "12.10.2026" holds an intensity for Ergometer, no time, and no reps in any reps cell
- **THEN** that row is no session of Ergometer and no workout

### Requirement: The year so far counts workouts, sets and reps
The History page SHALL show, for the current year, the number of workouts, the number of readable sets in all sessions, and the sum of their reps. Sessions of a timed exercise SHALL count for the workouts, but SHALL add no sets and no reps. When the year has no workout yet, it SHALL say so instead.

#### Scenario: Counting
- **WHEN** the only workouts are on 12.09.2026, with "50" and "12@40, 10, 10@55" for Bankdrücken and "70" and "9, 7, 8" for Latzug, and on 01.10.2026, with "75" and "10, 10" for Latzug
- **THEN** the year so far shows 2 workouts, 8 sets and 76 reps

#### Scenario: Unreadable entry
- **WHEN** a reps cell of a session displays "?, 9, 7"
- **THEN** that cell adds 2 sets and 16 reps to the year so far

#### Scenario: Start of a year
- **WHEN** the tab "2027" holds only the header row and the carry-over row
- **THEN** the History page says that there are no workouts in 2027 yet

#### Scenario: Ergometer
- **WHEN** the only workouts are on 12.09.2026, with "75" and "10, 10" for Latzug, and on 01.10.2026, with "8" and "3:30" for Ergometer only
- **THEN** the year so far shows 2 workouts, 2 sets and 20 reps

### Requirement: The year so far names the biggest gain
The year so far SHALL name the exercise whose estimated 1RM grew most from its baseline to its latest later session this year, with both values and the gain in whole percent. The baseline SHALL be the carry-over row when it gives an estimated 1RM, otherwise the first session this year that gives one. Assisted exercises and timed exercises SHALL NOT count. Without any positive gain, it SHALL say that there is no gain yet.

#### Scenario: Carry-over row as baseline
- **WHEN** Latzug's carry-over row holds "60" and "15" and its latest session this year holds "75" and "12", and Bankdrücken has no values in the carry-over row, a first session with "50" and "12" and a latest session with "55" and "12"
- **THEN** the year so far names Latzug, from 90 kg to 105 kg, +17%

#### Scenario: First session as baseline
- **WHEN** Bankdrücken has no values in the carry-over row, a first session with "50" and "12" and a latest session with "55" and "12", and no other exercise has a gain
- **THEN** the year so far names Bankdrücken, from 70 kg to 77 kg, +10%

#### Scenario: A single session
- **WHEN** Beinpresse has no values in the carry-over row and only one session this year
- **THEN** Beinpresse has no gain

#### Scenario: No gain
- **WHEN** every exercise's latest session gives an estimated 1RM at or below its baseline
- **THEN** the year so far says that there is no gain yet

#### Scenario: Assisted exercise
- **WHEN** Klimmzüge (assistiert) went from 30 kg to 20 kg of assistance this year
- **THEN** it is never named as the biggest gain

#### Scenario: Timed exercise
- **WHEN** Ergometer went from "8" and "3:30" in its first session to "12" and "10:00" in its latest session this year
- **THEN** it is never named as the biggest gain

### Requirement: Averages leave out unreadable sessions
A session whose weight cell or reps cell is unreadable, or for a timed exercise whose intensity cell or time cell is unreadable, SHALL count for how often the exercise was done, but SHALL NOT count for the averages, and the detail SHALL say how many sessions were left out. When no session in the window is readable, the detail SHALL show no averages and say why.

#### Scenario: One unreadable session
- **WHEN** the sessions in the window hold "75" and "10, 10, 10", and "25 (Seil)" and "10, 10"
- **THEN** the detail says the exercise was done 2 times, and shows 30 reps and 75 kg per session
- **AND** it says that 1 session with unreadable cells is left out

#### Scenario: Nothing readable
- **WHEN** the only session in the window holds "?, 9, 7" as reps
- **THEN** the detail shows no averages and says that no session in the window is readable

#### Scenario: Unreadable Ergometer session
- **WHEN** Ergometer's sessions in the window hold "8" and "3:30", and "8" and "20 min"
- **THEN** the detail says Ergometer was done 2 times, and shows an intensity of 8 and a time of 3:30 per session
- **AND** it says that 1 session with unreadable cells is left out
