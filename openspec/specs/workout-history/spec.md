# workout-history Specification

## Purpose

The History page of the workout screen. From the current year's tab and today's values, it shows the year so far, how long ago each exercise was last done, and for one exercise how often it was done, its averages per session and its progress over a chosen window.

## Requirements

### Requirement: The workout screen switches between Today and History
When the year's tab exists, the workout screen SHALL show a switch with "Today" and "History" that marks the page shown. "Today" SHALL show the tiles and the exercise editor. "History" SHALL show the History page instead. Opening History, and opening an exercise's detail, SHALL each be a step in the browser history, so that going back returns to the previous view. After the page loads or reloads, the app SHALL show Today.

#### Scenario: Opening the history
- **WHEN** the user selects "History"
- **THEN** the tiles and the exercise editor are hidden, and the History page shows the year so far and the list of exercises
- **AND** the switch marks "History" as the page shown

#### Scenario: Going back
- **WHEN** the user opened History, then Latzug's detail, and goes back with the browser's back button
- **THEN** the History page shows the list of exercises
- **AND** going back once more shows Today

#### Scenario: Reloading on the History page
- **WHEN** the user reloads the page while the History page is shown
- **THEN** after loading, the app shows Today

### Requirement: Switching pages keeps Today as it was
Switching to History and back SHALL keep the open exercise, the values on screen, the tiles' states and any saves still to be done. A field that is focused when the user switches to History, or opens an exercise's history from its editor, SHALL be saved as when the user leaves it.

#### Scenario: Back to Today
- **WHEN** Latzug's editor is open with 10 in its first set field, and the user switches to History and back to Today
- **THEN** Latzug's editor is still open and shows 10 in its first set field

#### Scenario: Switching from a focused field
- **WHEN** the user types 9 into Latzug's second set field and selects "History" without leaving the field
- **THEN** Latzug's change is saved as when leaving the field
- **AND** the History page counts that set

### Requirement: The editor opens the exercise's history
Each exercise's editor on the Today page SHALL offer a "History" link to that exercise's detail, also when it shows text fields for unreadable cells. Opening the detail this way SHALL be a step in the browser history and SHALL write nothing. Going back from that detail SHALL show Today with the editor as it was. The link's accessible name SHALL name the exercise.

#### Scenario: Opening from the editor
- **WHEN** Latzug's editor is open and the user selects its "History" link
- **THEN** the History page shows Latzug's detail
- **AND** the switch marks "History" as the page shown

#### Scenario: Going back to the editor
- **WHEN** the user opened Latzug's detail from its editor with 10 in its first set field, and goes back with the detail's way back or the browser's back button
- **THEN** Today shows Latzug's editor, still open with 10 in its first set field

#### Scenario: Opening from a focused field
- **WHEN** the user types 9 into Latzug's second set field and selects its "History" link without leaving the field
- **THEN** Latzug's change is saved as when leaving the field
- **AND** Latzug's detail counts that set

#### Scenario: Editor with unreadable cells
- **WHEN** today's reps cell for Latzug displays "?, 9, 7" and its editor is open
- **THEN** the editor shows the "History" link above its text fields

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the "History" link in Latzug's editor
- **THEN** it announces "History of Latzug"

### Requirement: No history without the year's tab
If the spreadsheet has no tab for the current year, the workout screen SHALL show neither the switch nor the History page.

#### Scenario: New year without a tab
- **WHEN** the device date is 02.01.2027 and the spreadsheet has no tab "2027"
- **THEN** the workout screen says that the tab "2027" is missing and shows no "Today" / "History" switch

### Requirement: The history sends no requests
The History page SHALL use the year's tab as it was read when the workout screen loaded. Opening the History page, choosing a window or opening an exercise's detail SHALL NOT send any request to Google. Changes made in Google Sheets after the screen loaded SHALL appear only after a reload.

#### Scenario: Browsing the history
- **WHEN** the user opens the History page, opens Latzug's detail and chooses "90 days"
- **THEN** the app sends no request to Google

#### Scenario: Row added in Google Sheets
- **WHEN** a workout row is added by hand in Google Sheets after the workout screen loaded
- **THEN** the History page does not count it until the page is reloaded

