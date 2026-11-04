import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildToday, initialState, cellsFor, writesFor, removeSet, tileLabels, progressOf, splitAssisted,
  formatTimeInput, timedProgressOf, invalidFields,
} from '../workout.js';
import { iconFor } from '../icons.js';

// All data below is made up. Columns: B/C Bankdrücken, D/E Latzug,
// F/G Beinpresse, H/I Bizepsmaschine, J/K Duale Schulterpresse, L/M Ergometer.
const HEADER = [
  'Datum', 'Bankdrücken', '', 'Latzug', '', 'Beinpresse', '', 'Bizepsmaschine', '', 'Duale Schulterpresse', '', 'Ergometer', '',
];

function tab(...extraRows) {
  return [
    HEADER,
    ['2025', '', '', '70', '8, 8, 8', '69', '15, 15, 15', '', ''],
    ['01.09.2026', '', '', '', '', '', '', '40', '9, 6, 6'],
    ['08.09.2026', '', '', '', '', '', '', '', ''],
    ['12.09.2026', '52,5', '12@40, 10, 10@55', '70', '9, 7, 8', '', '', '40', ''],
    ...extraRows,
  ];
}

const TODAY = { y: 2026, m: 10, d: 15 };
const byName = (model, name) => model.exercises.find((e) => e.name === name);

test('Workout already started: today shows its values', () => {
  const rows = tab(['15.10.2026', '', '', '75', '10']);
  const model = buildToday(rows, TODAY);
  assert.equal(model.todayRow, 6);
  assert.equal(byName(model, 'Latzug').today.weightText, '75');
  assert.equal(byName(model, 'Latzug').today.reps.sets[0].reps, 10);
  assert.equal(byName(model, 'Bankdrücken').today, null);
});

test('No workout yet today', () => {
  const model = buildToday(tab(), TODAY);
  assert.equal(model.todayRow, null);
  assert.ok(model.exercises.every((e) => e.today === null));
});

test('Today\'s date in two rows: the topmost is used', () => {
  const rows = tab(['15.10.2026', '', '', '75', '10'], ['15.10.2026', '', '', '99', '1']);
  assert.equal(buildToday(rows, TODAY).todayRow, 6);
});

test('Weight without reps is skipped', () => {
  const rows = tab(['', '', '', '', '', '', '', '41', '']);
  // Rows 3 (reps "9, 6, 6") and 5 (weight 40, no reps), plus a row without date.
  const model = buildToday(rows, TODAY);
  assert.equal(byName(model, 'Bizepsmaschine').last.row, 3);
});

test('Weight without reps today: listed with its weight and no saved sets', () => {
  const rows = tab(['15.10.2026', '', '', '', '', '', '', '40', '']);
  const exercise = byName(buildToday(rows, TODAY), 'Bizepsmaschine');
  assert.equal(exercise.today.weight.value, 40);
  assert.deepEqual(exercise.today.reps.sets, []);
});

test('Carry-over row as fallback', () => {
  const last = byName(buildToday(tab(), TODAY), 'Beinpresse').last;
  assert.equal(last.row, 2);
  assert.equal(last.carryOver, true);
  assert.equal(last.weight.value, 69);
});

test('Last time in an earlier workout', () => {
  assert.deepEqual(byName(buildToday(tab(), TODAY), 'Latzug').last.date, { y: 2026, m: 9, d: 12 });
});

test('Last time before the last workout', () => {
  const model = buildToday(tab(['13.10.2026', '', '', '75', '10']), TODAY);
  assert.equal(model.lastWorkoutRow, 6);
  assert.deepEqual(byName(model, 'Bankdrücken').last.date, { y: 2026, m: 9, d: 12 });
});

test('Date without leading zeros', () => {
  const model = buildToday(tab(['5.10.2026', '', '', '75', '10']), TODAY);
  assert.deepEqual(byName(model, 'Latzug').last.date, { y: 2026, m: 10, d: 5 });
});

test('Exercise done today: its last time keeps its date', () => {
  const model = buildToday(tab(['15.10.2026', '', '', '75', '10']), TODAY);
  assert.deepEqual(byName(model, 'Latzug').last.date, { y: 2026, m: 9, d: 12 });
});

test('Carry-over row: last time has a year and no date', () => {
  const last = byName(buildToday(tab(), TODAY), 'Beinpresse').last;
  assert.equal(last.year, 2025);
  assert.equal('date' in last, false);
});

test('A row with only a weight does not give the last time its date', () => {
  const last = byName(buildToday(tab(), TODAY), 'Bizepsmaschine').last;
  assert.deepEqual(last.date, { y: 2026, m: 9, d: 1 });
});

