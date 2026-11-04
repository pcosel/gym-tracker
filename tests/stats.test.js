import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  historyOf,
  withToday,
  windowOf,
  daysSinceLastDone,
  exerciseOrder,
  summaryOf,
  estimatedMax,
  lightestAssistance,
  yearSoFar,
} from '../stats.js';
import { dayNumber } from '../sheet-format.js';

// All data below is made up. Cells are shaped like the real sheet's.

const NAMES = [
  'Latzug',
  'Bankdrücken',
  'Ruderzug',
  'Rückenheben',
  'Klimmzüge (assistiert)',
  'Beinpresse',
  'Seitheber',
];

// A tab for the given exercise names, in that header order. `row(date, cells)`
// builds a row from { name: [weightText, repsText] }; a row with a year in
// column A is the carry-over row.
function sheet(names = NAMES) {
  const header = ['Datum'];
  for (const name of names) header.push(name, '');
  const row = (date, cells = {}) => {
    const out = [date, ...names.flatMap(() => ['', ''])];
    for (const [name, [weight, reps]] of Object.entries(cells)) {
      const col = 1 + 2 * names.indexOf(name);
      out[col] = weight;
      out[col + 1] = reps;
    }
    return out;
  };
  return { header, row };
}

const TODAY = { y: 2026, m: 10, d: 15 };
const day = (d, m, y = 2026) => dayNumber({ y, m, d });
const exerciseOf = (history, name) => history.exercises.find((e) => e.name === name);
const windowDays = (days, today = TODAY) => windowOf(today, { days });

// historyOf

test('Row dated in another year', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('30.12.2025', { Latzug: ['70', '8'] })], TODAY);
  assert.equal(exerciseOf(history, 'Latzug').sessions.length, 0);
  assert.equal(history.workouts, 0);
});

test('Row dated after today', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('16.10.2026', { Latzug: ['70', '8'] })], TODAY);
  assert.equal(exerciseOf(history, 'Latzug').sessions.length, 0);
  assert.equal(history.workouts, 0);
});

test('Weight only: no session and no workout', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('12.10.2026', { Latzug: ['40', ''] })], TODAY);
  assert.equal(exerciseOf(history, 'Latzug').sessions.length, 0);
  assert.equal(history.workouts, 0);
});

test('Unreadable reps: a session that is not readable, and a workout', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('12.10.2026', { Latzug: ['70', '?, 9, 7'] })], TODAY);
  const sessions = exerciseOf(history, 'Latzug').sessions;
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].readable, false);
  assert.equal(history.workouts, 1);
});

test('Sessions are sorted by date when the rows are out of order', () => {
  const { header, row } = sheet();
  const history = historyOf(
    [
      header,
      row('12.10.2026', { Latzug: ['70', '8'] }),
      row('01.10.2026', { Latzug: ['65', '8'] }),
      row('05.10.2026', { Latzug: ['67', '8'] }),
    ],
    TODAY,
  );
  assert.deepEqual(
    exerciseOf(history, 'Latzug').sessions.map((s) => s.weight.value),
    [65, 67, 70],
  );
});

test('Two rows with the same date make two sessions, in row order', () => {
  const { header, row } = sheet();
  const history = historyOf(
    [
      header,
      row('12.10.2026', { Latzug: ['70', '8'] }),
      row('12.10.2026', { Latzug: ['72', '8'] }),
    ],
    TODAY,
  );
  const sessions = exerciseOf(history, 'Latzug').sessions;
  assert.deepEqual(
    sessions.map((s) => s.weight.value),
    [70, 72],
  );
  assert.equal(history.workouts, 2);
});

test('The carry-over row is the baseline and never a session', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('2025', { Latzug: ['60', '15'] })], TODAY);
  const latzug = exerciseOf(history, 'Latzug');
  assert.equal(latzug.sessions.length, 0);
  assert.equal(latzug.baseline.weight.value, 60);
  assert.equal(history.workouts, 0);
});

