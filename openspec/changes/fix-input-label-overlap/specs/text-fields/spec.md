# Spec Delta

## Purpose

Defines how the app's text fields look while they have focus or are marked invalid, on the Today and the History page alike.

## ADDED Requirements

### Requirement: The focus ring lies on the field's border
A text field with focus SHALL show its focus ring on its own border, inside the field's box, with the ring's outer edge on the border's outer edge. The ring SHALL NOT reach beyond the border, so it covers nothing around the field. Gaining or losing focus SHALL NOT change the field's size or position. This SHALL hold for every text field of the app.

#### Scenario: Field with its label right above
- **WHEN** the user taps the weight field of Latzug in the exercise editor
- **THEN** the field shows its focus ring on its border
- **AND** no part of the ring covers the label "Weight (kg)"

#### Scenario: Field in the set table
- **WHEN** the user taps the reps field of Latzug's first set
- **THEN** the field shows its focus ring on its border
- **AND** the field has the same size and position as without focus

#### Scenario: Days field on the History page
- **WHEN** the user taps the Days field in an exercise's detail
- **THEN** the field shows its focus ring on its border
- **AND** no part of the ring covers the label "Days"

#### Scenario: Leaving the field
- **WHEN** the user leaves a focused field
- **THEN** the ring disappears and the field shows its normal border again

### Requirement: A focused invalid field keeps the invalid colour
While a text field that is marked invalid has focus, its focus ring SHALL be red, the colour of the invalid mark, instead of blue. The field's invalid background SHALL stay. Once the field is no longer marked invalid, its focus ring SHALL be blue again.

#### Scenario: Correcting an invalid field
- **WHEN** the user entered "abc" in a set field and left it, so the field is marked invalid, and then taps the field again
- **THEN** the field shows a red focus ring on its border and keeps its invalid background

#### Scenario: Field corrected
- **WHEN** the user changes that field to "10", leaves it and taps it again
- **THEN** the field is no longer marked invalid and shows a blue focus ring