test('Never done', () => {
  const exercise = byName(buildToday(tab(), TODAY), 'Duale Schulterpresse');
  assert.equal(exercise.last, null);
  const state = initialState(exercise);
  assert.equal(state.weight, '');
  assert.deepEqual(state.sets, [
    { reps: '', ownWeight: '', placeholder: '' },
    { reps: '', ownWeight: '', placeholder: '' },
    { reps: '', ownWeight: '', placeholder: '' },
  ]);
});

test('nextRow is one below the longest-reaching row, even without a date', () => {
  const rows = tab(['', '', '', '', '', '', '', 'x']);
  assert.equal(buildToday(rows, TODAY).nextRow, 7);
});

test('rows without a date are never "last time"', () => {
  const rows = tab(['', '', '', '60', '5, 5, 5']);
  assert.equal(byName(buildToday(rows, TODAY), 'Latzug').last.row, 5);
});

const doneLast = (model) => model.exercises.filter((e) => e.doneLastWorkout).map((e) => e.name);

test('Previous workout: the lowest row with reps is the last workout', () => {
  const model = buildToday(tab(), TODAY);
  assert.equal(model.lastWorkoutRow, 5);
  assert.deepEqual(doneLast(model), ['Bankdrücken', 'Latzug']);
});

test('Workout already started: the last workout lies above today\'s row', () => {
  const model = buildToday(tab(['15.10.2026', '', '', '75', '10']), TODAY);
  assert.equal(model.todayRow, 6);
  assert.equal(model.lastWorkoutRow, 5);
});

test('Row without reps is skipped as the last workout', () => {
  const rows = tab(['13.10.2026', '', '', '', '', '', '', '40', ''], ['14.10.2026']);
  const model = buildToday(rows, TODAY);
  assert.equal(model.lastWorkoutRow, 5);
  assert.equal(byName(model, 'Bizepsmaschine').doneLastWorkout, false);
});

test('a row without a date is never the last workout', () => {
  const model = buildToday(tab(['', '', '', '60', '5, 5, 5']), TODAY);
  assert.equal(model.lastWorkoutRow, 5);
});

test('Exercise skipped in the last workout keeps its last time', () => {
  const model = buildToday(tab(['13.10.2026', '', '', '75', '10']), TODAY);
  assert.equal(model.lastWorkoutRow, 6);
  assert.equal(byName(model, 'Latzug').doneLastWorkout, true);
  const bench = byName(model, 'Bankdrücken');
  assert.equal(bench.doneLastWorkout, false);
  assert.equal(bench.last.row, 5);
});

test('Unreadable reps in the last workout still count as done', () => {
  const mixed = byName(buildToday(tab(['13.10.2026', '', '', '', '?, 9, 7']), TODAY), 'Latzug');
  assert.equal(mixed.doneLastWorkout, true);
  const only = buildToday(tab(['13.10.2026', '', '', '', '?']), TODAY);
  assert.equal(byName(only, 'Latzug').doneLastWorkout, true);
  assert.equal(byName(only, 'Latzug').last.row, 5);
});

test('Start of a year: the carry-over row is not a last workout', () => {
  const carryOver = ['2026', '', '', '70', '8, 8, 8'];
  for (const rows of [[HEADER, carryOver], [HEADER, carryOver, ['15.10.2026', '', '', '75', '10']]]) {
    const model = buildToday(rows, TODAY);
    assert.equal(model.lastWorkoutRow, null);
    assert.deepEqual(doneLast(model), []);
  }
});

test('Without a carry-over row, row 2 can be the last workout', () => {
  const model = buildToday([HEADER, ['12.10.2026', '', '', '70', '8']], TODAY);
  assert.equal(model.lastWorkoutRow, 2);
});

test('Three fields by default', () => {
  const rows = tab();
  rows[4][4] = '9, 7';
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  assert.equal(state.sets.length, 3);
});

test('More sets last time', () => {
  const rows = tab();
  rows[4][4] = '10, 10, 10, 8';
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  assert.equal(state.sets.length, 4);
});

test('Prefill from the last workout: weight copied, reps only as placeholders', () => {
  const rows = tab();
  rows[4][1] = '55';
  rows[4][2] = '14';
  const state = initialState(byName(buildToday(rows, TODAY), 'Bankdrücken'));
  assert.equal(state.mode, 'sets');
  assert.equal(state.weight, '55');
  assert.deepEqual(state.sets, [
    { reps: '', ownWeight: '', placeholder: '14' },
    { reps: '', ownWeight: '', placeholder: '' },
    { reps: '', ownWeight: '', placeholder: '' },
  ]);
});