### Requirement: Today's values count as the tiles count them
For today, the History page SHALL count each exercise's cells as its tile does: the cells it would save from the values on screen, as of the last time the user left a field of it or deleted a set, whether they are saved yet or not. While an exercise has input marked as invalid, its previous cells SHALL count.

#### Scenario: First set today
- **WHEN** Latzug has no values today, the user enters 10 in its first set field at a weight of 75, leaves the field and opens the History page
- **THEN** Latzug is listed as last done today
- **AND** its detail counts a session today with 10 reps at 75 kg

#### Scenario: Save failed
- **WHEN** a save of Latzug failed because Google could not be reached
- **THEN** the History page counts the values of Latzug that are on screen

#### Scenario: Invalid input
- **WHEN** Latzug holds the sets 10 and 9 today, and the user changes the second set to "abc" and leaves the field
- **THEN** the History page counts the sets 10 and 9

### Requirement: Only this year's workout rows count
The History page SHALL use only the year's tab that the workout screen uses. Only workout rows dated from 1 January of the current year up to today SHALL count. The carry-over row SHALL serve only as the baseline for the biggest gain.

#### Scenario: Previous year's tab
- **WHEN** today is 15.10.2026 and the spreadsheet has the tabs "2026" and "2025"
- **THEN** the History page uses only values from the tab "2026"

#### Scenario: Row dated in another year
- **WHEN** the tab "2026" holds a workout row dated "30.12.2025"
- **THEN** the History page does not count that row

#### Scenario: Row dated after today
- **WHEN** today is 15.10.2026 and a workout row is dated "16.10.2026"
- **THEN** the History page does not count that row

### Requirement: A session is a counted row with sets
A session of an exercise SHALL be a counted workout row whose reps cell for that exercise holds at least one set, readable or not. A weight alone SHALL NOT make a session. A workout SHALL be a counted workout row in which at least one exercise has a session.

#### Scenario: Weight only
- **WHEN** the row dated "12.10.2026" holds a weight of 40 for Bizepsmaschine and no reps in any reps cell
- **THEN** that row is no session of Bizepsmaschine and no workout

#### Scenario: Unreadable reps
- **WHEN** Latzug's reps cell in the row dated "12.10.2026" displays "?, 9, 7"
- **THEN** that row is a session of Latzug

### Requirement: The save status stays visible
While the History page is shown, the workout screen SHALL keep showing the save status, together with the offer to retry or to sign in to save, as on the Today page.

#### Scenario: Save fails during the history
- **WHEN** a save of Latzug fails after the user switched to the History page
- **THEN** the History page shows that the changes are not saved and offers to retry

### Requirement: The History page does not show the done counter
While the History page is shown, the workout screen SHALL NOT show the number of exercises done today. The Today page SHALL show it again.

#### Scenario: Counter on History
- **WHEN** Latzug is done today and the user switches to History
- **THEN** the screen does not show "1 exercise done today"
- **AND** after switching back to Today it shows it again

### Requirement: The year so far counts workouts, sets and reps
The History page SHALL show, for the current year, the number of workouts, the number of readable sets in all sessions, and the sum of their reps. When the year has no workout yet, it SHALL say so instead.

#### Scenario: Counting
- **WHEN** the only workouts are on 12.09.2026, with "50" and "12@40, 10, 10@55" for Bankdrücken and "70" and "9, 7, 8" for Latzug, and on 01.10.2026, with "75" and "10, 10" for Latzug
- **THEN** the year so far shows 2 workouts, 8 sets and 76 reps

#### Scenario: Unreadable entry
- **WHEN** a reps cell of a session displays "?, 9, 7"
- **THEN** that cell adds 2 sets and 16 reps to the year so far

#### Scenario: Start of a year
- **WHEN** the tab "2027" holds only the header row and the carry-over row
- **THEN** the History page says that there are no workouts in 2027 yet

### Requirement: The year so far names the most-done exercise
The year so far SHALL name the exercise with the most sessions this year, together with that number. When several exercises share the highest number, it SHALL name all of them, in alphabetical order as in the exercise list.