test('A tab without a carry-over row: row 2 can be a session', () => {
  const { header, row } = sheet();
  const history = historyOf([header, row('01.10.2026', { Latzug: ['60', '15'] })], TODAY);
  const latzug = exerciseOf(history, 'Latzug');
  assert.equal(latzug.sessions.length, 1);
  assert.equal(latzug.baseline, null);
});

// withToday

const entry = (name, weightText, repsText, names = NAMES) => ({
  weightCol: 1 + 2 * names.indexOf(name),
  repsCol: 2 + 2 * names.indexOf(name),
  weightText,
  repsText,
});

test('withToday: a loaded row for today takes the cells, the other rows stay', () => {
  const { header, row } = sheet();
  const rows = [
    header,
    row('12.10.2026', { Latzug: ['70', '8'] }),
    row('15.10.2026', { Bankdrücken: ['50', '10'] }),
  ];
  const patched = withToday(rows, TODAY, [entry('Latzug', '75', '10, 9')]);
  assert.equal(patched.length, 3);
  assert.equal(patched[1], rows[1]);
  assert.equal(patched[2][1], '75');
  assert.equal(patched[2][2], '10, 9');
  assert.equal(patched[2][3], '50');
  assert.equal(patched[2][0], '15.10.2026');
});

test('withToday: without a row for today, one dated today is appended', () => {
  const { header, row } = sheet();
  const rows = [header, row('12.10.2026', { Latzug: ['70', '8'] })];
  const patched = withToday(rows, TODAY, [entry('Latzug', '75', '10')]);
  assert.equal(patched.length, 3);
  assert.equal(patched[2][0], '15.10.2026');
  assert.equal(patched[2][1], '75');
  assert.equal(patched[2][2], '10');
});

test('Invalid input: the cells passed in are the ones that count', () => {
  const { header, row } = sheet();
  const rows = [header, row('15.10.2026', { Latzug: ['75', '10, 9'] })];
  const patched = withToday(rows, TODAY, [entry('Latzug', '75', '10, 9')]);
  const history = historyOf(patched, TODAY);
  assert.deepEqual(
    exerciseOf(history, 'Latzug').sessions[0].reps.sets.map((s) => s.reps),
    [10, 9],
  );
});

test('withToday does not modify its input', () => {
  const { header, row } = sheet();
  const rows = [header, row('15.10.2026', { Latzug: ['70', '8'] })];
  const before = JSON.stringify(rows);
  withToday(rows, TODAY, [entry('Latzug', '75', '10')]);
  withToday([header], TODAY, [entry('Latzug', '75', '10')]);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(rows.length, 2);
});

test('withToday: today is found after a carry-over row, and the carry-over row is not today', () => {
  const { header, row } = sheet();
  const rows = [header, row('2026', { Latzug: ['60', '15'] })];
  const patched = withToday(rows, TODAY, [entry('Latzug', '75', '10')]);
  assert.equal(patched.length, 3);
  assert.equal(patched[1][1], '60');
});

// windowOf

test('Last 30 days', () => {
  const w = windowDays(30);
  assert.equal(w.firstDay, day(16, 9));
  assert.equal(w.lastDay, day(15, 10));
  assert.equal(w.partial, false);
  assert.equal(w.coveredDays, 30);
});

test('This year', () => {
  const w = windowOf(TODAY, 'year');
  assert.equal(w.firstDay, day(1, 1));
  assert.equal(w.lastDay, day(15, 10));
  assert.equal(w.partial, false);
  assert.equal(w.coveredDays, 288);
});

test('Typed number of days', () => {
  assert.equal(windowDays(45).firstDay, day(1, 9));
});

test('Early January: partial, with the days since 1 January covered', () => {
  const w = windowDays(30, { y: 2027, m: 1, d: 15 });
  assert.equal(w.partial, true);
  assert.equal(w.coveredFirstDay, day(1, 1, 2027));
  assert.equal(w.coveredDays, 15);
  assert.equal(w.totalDays, 30);
});

test('Early January: 3 covered days', () => {
  assert.equal(windowDays(30, { y: 2027, m: 1, d: 3 }).coveredDays, 3);
});