test('Sets with their own weight are prefilled', () => {
  const rows = tab();
  rows[4][1] = '50';
  rows[4][2] = '12@40, 10, 10@55';
  const state = initialState(byName(buildToday(rows, TODAY), 'Bankdrücken'));
  assert.equal(state.weight, '50');
  assert.deepEqual(state.sets, [
    { reps: '', ownWeight: '40', placeholder: '12' },
    { reps: '', ownWeight: '', placeholder: '10' },
    { reps: '', ownWeight: '55', placeholder: '10' },
  ]);
});

test('Today\'s values come first', () => {
  const rows = tab(['15.10.2026', '', '', '75', '10']);
  rows[4][3] = '75';
  rows[4][4] = '9, 7, 8';
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  assert.equal(state.weight, '75');
  assert.equal(state.sets[0].reps, '10');
  assert.deepEqual(
    state.sets.slice(1).map((s) => [s.reps, s.placeholder]),
    [['', '7'], ['', '8']],
  );
});

test('Unreadable entry last time: no placeholder at that position', () => {
  const rows = tab();
  rows[4][4] = '?, 9, 7';
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  assert.deepEqual(
    state.sets.map((s) => s.placeholder),
    ['', '9', '7'],
  );
});

test('an unreadable reps cell today gives text mode with the cells as displayed', () => {
  const rows = tab(['15.10.2026', '', '', '75', '?, 9, 7']);
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  assert.deepEqual(state, { mode: 'text', weightText: '75', repsText: '?, 9, 7' });
});

function sets(...fields) {
  return fields.map(([reps, ownWeight = '']) => ({ reps, ownWeight, placeholder: '' }));
}

test('Logging the first set', () => {
  const result = cellsFor({ mode: 'sets', weight: '75', sets: sets(['10'], [''], ['']) });
  assert.deepEqual(result, { ok: true, weightText: '75', repsText: '10' });
});

test('Set with its own weight', () => {
  const result = cellsFor({ mode: 'sets', weight: '75', sets: sets(['10'], ['9'], ['8', '70']) });
  assert.equal(result.repsText, '10, 9, 8@70');
});

test('Empty set fields are left out', () => {
  const result = cellsFor({ mode: 'sets', weight: '75', sets: sets(['10'], [''], ['8']) });
  assert.equal(result.repsText, '10, 8');
});

test('Changing only the weight writes nothing: both cells stay empty', () => {
  const result = cellsFor({ mode: 'sets', weight: '80', sets: sets([''], [''], ['']) });
  assert.deepEqual(result, { ok: true, weightText: '', repsText: '' });
});

test('Deleting the reps again empties both cells', () => {
  const result = cellsFor({ mode: 'sets', weight: '75', sets: sets([''], ['']) });
  assert.deepEqual(result, { ok: true, weightText: '', repsText: '' });
});

test('Clearing an exercise empties both cells', () => {
  const result = cellsFor({ mode: 'sets', weight: '', sets: sets([''], [''], ['']) });
  assert.deepEqual(result, { ok: true, weightText: '', repsText: '' });
});

test('prefilled own weights on empty set fields are not saved', () => {
  const result = cellsFor({ mode: 'sets', weight: '50', sets: sets(['', '40'], ['10'], ['', '55']) });
  assert.equal(result.repsText, '10');
});

test('Raising the weight: a set with its own weight keeps it', () => {
  const result = cellsFor({ mode: 'sets', weight: '80', sets: sets(['10'], ['10'], ['8', '70']) });
  assert.deepEqual(result, { ok: true, weightText: '80', repsText: '10, 10, 8@70' });
});

test('Own weight equal to the exercise weight is saved without @', () => {
  const result = cellsFor({ mode: 'sets', weight: '80', sets: sets(['10'], ['8', '80']) });
  assert.equal(result.repsText, '10, 8');
});

test('Decimal comma', () => {
  const result = cellsFor({ mode: 'sets', weight: '17,5', sets: sets(['10', '12,5']) });
  assert.deepEqual(result, { ok: true, weightText: '17.5', repsText: '10@12.5' });
});

test('Not a number: the field is flagged and nothing is returned for writing', () => {
  const result = cellsFor({ mode: 'sets', weight: '75', sets: sets(['abc'], ['10']) });
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid.sets[0], { reps: true, ownWeight: false });
  assert.deepEqual(result.invalid.sets[1], { reps: false, ownWeight: false });
  assert.equal(result.invalid.weight, false);
});

