import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHeader,
  parseDate,
  formatDate,
  dayNumber,
  fromDayNumber,
  hasCarryOverRow,
  parseWeight,
  parseReps,
  formatWeight,
  formatSets,
  columnLetter,
  rangeFor,
  daysBetween,
  sheetUrl,
} from '../sheet-format.js';

// All data below is made up. Cells are shaped like the real sheet's.

test('Merged header: a merged pair keeps its name in the first column', () => {
  const row1 = ['Datum', 'Bankdrücken', '', 'Bauchmaschine', ''];
  assert.deepEqual(parseHeader(row1), [
    { name: 'Bankdrücken', weightCol: 1, repsCol: 2 },
    { name: 'Bauchmaschine', weightCol: 3, repsCol: 4 },
  ]);
});

test('Unmerged header: the reps column is the weight column + 1', () => {
  const row1 = new Array(25).fill('');
  row1[0] = 'Datum';
  row1[25] = 'Latzug';
  assert.deepEqual(parseHeader(row1), [{ name: 'Latzug', weightCol: 25, repsCol: 26 }]);
});

test('a header pair with an empty name is skipped', () => {
  const row1 = ['Datum', 'Bankdrücken', '', '', '', ' Beinpresse ', ''];
  assert.deepEqual(
    parseHeader(row1).map((e) => e.name),
    ['Bankdrücken', 'Beinpresse'],
  );
});

test('duplicate names stay separate exercises, keyed by column', () => {
  const row1 = ['Datum', 'Latzug', '', 'Latzug', ''];
  assert.deepEqual(
    parseHeader(row1).map((e) => e.weightCol),
    [1, 3],
  );
});

test('Workout row: a date as day.month.year', () => {
  assert.deepEqual(parseDate('12.10.2026'), { y: 2026, m: 10, d: 12 });
});

test('Date without leading zeros', () => {
  assert.deepEqual(parseDate('5.9.2026'), { y: 2026, m: 9, d: 5 });
  assert.deepEqual(parseDate(' 5.9.2026 '), { y: 2026, m: 9, d: 5 });
});

test('31.02.2026 and 2026-10-15 are rejected as dates', () => {
  assert.equal(parseDate('31.02.2026'), null);
  assert.equal(parseDate('2026-10-15'), null);
  assert.equal(parseDate('2025'), null);
  assert.equal(parseDate(''), null);
});

test('formatDate pads with zeros', () => {
  assert.equal(formatDate({ y: 2026, m: 9, d: 5 }), '05.09.2026');
  assert.equal(formatDate({ y: 2026, m: 10, d: 15 }), '15.10.2026');
});

test('Carry-over row: 2025 in A2 counts, and 2025 in A5 does not', () => {
  assert.equal(hasCarryOverRow([['Datum'], ['2025']]), true);
  assert.equal(hasCarryOverRow([['Datum'], ['27.08.2026'], [], [], ['2025']]), false);
  assert.equal(hasCarryOverRow([['Datum']]), false);
});

test('Whole and decimal weights', () => {
  assert.deepEqual(parseWeight('45'), { value: 45, unreadable: false });
  assert.deepEqual(parseWeight(' 45'), { value: 45, unreadable: false });
  assert.deepEqual(parseWeight('17.5'), { value: 17.5, unreadable: false });
  assert.deepEqual(parseWeight('17,5'), { value: 17.5, unreadable: false });
});

test('an empty weight cell is no weight, not unreadable', () => {
  assert.deepEqual(parseWeight(''), { value: null, unreadable: false });
  assert.deepEqual(parseWeight('  '), { value: null, unreadable: false });
  assert.deepEqual(parseWeight(undefined), { value: null, unreadable: false });
});

test('Notes and typos: "25 (Seil)" is an unreadable weight', () => {
  assert.deepEqual(parseWeight('25 (Seil)'), { value: null, unreadable: true });
});

test('Sets with their own weight', () => {
  const { sets, unreadable } = parseReps('12@40, 10, 10@55');
  assert.equal(unreadable, false);
  assert.deepEqual(sets, [
    { reps: 12, weight: 40 },
    { reps: 10, weight: null },
    { reps: 10, weight: 55 },
  ]);
});

test('Any number of sets', () => {
  assert.equal(parseReps('14').sets.length, 1);
  assert.equal(parseReps('10, 9, ').sets.length, 2);
  assert.equal(parseReps('10, 10, 10, 8').sets.length, 4);
});

test('Irregular spacing', () => {
  assert.deepEqual(
    parseReps('9,  8, 7').sets.map((s) => s.reps),
    [9, 8, 7],
  );
  assert.deepEqual(
    parseReps('10, 10, 10 ').sets.map((s) => s.reps),
    [10, 10, 10],
  );
});

test('Decimal set weight', () => {
  assert.deepEqual(parseReps('15@22.5, 15, 13').sets[0], { reps: 15, weight: 22.5 });
});

test('Reps that Google Sheets stored as a date, displayed as "12, 10, 10"', () => {
  assert.deepEqual(
    parseReps('12, 10, 10').sets.map((s) => s.reps),
    [12, 10, 10],
  );
});