test('Window within the year: not partial', () => {
  assert.equal(windowDays(90).partial, false);
});

test('A window of 1 day covers only today', () => {
  const w = windowDays(1);
  assert.equal(w.coveredFirstDay, w.lastDay);
  assert.equal(w.coveredDays, 1);
});

// daysSinceLastDone and exerciseOrder

const ORDER_NAMES = ['Bizepsmaschine', 'Latzug', 'Bankdrücken', 'Beinpresse'];

function orderTab() {
  const { header, row } = sheet(ORDER_NAMES);
  return [
    header,
    row('2025', { Beinpresse: ['100', '10'] }),
    row('12.09.2026', { Bankdrücken: ['50', '10'] }),
    row('13.10.2026', { Latzug: ['70', '8'] }),
    row('15.10.2026', { Bizepsmaschine: ['30', '10'] }),
  ];
}

const namesOf = (exercises) => exercises.map((e) => e.name);

test('Order', () => {
  const history = historyOf(orderTab(), TODAY);
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'recent')), [
    'Bizepsmaschine',
    'Latzug',
    'Bankdrücken',
    'Beinpresse',
  ]);
  const days = (name) => daysSinceLastDone(exerciseOf(history, name), TODAY);
  assert.equal(days('Bizepsmaschine'), 0);
  assert.equal(days('Latzug'), 2);
  assert.equal(days('Bankdrücken'), 33);
});

test('Not done this year: the carry-over row alone gives null', () => {
  const history = historyOf(orderTab(), TODAY);
  assert.equal(daysSinceLastDone(exerciseOf(history, 'Beinpresse'), TODAY), null);
});

test('Yesterday', () => {
  const { header, row } = sheet(['Latzug']);
  const history = historyOf([header, row('14.10.2026', { Latzug: ['70', '8'] })], TODAY);
  assert.equal(daysSinceLastDone(exerciseOf(history, 'Latzug'), TODAY), 1);
});

test('Reversed order', () => {
  const history = historyOf(orderTab(), TODAY);
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'longest')), [
    'Beinpresse',
    'Bankdrücken',
    'Latzug',
    'Bizepsmaschine',
  ]);
});

test('Same day: alphabetical, not header order', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken']);
  const history = historyOf(
    [header, row('13.10.2026', { Latzug: ['70', '8'], Bankdrücken: ['50', '10'] })],
    TODAY,
  );
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'recent')), ['Bankdrücken', 'Latzug']);
});

test('Umlauts: "ü" sorts as "u"', () => {
  const { header, row } = sheet(['Ruderzug', 'Rückenheben']);
  const history = historyOf(
    [header, row('13.10.2026', { Ruderzug: ['70', '8'], Rückenheben: ['', '15'] })],
    TODAY,
  );
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'recent')), ['Rückenheben', 'Ruderzug']);
});

test('Not done this year: alphabetical in both orders', () => {
  const { header, row } = sheet(['Seitheber', 'Beinpresse']);
  const history = historyOf([header, row('2025')], TODAY);
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'recent')), ['Beinpresse', 'Seitheber']);
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'longest')), ['Beinpresse', 'Seitheber']);
});

test('Ties when reversed: still alphabetical', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken']);
  const history = historyOf(
    [header, row('13.10.2026', { Latzug: ['70', '8'], Bankdrücken: ['50', '10'] })],
    TODAY,
  );
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'longest')), ['Bankdrücken', 'Latzug']);
});

test('Equal names keep header order', () => {
  const { header, row } = sheet(['Latzug', 'LATZUG']);
  const history = historyOf(
    [header, row('13.10.2026', { Latzug: ['70', '8'], LATZUG: ['50', '10'] })],
    TODAY,
  );
  assert.deepEqual(namesOf(exerciseOrder(history, TODAY, 'recent')), ['Latzug', 'LATZUG']);
});

// summaryOf: counts and averages