#### Scenario: One exercise
- **WHEN** Latzug has 12 sessions this year and every other exercise fewer
- **THEN** the year so far names Latzug with 12 sessions

#### Scenario: Several exercises
- **WHEN** Latzug comes before Bankdrücken in the header row, both have 12 sessions this year, and every other exercise has fewer
- **THEN** the year so far names "Bankdrücken, Latzug" with 12 sessions each

### Requirement: The year so far names the biggest gain
The year so far SHALL name the exercise whose estimated 1RM grew most from its baseline to its latest later session this year, with both values and the gain in whole percent. The baseline SHALL be the carry-over row when it gives an estimated 1RM, otherwise the first session this year that gives one. Assisted exercises SHALL NOT count. Without any positive gain, it SHALL say that there is no gain yet.

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

### Requirement: Exercises are listed by days since last done
The History page SHALL list every exercise of the header row with its full name, its icon if it has one, and when it was last done this year: "today", "yesterday", "N days ago" or "not done this year". By default, the most recently done exercises SHALL come first, then the others by time since last done, and the exercises not done this year last.

#### Scenario: Order
- **WHEN** today is 15.10.2026, Bizepsmaschine is done today, Latzug was last done on 13.10.2026, Bankdrücken on 12.09.2026, and Beinpresse has reps only in the carry-over row
- **THEN** the list reads Bizepsmaschine "today", Latzug "2 days ago", Bankdrücken "33 days ago" and Beinpresse "not done this year", in that order

#### Scenario: Yesterday
- **WHEN** today is 15.10.2026 and Latzug was last done on 14.10.2026
- **THEN** Latzug's entry says "yesterday"

### Requirement: Ties in the list are in alphabetical order
In both orders of the list, exercises last done on the same day, and exercises not done this year, SHALL be in alphabetical order by their full name, ignoring case and with each umlaut sorted as its base letter. Only exercises with the same name SHALL keep the order of the header row.

#### Scenario: Same day
- **WHEN** Latzug comes before Bankdrücken in the header row, and both were last done on 13.10.2026
- **THEN** Bankdrücken comes before Latzug in the list

#### Scenario: Umlauts
- **WHEN** Ruderzug comes before Rückenheben in the header row, and both were last done on 13.10.2026
- **THEN** Rückenheben comes before Ruderzug in the list, because "ü" sorts as "u"

#### Scenario: Not done this year
- **WHEN** Seitheber comes before Beinpresse in the header row, and neither was done this year
- **THEN** Beinpresse comes before Seitheber in the list, in both orders

#### Scenario: Ties when reversed
- **WHEN** Latzug comes before Bankdrücken in the header row, both were last done on 13.10.2026, and the order is reversed
- **THEN** Bankdrücken still comes before Latzug in the list

### Requirement: An arrow button reverses the list order
Above the list, one button SHALL reverse the order: exercises not done this year first, then the others from the longest time since last done to the shortest. The button SHALL show only an icon: an arrow pointing down while the most recently done come first, and up while the order is reversed. Its accessible name SHALL say the order shown. The order SHALL stay until the page reloads.

#### Scenario: Default order
- **WHEN** the History page is shown for the first time since the page loaded
- **THEN** the most recently done exercises come first
- **AND** the button shows an arrow pointing down and no text

#### Scenario: Reversed order
- **WHEN** today is 15.10.2026, Bizepsmaschine is done today, Latzug was last done on 13.10.2026, Bankdrücken on 12.09.2026, Beinpresse has reps only in the carry-over row, and the user selects the button
- **THEN** the list reads Beinpresse "not done this year", Bankdrücken "33 days ago", Latzug "2 days ago" and Bizepsmaschine "today", in that order
- **AND** the button shows an arrow pointing up
- **AND** selecting the button again restores the default order

#### Scenario: Order kept
- **WHEN** the user reversed the order, opens Latzug's detail and goes back to the list
- **THEN** the list is still in the reversed order

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the button while the most recently done exercises come first
- **THEN** it announces "Most recent first"
- **AND** after the user selects the button, it announces "Longest ago first"