test('Two-digit year display: "10, 8, 07"', () => {
  assert.deepEqual(
    parseReps('10, 8, 07').sets.map((s) => s.reps),
    [10, 8, 7],
  );
});

test('Notes and typos: unreadable reps cells', () => {
  assert.equal(parseReps('?, 9, 7').unreadable, true);
  assert.equal(parseReps('10, 7,@60 7').unreadable, true);
});

test('"?, 9, 7" still yields entries 2 and 3', () => {
  assert.deepEqual(parseReps('?, 9, 7').sets, [null, { reps: 9, weight: null }, { reps: 7, weight: null }]);
});

test('an empty reps cell is no sets rather than unreadable', () => {
  assert.deepEqual(parseReps(''), { sets: [], unreadable: false });
  assert.deepEqual(parseReps(undefined), { sets: [], unreadable: false });
});

test('Number formatting', () => {
  assert.equal(formatWeight(17.5), '17.5');
  assert.equal(formatWeight(20.0), '20');
  assert.equal(formatDate({ y: 2026, m: 9, d: 5 }), '05.09.2026');
});

test('Sets with their own weight (writing)', () => {
  const sets = [
    { reps: 12, weight: 40 },
    { reps: 10, weight: 50 },
    { reps: 10, weight: 55 },
  ];
  assert.equal(formatSets(sets, 50), '12@40, 10, 10@55');
});

test('sets without a weight of their own are written bare', () => {
  assert.equal(
    formatSets(
      [
        { reps: 10, weight: null },
        { reps: 9, weight: null },
      ],
      75,
    ),
    '10, 9',
  );
});

test('columnLetter: 0, 25, 26 and 32', () => {
  assert.equal(columnLetter(0), 'A');
  assert.equal(columnLetter(25), 'Z');
  assert.equal(columnLetter(26), 'AA');
  assert.equal(columnLetter(32), 'AG');
});

test('rangeFor quotes the tab and doubles a quote in its title', () => {
  assert.equal(rangeFor('2026', 14, 0), "'2026'!A14");
  assert.equal(rangeFor('2026', 14, 25, 26), "'2026'!Z14:AA14");
  assert.equal(rangeFor("Tom's 2026", 3, 0), "'Tom''s 2026'!A3");
});

test('parsing a formatted reps cell gives back the same sets', () => {
  const sets = [
    { reps: 12, weight: 40 },
    { reps: 10, weight: null },
    { reps: 10, weight: 55 },
  ];
  assert.deepEqual(parseReps(formatSets(sets, 50)).sets, sets);
});

const day = (d, m, y) => ({ y, m, d });

test('A few days ago', () => {
  assert.equal(daysBetween(day(12, 10, 2026), day(15, 10, 2026)), 3);
});

test('One day ago', () => {
  assert.equal(daysBetween(day(14, 10, 2026), day(15, 10, 2026)), 1);
});

test('Across a month', () => {
  assert.equal(daysBetween(day(12, 9, 2026), day(15, 10, 2026)), 33);
});

test('Across a clock change', () => {
  assert.equal(daysBetween(day(24, 10, 2026), day(27, 10, 2026)), 3);
});

test('Across a year', () => {
  assert.equal(daysBetween(day(30, 12, 2025), day(2, 1, 2026)), 3);
});

test('The same day is 0, and a later date is negative', () => {
  assert.equal(daysBetween(day(15, 10, 2026), day(15, 10, 2026)), 0);
  assert.equal(daysBetween(day(20, 10, 2026), day(15, 10, 2026)), -5);
});

test('sheetUrl: a tab ID gives #gid', () => {
  assert.equal(sheetUrl('abc123', 1234567), 'https://docs.google.com/spreadsheets/d/abc123/edit#gid=1234567');
});

test('sheetUrl: the tab ID 0 gives #gid=0', () => {
  assert.equal(sheetUrl('abc123', 0), 'https://docs.google.com/spreadsheets/d/abc123/edit#gid=0');
});

test('sheetUrl: no tab ID gives no #gid', () => {
  assert.equal(sheetUrl('abc123', undefined), 'https://docs.google.com/spreadsheets/d/abc123/edit');
});

test('sheetUrl: the spreadsheet ID is encoded', () => {
  assert.equal(sheetUrl('a/b c', 1), 'https://docs.google.com/spreadsheets/d/a%2Fb%20c/edit#gid=1');
});

test('Day numbers: differences in days', () => {
  const diff = (a, b) => dayNumber(a) - dayNumber(b);
  assert.equal(diff({ y: 2026, m: 10, d: 15 }, { y: 2026, m: 9, d: 12 }), 33);
  assert.equal(diff({ y: 2027, m: 1, d: 1 }, { y: 2026, m: 12, d: 31 }), 1);
});

test('Day numbers: the change to summer time is still 1 day', () => {
  assert.equal(dayNumber({ y: 2026, m: 3, d: 30 }) - dayNumber({ y: 2026, m: 3, d: 29 }), 1);
});

test('Day numbers: fromDayNumber is the inverse of dayNumber', () => {
  for (const date of [{ y: 2028, m: 2, d: 29 }, { y: 2026, m: 12, d: 31 }]) {
    assert.deepEqual(fromDayNumber(dayNumber(date)), date);
  }
});