function latzugSummary(rowsOfLatzug, window = windowDays(30), names = ['Latzug']) {
  const { header, row } = sheet(names);
  const rows = [header, ...rowsOfLatzug.map(([date, ...cells]) => row(date, { [names[0]]: cells }))];
  return summaryOf(exerciseOf(historyOf(rows, TODAY), names[0]), window);
}

test('Sessions in the window', () => {
  const summary = latzugSummary([
    ['10.09.2026', '70', '8'],
    ['20.09.2026', '70', '8'],
    ['01.10.2026', '70', '8'],
    ['08.10.2026', '70', '8'],
    ['13.10.2026', '70', '8'],
  ]);
  assert.equal(summary.count, 4);
});

test('No session in the window', () => {
  assert.equal(latzugSummary([['12.09.2026', '70', '8']]).count, 0);
});

test('Sets with their own weight: averages', () => {
  const summary = latzugSummary([['12.10.2026', '50', '12@40, 10, 10@55']]);
  assert.equal(summary.averageReps, 32);
  assert.equal(summary.averageWeight, 47.8);
});

test('Two sessions: averages', () => {
  const summary = latzugSummary([
    ['01.10.2026', '75', '10, 10, 10'],
    ['08.10.2026', '80', '8, 8, 8'],
  ]);
  assert.equal(summary.averageReps, 27);
  assert.equal(summary.averageWeight, 77.5);
});

test('Assisted exercise: averages', () => {
  const summary = latzugSummary([['12.10.2026', '30', '8, 8, 8']], windowDays(30), [
    'Klimmzüge (assistiert)',
  ]);
  assert.equal(summary.averageReps, 24);
  assert.equal(summary.averageWeight, 30);
});