test('an invalid weight or a decimal reps value is flagged', () => {
  assert.equal(cellsFor({ mode: 'sets', weight: '-5', sets: sets(['10']) }).invalid.weight, true);
  assert.equal(cellsFor({ mode: 'sets', weight: '75', sets: sets(['10,5']) }).ok, false);
});

test('text mode returns the entered text unchanged', () => {
  const result = cellsFor({ mode: 'text', weightText: '25 (Seil)', repsText: '8, 9, 7 ' });
  assert.deepEqual(result, { ok: true, weightText: '25 (Seil)', repsText: '8, 9, 7 ' });
});

const setsState = (weight, ...fields) => ({ mode: 'sets', weight, sets: sets(...fields) });

test('invalidFields: nothing to mark gives null', () => {
  assert.equal(invalidFields(setsState('75', ['10'], [''])), null);
  assert.equal(invalidFields(setsState('75', ['10'], ['']), { typing: true }), null);
});

test('invalidFields: the same flags as cellsFor', () => {
  const state = setsState('75', ['abc'], ['10']);
  assert.deepEqual(invalidFields(state), cellsFor(state).invalid);
  assert.deepEqual(invalidFields(state, { typing: true }), cellsFor(state).invalid);
});

test('Weight on its way to a decimal: a trailing separator is spared while typing', () => {
  for (const weight of ['7,', '7.']) {
    assert.equal(invalidFields(setsState(weight, ['10']), { typing: true }), null);
    assert.equal(invalidFields(setsState(weight, ['10'])).weight, true);
  }
});

test('A set weight on its way to a decimal is spared while typing too', () => {
  for (const own of ['12,', '12.']) {
    assert.equal(invalidFields(setsState('75', ['10', own]), { typing: true }), null);
    assert.equal(invalidFields(setsState('75', ['10', own])).sets[0].ownWeight, true);
  }
});

test('Other invalid weights are flagged while typing', () => {
  for (const weight of ['abc', '7,5,', ',5', '7,,']) {
    assert.equal(invalidFields(setsState(weight, ['10']), { typing: true }).weight, true, weight);
  }
});

test('Reps are never spared while typing', () => {
  assert.equal(invalidFields(setsState('75', ['10,']), { typing: true }).sets[0].reps, true);
});

test('Ergometer too many seconds is flagged while typing', () => {
  const state = { mode: 'timed', intensity: '8', time: '3:90', placeholder: '' };
  assert.deepEqual(invalidFields(state, { typing: true }), { intensity: false, time: true });
  assert.equal(invalidFields({ ...state, time: '39:05' }, { typing: true }), null);
});

test('invalidFields: text mode never marks', () => {
  assert.equal(invalidFields({ mode: 'text', weightText: 'abc', repsText: '?' }, { typing: true }), null);
});

const latzug = () => byName(buildToday(tab(), TODAY), 'Latzug');

test('Weight changed before the first set: no writes, so no row is created', () => {
  const cells = cellsFor({ mode: 'sets', weight: '80', sets: sets([''], [''], ['']) });
  assert.deepEqual(writesFor(latzug(), cells, { row: 6, creating: true, today: TODAY }), []);
});

test('First save of the day: the date in column A, then the exercise\'s two cells', () => {
  const cells = cellsFor({ mode: 'sets', weight: '75', sets: sets(['10'], [''], ['']) });
  assert.deepEqual(writesFor(latzug(), cells, { row: 6, creating: true, today: TODAY }), [
    { row: 6, col: 0, values: ['15.10.2026'] },
    { row: 6, col: 3, values: ['75', '10'] },
  ]);
});

test('Clearing an exercise in an existing row writes both cells empty', () => {
  const cells = cellsFor({ mode: 'sets', weight: '', sets: sets([''], [''], ['']) });
  assert.deepEqual(writesFor(latzug(), cells, { row: 6, creating: false, today: TODAY }), [
    { row: 6, col: 3, values: ['', ''] },
  ]);
});

test('Deleting a set: the empty fourth field goes, and nothing has to be written', () => {
  const rows = tab();
  rows[4][4] = '10, 10, 10, 8';
  const state = initialState(byName(buildToday(rows, TODAY), 'Latzug'));
  ['10', '9', '8'].forEach((reps, i) => { state.sets[i].reps = reps; });
  const result = removeSet(state, 3);
  assert.equal(result.changed, false);
  assert.equal(result.state.sets.length, 3);
  assert.deepEqual(cellsFor(result.state), cellsFor(state));
  assert.equal(state.sets.length, 4);
});