### Requirement: Selecting an exercise opens its detail
Selecting an exercise in the list SHALL show its detail: its name, the window choice, how often and how long ago it was done, its averages and its graph. The detail SHALL offer a way back that returns to the previous view, as the browser's back button does. The way back SHALL be a chevron link with no visible text, whose accessible name is "Back".

#### Scenario: Opening and closing a detail
- **WHEN** the user selects Latzug in the list
- **THEN** the History page shows Latzug's detail instead of the list
- **AND** selecting the way back shows the list again

### Requirement: The window is a preset or a typed number of days
The detail SHALL offer the windows "30 days", "90 days" and "This year", and a field for a number of days. A window of N days SHALL be today and the N - 1 days before it. "This year" SHALL run from 1 January to today. The first detail opened SHALL use 30 days. A chosen window SHALL stay for other exercises until the page reloads.

#### Scenario: Default window
- **WHEN** the user opens a detail for the first time since the page loaded
- **THEN** the window is "30 days"

#### Scenario: Last 30 days
- **WHEN** today is 15.10.2026 and the window is "30 days"
- **THEN** the window covers 16.09.2026 to 15.10.2026

#### Scenario: This year
- **WHEN** today is 15.10.2026 and the window is "This year"
- **THEN** the window covers 01.01.2026 to 15.10.2026

#### Scenario: Typed number of days
- **WHEN** today is 15.10.2026 and the user types 45 into the field and leaves it
- **THEN** the window covers 01.09.2026 to 15.10.2026

#### Scenario: Invalid number
- **WHEN** the user types "0", "4.5" or "abc" into the field and leaves it
- **THEN** the field is marked as invalid and the window stays as it was

#### Scenario: Window kept for other exercises
- **WHEN** the user chose "90 days" in Latzug's detail and then opens Bankdrücken's detail
- **THEN** Bankdrücken's detail uses "90 days"

### Requirement: A window before 1 January is reported
When the window starts before 1 January of the current year, the detail SHALL say how many of the window's days are covered, namely those since 1 January, and that earlier workouts are in the previous year's tab, which the history does not read. Everything on the detail SHALL then use only the covered days.

#### Scenario: Early January
- **WHEN** today is 15.01.2027 and the window is "30 days"
- **THEN** the detail says that only 15 of the last 30 days, those since 01.01.2027, are covered, and that earlier workouts are in the tab "2026", which the history does not read
- **AND** how often, the averages and the graph use 01.01.2027 to 15.01.2027

#### Scenario: Window within the year
- **WHEN** today is 15.10.2026 and the window is "90 days"
- **THEN** the detail shows no such note

#### Scenario: This year
- **WHEN** the window is "This year"
- **THEN** the detail shows no such note

### Requirement: The detail shows how often and how long ago
The detail SHALL show the number of sessions in the window, and when the exercise was last done, worded as in the list. Without a session in the window, it SHALL say that the exercise was not done in that window.

#### Scenario: Sessions in the window
- **WHEN** today is 15.10.2026, the window is "30 days", and Latzug has sessions on 10.09., 20.09., 01.10., 08.10. and 13.10.2026
- **THEN** the detail says that Latzug was done 4 times in the last 30 days, and last done 2 days ago

#### Scenario: No session in the window
- **WHEN** today is 15.10.2026, the window is "30 days", and Bankdrücken was last done on 12.09.2026
- **THEN** the detail says that Bankdrücken was not done in the last 30 days, and last done 33 days ago

### Requirement: Averages are per session
The detail SHALL show, over the sessions in the window, the average of the sessions' total reps and the average of the sessions' weights. A session's weight SHALL be the average over all its reps, each at its set's weight: the `@` weight, otherwise the weight cell's, otherwise 0 kg. Both SHALL be rounded to one decimal. For an assisted exercise, the weight SHALL be called assistance.

#### Scenario: Sets with their own weight
- **WHEN** the only session in the window holds "50" and "12@40, 10, 10@55"
- **THEN** the detail shows 32 reps and 47.8 kg per session