test('One unreadable session: counted, but left out of the averages', () => {
  const summary = latzugSummary([
    ['01.10.2026', '75', '10, 10, 10'],
    ['08.10.2026', '25 (Seil)', '10, 10'],
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.readableCount, 1);
  assert.equal(summary.leftOut, 1);
  assert.equal(summary.averageReps, 30);
  assert.equal(summary.averageWeight, 75);
});

test('Nothing readable: no averages', () => {
  const summary = latzugSummary([['12.10.2026', '70', '?, 9, 7']]);
  assert.equal(summary.count, 1);
  assert.equal(summary.readableCount, 0);
  assert.equal(summary.averageReps, null);
  assert.equal(summary.averageWeight, null);
});

test('A readable session with 0 reps adds 0 reps and no weight', () => {
  const summary = latzugSummary([
    ['01.10.2026', '75', '10, 10'],
    ['08.10.2026', '75', '0'],
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.averageReps, 10);
  assert.equal(summary.averageWeight, 75);
});

test('Early January: only sessions since 01.01.2027 count', () => {
  const today = { y: 2027, m: 1, d: 15 };
  const { header, row } = sheet(['Latzug']);
  const rows = [
    header,
    row('20.12.2026', { Latzug: ['70', '8'] }),
    row('05.01.2027', { Latzug: ['72', '8'] }),
  ];
  const summary = summaryOf(
    exerciseOf(historyOf(rows, today), 'Latzug'),
    windowOf(today, { days: 30 }),
  );
  assert.equal(summary.count, 1);
});

// summaryOf: graph points

test('Best set: 100 kg', () => {
  const session = historyOf(
    (() => {
      const { header, row } = sheet(['Latzug']);
      return [header, row('12.10.2026', { Latzug: ['75', '10, 10, 8'] })];
    })(),
    TODAY,
  ).exercises[0].sessions[0];
  assert.equal(Math.round(estimatedMax(session) * 10) / 10, 100);
});

test('Sets with their own weight: point at 73.3 kg', () => {
  const summary = latzugSummary([['12.10.2026', '50', '12@40, 10, 10@55']]);
  assert.deepEqual(summary.points, [{ day: day(12, 10), value: 73.3 }]);
});

test('Without weight: no point', () => {
  const summary = latzugSummary([['12.10.2026', '', '15, 15']], windowDays(30), ['Rückenheben']);
  assert.deepEqual(summary.points, []);
});

test('Unreadable weight: no point', () => {
  const summary = latzugSummary([['12.10.2026', '25 (Seil)', '10, 10']]);
  assert.deepEqual(summary.points, []);
});

test('A set with 0 reps gives no point', () => {
  const summary = latzugSummary([['12.10.2026', '75', '0']]);
  assert.deepEqual(summary.points, []);
});

test('Lightest assistance: 20 kg', () => {
  const summary = latzugSummary([['12.10.2026', '25', '6, 6@20, 5']], windowDays(30), [
    'Klimmzüge (assistiert)',
  ]);
  assert.deepEqual(summary.points, [{ day: day(12, 10), value: 20 }]);
});

test('No assistance: 0 kg', () => {
  const summary = latzugSummary([['12.10.2026', '', '3']], windowDays(30), [
    'Klimmzüge (assistiert)',
  ]);
  assert.deepEqual(summary.points, [{ day: day(12, 10), value: 0 }]);
  const { header, row } = sheet(['Klimmzüge (assistiert)']);
  const session = historyOf(
    [header, row('12.10.2026', { 'Klimmzüge (assistiert)': ['', '3'] })],
    TODAY,
  ).exercises[0].sessions[0];
  assert.equal(lightestAssistance(session), 0);
});

test('Points are in date order and only inside the window', () => {
  const summary = latzugSummary([
    ['12.10.2026', '75', '10'],
    ['01.10.2026', '70', '10'],
    ['10.09.2026', '60', '10'],
  ]);
  assert.deepEqual(
    summary.points.map((p) => p.day),
    [day(1, 10), day(12, 10)],
  );
});

// yearSoFar

test('Counting: 2 workouts, 8 sets, 76 reps', () => {
  const { header, row } = sheet(['Bankdrücken', 'Latzug']);
  const rows = [
    header,
    row('12.09.2026', {
      Bankdrücken: ['50', '12@40, 10, 10@55'],
      Latzug: ['70', '9, 7, 8'],
    }),
    row('01.10.2026', { Latzug: ['75', '10, 10'] }),
  ];
  const year = yearSoFar(historyOf(rows, TODAY));
  assert.equal(year.workouts, 2);
  assert.equal(year.sets, 8);
  assert.equal(year.reps, 76);
});

test('Unreadable entry: adds 2 sets and 16 reps', () => {
  const { header, row } = sheet(['Latzug']);
  const year = yearSoFar(historyOf([header, row('12.10.2026', { Latzug: ['70', '?, 9, 7'] })], TODAY));
  assert.equal(year.sets, 2);
  assert.equal(year.reps, 16);
});

test('Start of a year: no workouts', () => {
  const { header, row } = sheet(['Latzug']);
  const today = { y: 2027, m: 1, d: 2 };
  const year = yearSoFar(historyOf([header, row('2026', { Latzug: ['70', '8'] })], today));
  assert.equal(year.workouts, 0);
  assert.equal(year.mostDone, null);
  assert.equal(year.gain, null);
});

test('One exercise: the most-done exercise', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken']);
  const rows = [header];
  for (let d = 1; d <= 12; d++) rows.push(row(`${String(d).padStart(2, '0')}.10.2026`, { Latzug: ['70', '8'] }));
  rows.push(row('13.10.2026', { Bankdrücken: ['50', '10'] }));
  const year = yearSoFar(historyOf(rows, TODAY));
  assert.deepEqual(year.mostDone, { names: ['Latzug'], sessions: 12 });
});

test('Several exercises: alphabetical, not header order', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken', 'Beinpresse']);
  const rows = [header];
  for (let d = 1; d <= 12; d++) {
    rows.push(row(`${String(d).padStart(2, '0')}.10.2026`, { Latzug: ['70', '8'], Bankdrücken: ['50', '10'] }));
  }
  rows.push(row('13.10.2026', { Beinpresse: ['100', '10'] }));
  const year = yearSoFar(historyOf(rows, TODAY));
  assert.deepEqual(year.mostDone, { names: ['Bankdrücken', 'Latzug'], sessions: 12 });
});