test('Deleting a set that holds reps: "10, 9, 8" becomes "10, 8"', () => {
  const result = removeSet({ mode: 'sets', weight: '75', sets: sets(['10'], ['9'], ['8']) }, 1);
  assert.equal(result.changed, true);
  assert.equal(cellsFor(result.state).repsText, '10, 8');
});

test('Tile labels: plain label and several words', () => {
  assert.deepEqual(tileLabels(['Latzug']), ['La']);
  assert.deepEqual(tileLabels(['Duale Schulterpresse']), ['Du']);
});

test('Tile labels: names with the same first letters stay unique', () => {
  assert.deepEqual(tileLabels(['Bankdrücken', 'Bauchmaschine']), ['Ba', 'Bu']);
});

test('Tile labels: repeated letters are skipped', () => {
  assert.deepEqual(tileLabels(['Bankdrücken', 'Bauchmaschine', 'Bauchpresse']), ['Ba', 'Bu', 'Bc']);
});

test('Tile labels: case is normalised and ignored when comparing', () => {
  assert.deepEqual(tileLabels(['übung']), ['Üb']);
  assert.deepEqual(tileLabels(['Bank', 'BAnk']), ['Ba', 'Bn']);
});

test('Tile labels: non-letters are skipped', () => {
  assert.deepEqual(tileLabels(['1-Arm Rudern']), ['Ar']);
});

test('Tile labels: names with fewer than two letters', () => {
  assert.deepEqual(tileLabels(['x']), ['X']);
  assert.deepEqual(tileLabels(['123']), ['12']);
});

test('Tile labels: when every pair is taken the first pair stays', () => {
  assert.deepEqual(tileLabels(['Ab', 'Ab']), ['Ab', 'Ab']);
  assert.deepEqual(tileLabels(['Abb', 'Abb', 'Abb']), ['Ab', 'Ab', 'Ab']);
});

const withIcons = (names) => tileLabels(names, (name) => iconFor(name) !== null);

test('Tile labels: plain label, several words and shared first letters', () => {
  assert.deepEqual(withIcons(['Kniebeuge']), ['Kn']);
  assert.deepEqual(withIcons(['Schräges Bankdrücken']), ['Sc']);
  assert.deepEqual(withIcons(['Wadenheben', 'Wadenpresse']), ['Wa', 'Wd']);
  assert.deepEqual(withIcons(['Wadenheben', 'Wadenpresse', 'Wadenstrecker']), ['Wa', 'Wd', 'We']);
});

test('Tile labels: icon tiles do not take labels', () => {
  assert.deepEqual(withIcons(['Bankdrücken', 'Bauchmaschine', 'Bauchpresse']), [null, null, 'Ba']);
});

test('Tile labels: a different spelling shows letters, an assisted name an icon', () => {
  assert.deepEqual(withIcons(['Klimmzug']), ['Kl']);
  assert.deepEqual(withIcons(['Klimmzüge (assistiert)']), [null]);
});

// The exercise at Latzug's columns as buildToday reads it, with last time's
// cells in the row before today's. `name` renames the column.
function exerciseOf(weightText, repsText, name = 'Latzug') {
  const header = HEADER.map((text) => (text === 'Latzug' ? name : text));
  const rows = [header, ['01.09.2026', '', '', weightText, repsText]];
  return byName(buildToday(rows, TODAY), name);
}
const lastOf = (weightText, repsText) => exerciseOf(weightText, repsText).last;
const progress = (weightText, repsText, last, assisted) =>
  progressOf({ weightText, repsText }, last, assisted);
const assistedProgress = (lastWeight, lastReps, weight, reps) =>
  progress(weight, reps, exerciseOf(lastWeight, lastReps, 'Klimmzüge (assistiert)').last, true);

test('Assisted: the name marker is found in any case, and only that', () => {
  assert.equal(exerciseOf('', '', 'Klimmzüge (assistiert)').assisted, true);
  assert.equal(exerciseOf('', '', 'Dips (Assistiert)').assisted, true);
  assert.equal(exerciseOf('', '', 'Assisted Pullups').assisted, false);
  assert.equal(exerciseOf('', '', 'Latzug').assisted, false);
});

test('splitAssisted: the marker is removed and reported', () => {
  assert.deepEqual(splitAssisted('Klimmzüge (assistiert)'), { base: 'Klimmzüge', assisted: true });
});

test('splitAssisted: other case and spacing give the same result', () => {
  const expected = { base: 'Klimmzüge', assisted: true };
  assert.deepEqual(splitAssisted('Klimmzüge(Assistiert)'), expected);
  assert.deepEqual(splitAssisted('Klimmzüge  (assistiert) '), expected);
});

