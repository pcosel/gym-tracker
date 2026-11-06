# text-fields Specification

## Purpose

Defines how the app's text fields look while they have focus or are marked invalid, and when the invalid mark appears, on the Today and the History page alike.

## Requirements

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

### Requirement: An invalid field has a thin red border
A text field that is marked invalid SHALL show a pink background and a red border, with the same width as a valid field's grey border. Being marked invalid SHALL NOT change the field's size or position, nor the position of its text.

#### Scenario: Field marked invalid
- **WHEN** the user enters "abc" in a set field and leaves it
- **THEN** the field shows a pink background and a red border as thin as the grey border of a valid field
- **AND** the field and its text keep their position

### Requirement: A focused invalid field has a red ring
While a text field that is marked invalid has focus, its focus ring SHALL be red instead of blue. The field's pink background SHALL stay. Once the field is no longer marked invalid, its focus ring SHALL be blue again.

#### Scenario: Correcting an invalid field
- **WHEN** the user entered "abc" in a set field and left it, so the field is marked invalid, and then taps the field again
- **THEN** the field shows a red focus ring on its border and keeps its pink background

#### Scenario: Field corrected
- **WHEN** the user changes that field to "10", leaves it and taps it again
- **THEN** the field is no longer marked invalid and shows a blue focus ring
- **AND** its background is white again, and its border grey once it loses focus

### Requirement: The invalid mark follows the input while typing
A text field's invalid mark SHALL follow its content while the user types: it SHALL appear as soon as the content is invalid and disappear as soon as it is valid, without the user leaving the field. A weight that ends in its decimal separator, such as "7," or "7.", SHALL be marked only once the user leaves it.

#### Scenario: Typing an invalid value
- **WHEN** the user types "a" into an empty set field of Latzug
- **THEN** the field is marked invalid at once, before the user leaves it

#### Scenario: Typing a correction
- **WHEN** a set field holding "abc" is marked invalid and the user replaces its content with "10" without leaving the field
- **THEN** the field is no longer marked invalid

#### Scenario: Weight on its way to a decimal
- **WHEN** the user types "7", "," and "5" into Latzug's weight field
- **THEN** the field is not marked invalid at any point
- **AND** if the user leaves the field while it holds "7,", it is marked invalid

#### Scenario: Ergometer time with too many seconds
- **WHEN** the user types "3", "9", "0" and "5" into Ergometer's empty time field
- **THEN** the field is marked invalid as soon as it shows "3:90"
- **AND** the mark disappears as soon as it shows "39:05"

#### Scenario: Days field
- **WHEN** the user types "0" into the Days field on the History page
- **THEN** the field is marked invalid at once
- **AND** the window stays as it was

### Requirement: Typing does not save
Typing into a text field SHALL NOT save anything, whether it marks the field or not. Saving SHALL happen only when the user leaves the field, and the save status and the exercise's tile SHALL change only then.

#### Scenario: Marked while typing
- **WHEN** the user types "a" into an empty set field of Latzug
- **THEN** nothing is written, and the save status and Latzug's tile stay as they were

#### Scenario: Correction saved when left
- **WHEN** a set field holding "abc" is marked invalid, and the user replaces its content with "10"
- **THEN** nothing is written while the field has focus
- **AND** Latzug is saved when the user leaves the field