test('Carry-over row as baseline: Latzug from 90 to 105 kg, +17%', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken']);
  const rows = [
    header,
    row('2025', { Latzug: ['60', '15'] }),
    row('01.10.2026', { Latzug: ['65', '12'], Bankdrücken: ['50', '12'] }),
    row('12.10.2026', { Latzug: ['75', '12'], Bankdrücken: ['55', '12'] }),
  ];
  assert.deepEqual(yearSoFar(historyOf(rows, TODAY)).gain, {
    name: 'Latzug',
    from: 90,
    to: 105,
    percent: 17,
  });
});

test('First session as baseline: Bankdrücken from 70 to 77 kg, +10%', () => {
  const { header, row } = sheet(['Bankdrücken']);
  const rows = [
    header,
    row('2025'),
    row('01.10.2026', { Bankdrücken: ['50', '12'] }),
    row('12.10.2026', { Bankdrücken: ['55', '12'] }),
  ];
  assert.deepEqual(yearSoFar(historyOf(rows, TODAY)).gain, {
    name: 'Bankdrücken',
    from: 70,
    to: 77,
    percent: 10,
  });
});

test('An unreadable carry-over cell: the first session is the baseline', () => {
  const { header, row } = sheet(['Bankdrücken']);
  const rows = [
    header,
    row('2025', { Bankdrücken: ['25 (Seil)', '12'] }),
    row('01.10.2026', { Bankdrücken: ['50', '12'] }),
    row('12.10.2026', { Bankdrücken: ['55', '12'] }),
  ];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain.from, 70);
});

test('A single session: no gain', () => {
  const { header, row } = sheet(['Beinpresse']);
  const rows = [header, row('2025'), row('12.10.2026', { Beinpresse: ['100', '10'] })];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain, null);
});

test('No gain: every latest session at or below its baseline', () => {
  const { header, row } = sheet(['Latzug']);
  const rows = [
    header,
    row('2025', { Latzug: ['80', '10'] }),
    row('12.10.2026', { Latzug: ['75', '10'] }),
  ];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain, null);
});

test('Assisted exercise: never the biggest gain', () => {
  const { header, row } = sheet(['Klimmzüge (assistiert)']);
  const rows = [
    header,
    row('2025', { 'Klimmzüge (assistiert)': ['30', '8'] }),
    row('01.10.2026', { 'Klimmzüge (assistiert)': ['25', '8'] }),
    row('12.10.2026', { 'Klimmzüge (assistiert)': ['20', '8'] }),
  ];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain, null);
});

test('Equal gains: the first exercise in header order wins', () => {
  const { header, row } = sheet(['Latzug', 'Bankdrücken']);
  const rows = [
    header,
    row('01.10.2026', { Latzug: ['50', '12'], Bankdrücken: ['50', '12'] }),
    row('12.10.2026', { Latzug: ['55', '12'], Bankdrücken: ['55', '12'] }),
  ];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain.name, 'Latzug');
});

// Ergometer: a timed exercise. Its two cells hold the intensity and the time.

const ERG = ['Latzug', 'Ergometer'];
const ergHistory = (...ergRows) => {
  const { header, row } = sheet(ERG);
  return historyOf([header, ...ergRows.map(([date, ...cells]) => row(date, { Ergometer: cells }))], TODAY);
};
const ergSummary = (ergRows, window = windowDays(30)) =>
  summaryOf(exerciseOf(ergHistory(...ergRows), 'Ergometer'), window);

test('Ergometer: a row with only an intensity and a time is a session and a workout', () => {
  const history = ergHistory(['12.10.2026', '8', '3:30']);
  const exercise = exerciseOf(history, 'Ergometer');
  assert.equal(exercise.timed, true);
  assert.equal(exercise.baseline, null);
  assert.equal(exercise.sessions.length, 1);
  assert.equal(exercise.sessions[0].intensity.value, 8);
  assert.equal(exercise.sessions[0].time.seconds, 210);
  assert.equal(exercise.sessions[0].readable, true);
  assert.equal(history.workouts, 1);
});