test('splitAssisted: a name without the marker is unchanged', () => {
  assert.deepEqual(splitAssisted('Latzug'), { base: 'Latzug', assisted: false });
});

test('Progress: done means at least one set with reps', () => {
  const last = lastOf('75', '10');
  assert.equal(progress('80', '', last), 'none');
  assert.equal(progress('', '', last), 'none');
  assert.equal(progress('', '', null), 'none');
  assert.equal(progress('50', '?, 9, 7', lastOf('50', '9, 9, 9')), 'done');
});

test('Progress: the same sets in another order are only done', () => {
  assert.equal(progress('75', '11, 9, 9', lastOf('75', '9, 11, 9')), 'done');
});

test('Progress: one set better and two worse is only done', () => {
  assert.equal(progress('75', '11, 8, 8', lastOf('75', '9, 9, 9')), 'done');
});

test('Progress: one more rep', () => {
  assert.equal(progress('75', '10, 9, 9', lastOf('75', '9, 9, 9')), 'improved');
});

test('Progress: gains outweigh a loss', () => {
  assert.equal(progress('75', '12, 12, 8', lastOf('75', '9, 9, 9')), 'improved');
});

test('Progress: losses outweigh gains', () => {
  assert.equal(progress('75', '11, 11, 2', lastOf('75', '10, 10, 10')), 'done');
});

test('Progress: equal to last time is only done', () => {
  assert.equal(progress('75', '10, 9', lastOf('75', '10, 9')), 'done');
});

test('Progress: an extra set is improved', () => {
  assert.equal(progress('75', '10, 6', lastOf('75', '10')), 'improved');
});

test('Progress: workout in progress', () => {
  const last = lastOf('75', '9, 7, 8');
  assert.equal(progress('75', '9, 8', last), 'done');
  assert.equal(progress('75', '9, 8, 8', last), 'improved');
});

test('Progress: more weight with fewer reps is improved', () => {
  assert.equal(progress('80', '8, 7, 7', lastOf('75', '10, 10, 10')), 'improved');
});

test('Progress: less weight with more reps is only done', () => {
  assert.equal(progress('70', '12', lastOf('75', '8')), 'done');
});

test('Progress: own weight of a set', () => {
  assert.equal(progress('50', '12@45, 10, 10', lastOf('50', '12@40, 10, 10')), 'improved');
});

test('Progress: one heavier set is enough', () => {
  assert.equal(progress('80', '10, 8@75, 8@75', lastOf('75', '10, 10, 10')), 'improved');
});

test('Progress: the heaviest weight decides first', () => {
  const last = lastOf('50', '10, 10, 10, 12@40');
  assert.equal(progress('50', '10, 10, 9, 15@40', last), 'done');
});

test('Progress: an extra lighter set is improved', () => {
  assert.equal(progress('50', '12@30, 10, 10, 10', lastOf('50', '10, 10, 10')), 'improved');
});

test('Progress: never done before', () => {
  assert.equal(progress('30', '12', null), 'done');
});

test('Progress: an unreadable entry last time is not compared', () => {
  assert.equal(progress('50', '1, 9, 7', lastOf('50', '?, 9, 7')), 'done');
  assert.equal(progress('50', '1, 10, 7', lastOf('50', '?, 9, 7')), 'done');
});

test('Progress: an unreadable weight last time is not compared', () => {
  assert.equal(progress('25', '10, 10', lastOf('25 (Seil)', '10, 10')), 'done');
});

test('Progress: a set without any weight counts as 0 kg', () => {
  assert.equal(progress('', '12', lastOf('', '10')), 'improved');
});

test('Progress: an unreadable weight today is never improved', () => {
  assert.equal(progress('25 (Seil)', '10', lastOf('20', '5')), 'done');
});

test('Assisted: less assistance is improved', () => {
  assert.equal(assistedProgress('30', '8, 8, 8', '25', '6, 6, 5'), 'improved');
});

test('Assisted: more assistance with more reps is only done', () => {
  assert.equal(assistedProgress('25', '8, 8', '30', '10, 10'), 'done');
});

test('Assisted: same assistance with more reps is improved', () => {
  assert.equal(assistedProgress('25', '8, 8, 8', '25', '9, 8, 8'), 'improved');
});

test('Assisted: no assistance beats any weight', () => {
  assert.equal(assistedProgress('20', '8, 8', '', '3'), 'improved');
});

test('Assisted: a name without the marker compares heaviest first', () => {
  const last = exerciseOf('30', '8', 'Assisted Pullups').last;
  assert.equal(progress('25', '8', last, false), 'done');
});

