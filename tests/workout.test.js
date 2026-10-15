import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildToday, initialState, cellsFor } from '../workout.js';

// All data below is made up. Columns: B/C Bankdrücken, D/E Latzug,
// F/G Beinpresse, H/I Bizepsmaschine, J/K Duale Schulterpresse.
const HEADER = [
  'Datum', 'Bankdrücken', '', 'Latzug', '', 'Beinpresse', '', 'Bizepsmaschine', '', 'Duale Schulterpresse', '',
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

test('two rows with today\'s date: the lowest is used', () => {
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