#### Scenario: Two sessions
- **WHEN** the sessions in the window hold "75" and "10, 10, 10", and "80" and "8, 8, 8"
- **THEN** the detail shows 27 reps and 77.5 kg per session

#### Scenario: Assisted exercise
- **WHEN** the only session of Klimmzüge (assistiert) in the window holds "30" and "8, 8, 8"
- **THEN** the detail shows 24 reps and 30 kg of assistance per session

### Requirement: Averages leave out unreadable sessions
A session whose weight cell or reps cell is unreadable SHALL count for how often the exercise was done, but SHALL NOT count for the averages, and the detail SHALL say how many sessions were left out. When no session in the window is readable, the detail SHALL show no averages and say why.

#### Scenario: One unreadable session
- **WHEN** the sessions in the window hold "75" and "10, 10, 10", and "25 (Seil)" and "10, 10"
- **THEN** the detail says the exercise was done 2 times, and shows 30 reps and 75 kg per session
- **AND** it says that 1 session with unreadable cells is left out

#### Scenario: Nothing readable
- **WHEN** the only session in the window holds "?, 9, 7" as reps
- **THEN** the detail shows no averages and says that no session in the window is readable

### Requirement: The graph shows the estimated 1RM per session
The detail SHALL show a graph with one point per session in the window, at the session's date, with its estimated 1RM: the highest weight × (1 + reps / 30) among its sets, with each set's weight as for the averages. Sets at 0 kg or with 0 reps, and sessions with an unreadable cell, SHALL give no point. The time axis SHALL span the covered days of the window.

#### Scenario: Best set
- **WHEN** a session holds "75" and "10, 10, 8"
- **THEN** its point is at 100 kg

#### Scenario: Sets with their own weight
- **WHEN** a session holds "50" and "12@40, 10, 10@55"
- **THEN** its point is at 73.3 kg, from the set of 10 reps at 55 kg

#### Scenario: Without weight
- **WHEN** a session of Rückenheben holds an empty weight cell and "15, 15"
- **THEN** that session gives no point

#### Scenario: Unreadable weight
- **WHEN** a session holds "25 (Seil)" and "10, 10"
- **THEN** that session gives no point

### Requirement: Assisted exercises plot the assistance
For an assisted exercise, the graph SHALL show the lightest assistance used in each session instead of the estimated 1RM, with 0 kg for a set without any weight, and SHALL say that lower is better.

#### Scenario: Lightest assistance
- **WHEN** a session of Klimmzüge (assistiert) holds "25" and "6, 6@20, 5"
- **THEN** its point is at 20 kg
- **AND** the graph says that lower is better

#### Scenario: No assistance
- **WHEN** a session of Klimmzüge (assistiert) holds an empty weight cell and "3"
- **THEN** its point is at 0 kg

### Requirement: A graph needs two points
With fewer than two points in the window, the detail SHALL show no graph and SHALL say that there is not enough data for a graph in that window.

#### Scenario: One session
- **WHEN** Latzug has one session in the window
- **THEN** the detail shows no graph and says that there is not enough data for a graph

#### Scenario: Early January
- **WHEN** today is 03.01.2027, the window is "30 days", and Latzug has one session since 01.01.2027
- **THEN** the detail says that there is not enough data for a graph
- **AND** it says that only 3 of the last 30 days are covered

### Requirement: The graph is labelled and has a text alternative
The graph SHALL show its lowest and highest value and the first and last date of its time axis. Its accessible name SHALL say what it shows, the number of points, and the date and value of the first and the last point.

#### Scenario: Accessible name
- **WHEN** Latzug's graph has 4 points, the first at 100 kg on 01.10.2026 and the last at 105 kg on 13.10.2026
- **THEN** a screen reader announces the estimated 1RM over 4 sessions, from 100 kg on 01.10.2026 to 105 kg on 13.10.2026

### Requirement: Sheet text on the History page is shown as text
Exercise names and any other text from the sheet SHALL be displayed on the History page as plain text and never interpreted as HTML.

#### Scenario: Header that looks like markup
- **WHEN** a header cell holds `<b>Latzug</b>`
- **THEN** the exercise list and the detail show the characters `<b>Latzug</b>` literally