test('Assisted: marker in another case', () => {
  const last = exerciseOf('20', '10', 'Dips (Assistiert)').last;
  assert.equal(progress('15', '8', last, true), 'improved');
});

// Ergometer's row: its intensity and time after the eleven other columns, in
// the pair at L/M.
const ergRow = (date, intensity, time) => [date, '', '', '', '', '', '', '', '', '', '', intensity, time];
const ergModel = (...rows) => buildToday([HEADER, ...rows], TODAY);
const ergometer = (...rows) => byName(ergModel(...rows), 'Ergometer');

test("Ergometer: today's entry holds the intensity and the time", () => {
  const entry = ergometer(ergRow('15.10.2026', '8', '3:30')).today;
  assert.equal(ergometer().timed, true);
  assert.equal(byName(buildToday(tab(), TODAY), 'Latzug').timed, false);
  assert.equal(entry.intensity.value, 8);
  assert.equal(entry.time.seconds, 210);
  assert.equal(entry.weightText, '8');
  assert.equal(entry.repsText, '3:30');
});

test('Timed exercise: last time is the nearest row with a readable time', () => {
  const exercise = ergometer(
    ergRow('01.09.2026', '8', '3:30'),
    ergRow('08.09.2026', '', '20 min'),
    ergRow('12.09.2026', '8', ''),
  );
  assert.equal(exercise.last.row, 2);
  assert.equal(exercise.last.time.seconds, 210);
});

test('Timed exercise: the carry-over row is the last time when no workout row has a time', () => {
  const exercise = ergometer(ergRow('2025', '7', '4:00'), ergRow('01.09.2026', '8', ''));
  assert.equal(exercise.last.carryOver, true);
  assert.equal(exercise.last.year, 2025);
  assert.equal(exercise.last.time.seconds, 240);
});

test('Only Ergometer: a row with only an intensity and a time is the last workout', () => {
  const model = ergModel(ergRow('01.09.2026', '8', '3:30'));
  assert.equal(model.lastWorkoutRow, 2);
  assert.equal(byName(model, 'Ergometer').doneLastWorkout, true);
  assert.equal(byName(model, 'Latzug').doneLastWorkout, false);
});

test('Ergometer intensity only: not the last workout, and not done in it', () => {
  const model = ergModel(ergRow('01.09.2026', '8', ''));
  assert.equal(model.lastWorkoutRow, null);
  assert.equal(byName(model, 'Ergometer').doneLastWorkout, false);
});

test('an unreadable Ergometer time in the last workout counts as done there', () => {
  const model = ergModel(ergRow('01.09.2026', '8', '20 min'));
  assert.equal(model.lastWorkoutRow, 2);
  assert.equal(byName(model, 'Ergometer').doneLastWorkout, true);
  assert.equal(byName(model, 'Ergometer').last, null);
});

const ergLast = (intensity, time) => ergometer(ergRow('01.09.2026', intensity, time));

test('formatTimeInput: minutes and seconds, as text and seconds', () => {
  const cases = [
    ['330', '3:30', 210],
    ['1205', '12:05', 725],
    ['45', '0:45', 45],
    ['0330', '3:30', 210],
    ['3:30', '3:30', 210],
  ];
  for (const [input, text, seconds] of cases) {
    assert.deepEqual(formatTimeInput(input), { text, seconds, invalid: false }, input);
  }
});

test('formatTimeInput: typing a time one digit at a time', () => {
  assert.equal(formatTimeInput('4').text, '0:04');
  assert.equal(formatTimeInput('0:041').text, '0:41');
  assert.equal(formatTimeInput('0:415').text, '4:15');
  assert.equal(formatTimeInput('41').text, '0:41');
  assert.equal(formatTimeInput('415').text, '4:15');
});

test('formatTimeInput: deleting digits', () => {
  assert.equal(formatTimeInput('4:1').text, '0:41');
  assert.equal(formatTimeInput('0:4').text, '0:04');
  assert.equal(formatTimeInput('0:0').text, '');
});

test('formatTimeInput: changing a time', () => {
  assert.equal(formatTimeInput('3:3').text, '0:33');
  assert.equal(formatTimeInput('0:3').text, '0:03');
  assert.equal(formatTimeInput('0:034').text, '0:34');
  assert.equal(formatTimeInput('0:345').text, '3:45');
});

test('formatTimeInput: seconds above 59 are shown and invalid', () => {
  assert.deepEqual(formatTimeInput('390'), { text: '3:90', seconds: null, invalid: true });
});

test('formatTimeInput: other characters are dropped', () => {
  assert.equal(formatTimeInput('4a1').text, '0:41');
  assert.equal(formatTimeInput('4:1:').text, '0:41');
});