test('Ergometer intensity only: no session and no workout', () => {
  const history = ergHistory(['12.10.2026', '8', '']);
  assert.equal(exerciseOf(history, 'Ergometer').sessions.length, 0);
  assert.equal(history.workouts, 0);
});

test('Ergometer: the year so far counts workouts but no sets or reps from it', () => {
  const { header, row } = sheet(ERG);
  const rows = [
    header,
    row('12.09.2026', { Latzug: ['75', '10, 10'] }),
    row('01.10.2026', { Ergometer: ['8', '3:30'] }),
  ];
  const year = yearSoFar(historyOf(rows, TODAY));
  assert.equal(year.workouts, 2);
  assert.equal(year.sets, 2);
  assert.equal(year.reps, 20);
});

test('Ergometer can be the most-done exercise', () => {
  const year = yearSoFar(ergHistory(['01.10.2026', '8', '3:30'], ['08.10.2026', '8', '4:00']));
  assert.deepEqual(year.mostDone, { names: ['Ergometer'], sessions: 2 });
});

test('Timed exercise: Ergometer is never the biggest gain', () => {
  const { header, row } = sheet(ERG);
  const rows = [
    header,
    row('2025', { Ergometer: ['8', '3:30'] }),
    row('01.10.2026', { Ergometer: ['8', '3:30'] }),
    row('08.10.2026', { Ergometer: ['12', '10:00'] }),
  ];
  assert.equal(yearSoFar(historyOf(rows, TODAY)).gain, null);
});

test('Two sessions: the average intensity and time, and no reps or weight', () => {
  const summary = ergSummary([
    ['01.10.2026', '8', '3:30'],
    ['08.10.2026', '9', '4:00'],
  ]);
  assert.equal(summary.averageIntensity, 8.5);
  assert.equal(summary.averageTime, 225);
  assert.equal(summary.averageReps, null);
  assert.equal(summary.averageWeight, null);
});

test('Session without an intensity: the intensity average leaves it out', () => {
  const summary = ergSummary([
    ['01.10.2026', '', '3:30'],
    ['08.10.2026', '8', '4:30'],
  ]);
  assert.equal(summary.averageIntensity, 8);
  assert.equal(summary.averageTime, 240);
});

test('Rounding the time to whole seconds', () => {
  const summary = ergSummary([
    ['01.10.2026', '8', '3:40'],
    ['05.10.2026', '8', '3:40'],
    ['08.10.2026', '8', '3:41'],
  ]);
  assert.equal(summary.averageTime, 220);
});

test('No intensity at all: no intensity average', () => {
  const summary = ergSummary([['01.10.2026', '', '3:30']]);
  assert.equal(summary.averageIntensity, null);
  assert.equal(summary.averageTime, 210);
});

test('Unreadable Ergometer session: counted, left out of the averages', () => {
  const summary = ergSummary([
    ['01.10.2026', '8', '3:30'],
    ['08.10.2026', '8', '20 min'],
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.leftOut, 1);
  assert.equal(summary.averageIntensity, 8);
  assert.equal(summary.averageTime, 210);
});

test('Time per session: one point per session at its seconds', () => {
  const summary = ergSummary([
    ['01.10.2026', '8', '3:30'],
    ['13.10.2026', '8', '4:00'],
  ]);
  assert.deepEqual(summary.points, [
    { day: day(1, 10), value: 210 },
    { day: day(13, 10), value: 240 },
  ]);
});

test('Unreadable time: the session gives no point', () => {
  const summary = ergSummary([
    ['01.10.2026', '8', '3:30'],
    ['13.10.2026', '8', '20 min'],
  ]);
  assert.deepEqual(summary.points, [{ day: day(1, 10), value: 210 }]);
});

test('a weight-and-sets exercise has no intensity or time average', () => {
  const summary = latzugSummary([['12.10.2026', '70', '8']]);
  assert.equal(summary.averageIntensity, null);
  assert.equal(summary.averageTime, null);
});