test('formatTimeInput: no digits and zeros are neither a time nor invalid', () => {
  for (const input of ['', '0', '00']) {
    assert.deepEqual(formatTimeInput(input), { text: '', seconds: null, invalid: false }, input);
  }
});

test('Ergometer prefill from the last workout: intensity copied, time as placeholder', () => {
  const state = initialState(ergLast('8', '3:30'));
  assert.deepEqual(state, { mode: 'timed', intensity: '8', time: '', placeholder: '3:30' });
});

test("Ergometer: today's values come first", () => {
  const state = initialState(ergometer(ergRow('01.09.2026', '8', '3:30'), ergRow('15.10.2026', '9', '4:00')));
  assert.deepEqual(state, { mode: 'timed', intensity: '9', time: '4:00', placeholder: '3:30' });
});

test('Ergometer never done: everything is empty', () => {
  assert.deepEqual(initialState(ergometer()), { mode: 'timed', intensity: '', time: '', placeholder: '' });
});

test('Ergometer time with a unit today gives text mode', () => {
  const state = initialState(ergometer(ergRow('15.10.2026', '8', '20 min')));
  assert.deepEqual(state, { mode: 'text', weightText: '8', repsText: '20 min' });
});

const timedCells = (intensity, time) => cellsFor({ mode: 'timed', intensity, time, placeholder: '' });

test('Logging Ergometer: the intensity and the time as m:ss', () => {
  assert.deepEqual(timedCells('8', '330'), { ok: true, weightText: '8', repsText: '3:30' });
});

test('Ergometer without an intensity: only the time is written', () => {
  assert.deepEqual(timedCells('', '330'), { ok: true, weightText: '', repsText: '3:30' });
});

test('Ergometer changing only the intensity, or clearing the time, empties both cells', () => {
  assert.deepEqual(timedCells('9', ''), { ok: true, weightText: '', repsText: '' });
  assert.deepEqual(timedCells('', ''), { ok: true, weightText: '', repsText: '' });
});

test('Ergometer decimal intensity is invalid', () => {
  const result = timedCells('8.5', '330');
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, { intensity: true, time: false });
});

test('Ergometer too many seconds is invalid', () => {
  const result = timedCells('8', '390');
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, { intensity: false, time: true });
});

test('Ergometer first: the date, then the two cells at the intensity column', () => {
  const exercise = ergometer();
  const cells = timedCells('8', '330');
  assert.deepEqual(writesFor(exercise, cells, { row: 3, creating: true, today: TODAY }), [
    { row: 3, col: 0, values: ['15.10.2026'] },
    { row: 3, col: 11, values: ['8', '3:30'] },
  ]);
});

const ergProgress = (lastIntensity, lastTime, intensity, time) =>
  timedProgressOf({ weightText: intensity, repsText: time }, ergLast(lastIntensity, lastTime).last);

test('Timed progress: more intensity improves, even with a shorter time', () => {
  assert.equal(ergProgress('8', '3:30', '9', '3:00'), 'improved');
});

test('Timed progress: the same intensity and a longer time improves', () => {
  assert.equal(ergProgress('8', '3:30', '8', '3:31'), 'improved');
});

test('Timed progress: equal to last time is only done', () => {
  assert.equal(ergProgress('8', '3:30', '8', '3:30'), 'done');
});

test('Timed progress: less intensity with a longer time is only done', () => {
  assert.equal(ergProgress('8', '3:30', '7', '9:00'), 'done');
});

test('Timed progress: without an intensity it counts as 0', () => {
  assert.equal(ergProgress('8', '3:30', '', '9:00'), 'done');
  assert.equal(ergProgress('', '3:30', '', '3:31'), 'improved');
  assert.equal(ergProgress('', '3:30', '1', '0:10'), 'improved');
});

test('Timed progress: an intensity alone is none', () => {
  assert.equal(ergProgress('8', '3:30', '9', ''), 'none');
});

test('Timed progress: an unreadable time today is done', () => {
  assert.equal(ergProgress('8', '3:30', '9', '20 min'), 'done');
});

test('Timed progress: an unreadable intensity last time is not compared', () => {
  const last = ergLast('8 (Stufe)', '3:30').last;
  assert.equal(timedProgressOf({ weightText: '9', repsText: '4:00' }, last), 'done');
});

test('Timed progress: never done before is done', () => {
  assert.equal(timedProgressOf({ weightText: '8', repsText: '3:30' }, null), 'done');
});

test('Tile labels: Ergometer has an icon and takes no label', () => {
  assert.deepEqual(withIcons(['Ergometer']), [null]);
});
