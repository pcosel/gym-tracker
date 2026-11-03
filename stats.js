// The numbers of the History page, from the year tab's rows. Pure functions
// with no DOM and no network. Dates stay {y, m, d}; day arithmetic goes through
// day numbers.
import {
  parseHeader,
  parseDate,
  hasCarryOverRow,
  parseWeight,
  parseReps,
  formatDate,
  dayNumber,
} from './sheet-format.js';
import { splitAssisted } from './workout.js';

// German collation: an umlaut sorts as its base letter, and case is ignored.
const collator = new Intl.Collator('de', { sensitivity: 'base' });

export function compareNames(a, b) {
  return collator.compare(a, b);
}

const round1 = (x) => Math.round(x * 10) / 10;

// A set's weight: its own, else the cell's, else 0.
const setWeight = (set, cellWeight) => set.weight ?? cellWeight ?? 0;

function sessionOf(date, weight, reps) {
  return {
    date,
    day: date ? dayNumber(date) : null,
    weight,
    reps,
    readable: !weight.unreadable && !reps.unreadable,
  };
}

// The tab, parsed once. Returns { workouts, exercises }. Each exercise is
// { name, weightCol, repsCol, assisted, sessions, baseline }:
// - `sessions` are the counted rows (dated from 1 January of today's year up to
//   today, the carry-over row never) whose reps cell holds at least one set,
//   readable or not, sorted by date; rows with the same date keep their order.
//   A session is { date, day, weight, reps, readable }.
// - `baseline` is the carry-over row's parsed cells, or null.
// `workouts` counts the counted rows in which any exercise has a session.
export function historyOf(rows, today) {
  const cell = (row, col) => String((rows[row - 1] && rows[row - 1][col]) ?? '');
  const header = parseHeader(rows[0] || []);
  const carryOver = hasCarryOverRow(rows);
  const firstWorkoutRow = carryOver ? 3 : 2;
  const yearStart = dayNumber({ y: today.y, m: 1, d: 1 });
  const todayDay = dayNumber(today);

  const exercises = header.map(({ name, weightCol, repsCol }) => ({
    name,
    weightCol,
    repsCol,
    assisted: splitAssisted(name).assisted,
    sessions: [],
    baseline: carryOver
      ? sessionOf(null, parseWeight(cell(2, weightCol)), parseReps(cell(2, repsCol)))
      : null,
  }));

  let workouts = 0;
  for (let row = firstWorkoutRow; row <= rows.length; row++) {
    const date = parseDate(cell(row, 0));
    if (!date) continue;
    const day = dayNumber(date);
    if (day < yearStart || day > todayDay) continue;
    let any = false;
    for (const exercise of exercises) {
      const reps = parseReps(cell(row, exercise.repsCol));
      if (reps.sets.length === 0) continue;
      exercise.sessions.push(sessionOf(date, parseWeight(cell(row, exercise.weightCol)), reps));
      any = true;
    }
    if (any) workouts++;
  }
  for (const exercise of exercises) exercise.sessions.sort((a, b) => a.day - b.day);

  return { workouts, exercises };
}

// A copy of the rows with today's row holding the cells from the tiles.
// `entries` is [{ weightCol, repsCol, weightText, repsText }]. The row for
// today is replaced, or appended when the tab has none.
export function withToday(rows, today, entries) {
  const copy = rows.slice();
  const firstWorkoutRow = hasCarryOverRow(rows) ? 3 : 2;
  let index = -1;
  for (let row = firstWorkoutRow; row <= rows.length; row++) {
    const date = parseDate(String((rows[row - 1] && rows[row - 1][0]) ?? ''));
    if (date && dayNumber(date) === dayNumber(today)) {
      index = row - 1;
      break;
    }
  }

  const todayRow = index >= 0 ? [...rows[index]] : [formatDate(today)];
  for (const { weightCol, repsCol, weightText, repsText } of entries) {
    while (todayRow.length <= Math.max(weightCol, repsCol)) todayRow.push('');
    todayRow[weightCol] = weightText;
    todayRow[repsCol] = repsText;
  }
  for (let i = 0; i < todayRow.length; i++) todayRow[i] ??= '';

  if (index >= 0) copy[index] = todayRow;
  else copy.push(todayRow);
  return copy;
}

// The window as day numbers. `choice` is { days: N } or 'year'. Returns
// { firstDay, lastDay, coveredFirstDay, coveredDays, totalDays, partial }:
// the covered part starts no earlier than 1 January, and `partial` tells
// whether the window starts before it.
export function windowOf(today, choice) {
  const lastDay = dayNumber(today);
  const yearStart = dayNumber({ y: today.y, m: 1, d: 1 });
  const firstDay = choice === 'year' ? yearStart : lastDay - (choice.days - 1);
  const coveredFirstDay = Math.max(firstDay, yearStart);
  return {
    firstDay,
    lastDay,
    coveredFirstDay,
    coveredDays: lastDay - coveredFirstDay + 1,
    totalDays: lastDay - firstDay + 1,
    partial: firstDay < yearStart,
  };
}

// Days since the exercise's latest session, or null when it has none.
export function daysSinceLastDone(exercise, today) {
  const { sessions } = exercise;
  if (sessions.length === 0) return null;
  return dayNumber(today) - sessions[sessions.length - 1].day;
}

// The exercises in list order. `direction` is 'recent' (most recently done
// first, not done this year last) or 'longest' (not done this year first, then
// the longest ago). Ties are by name, in both directions.
export function exerciseOrder(history, today, direction = 'recent') {
  const sign = direction === 'longest' ? -1 : 1;
  // Not done this year is infinitely long ago: last when ascending, first when
  // descending.
  const keyed = history.exercises.map((exercise) => ({
    exercise,
    key: daysSinceLastDone(exercise, today) ?? Infinity,
  }));
  keyed.sort((a, b) =>
    a.key === b.key ? compareNames(a.exercise.name, b.exercise.name) : sign * (a.key - b.key),
  );
  return keyed.map(({ exercise }) => exercise);
}

// The best estimated 1RM of a session (Epley: weight × (1 + reps / 30)) over
// its sets with a weight above 0 and at least 1 rep, or null.
export function estimatedMax(session) {
  if (!session || !session.readable) return null;
  let best = null;
  for (const set of session.reps.sets) {
    const weight = setWeight(set, session.weight.value);
    if (weight <= 0 || set.reps < 1) continue;
    const value = weight * (1 + set.reps / 30);
    if (best === null || value > best) best = value;
  }
  return best;
}

// The lowest assistance of a session, 0 for a set without any weight, or null
// when the session is unreadable.
export function lightestAssistance(session) {
  if (!session || !session.readable) return null;
  let best = null;
  for (const set of session.reps.sets) {
    const weight = setWeight(set, session.weight.value);
    if (best === null || weight < best) best = weight;
  }
  return best;
}

// Over the sessions in the window: { count, readableCount, leftOut,
// averageReps, averageWeight, points }. The averages are the mean of the
// per-session values over the readable sessions, rounded to one decimal, and
// null where there is nothing to average. `points` are { day, value } for the
// graph, in date order.
export function summaryOf(exercise, window) {
  const sessions = exercise.sessions.filter(
    (session) => session.day >= window.coveredFirstDay && session.day <= window.lastDay,
  );
  const readable = sessions.filter((session) => session.readable);

  const totals = readable.map((session) => {
    let reps = 0;
    let load = 0;
    for (const set of session.reps.sets) {
      reps += set.reps;
      load += set.reps * setWeight(set, session.weight.value);
    }
    return { reps, weight: reps > 0 ? load / reps : null };
  });
  const mean = (values) =>
    values.length === 0 ? null : round1(values.reduce((sum, v) => sum + v, 0) / values.length);

  const graphValue = exercise.assisted ? lightestAssistance : estimatedMax;
  const points = [];
  for (const session of sessions) {
    const value = graphValue(session);
    if (value !== null) points.push({ day: session.day, value: round1(value) });
  }

  return {
    count: sessions.length,
    readableCount: readable.length,
    leftOut: sessions.length - readable.length,
    averageReps: mean(totals.map((t) => t.reps)),
    averageWeight: mean(totals.map((t) => t.weight).filter((w) => w !== null)),
    points,
  };
}

// The year so far: { workouts, sets, reps, mostDone, gain }.
// - `sets` and `reps` count the readable sets of all sessions.
// - `mostDone` is { names, sessions } with the names in alphabetical order, or
//   null without any session.
// - `gain` is { name, from, to, percent } for the exercise whose estimated 1RM
//   grew most from its baseline (the carry-over row when it gives a value,
//   else its first session that does) to its latest later session, or null
//   without a positive gain. Assisted exercises never count.
export function yearSoFar(history) {
  let sets = 0;
  let reps = 0;
  let most = 0;
  for (const exercise of history.exercises) {
    for (const session of exercise.sessions) {
      for (const set of session.reps.sets) {
        if (set === null) continue;
        sets++;
        reps += set.reps;
      }
    }
    most = Math.max(most, exercise.sessions.length);
  }
  const mostDone =
    most === 0
      ? null
      : {
          names: history.exercises
            .filter((exercise) => exercise.sessions.length === most)
            .map((exercise) => exercise.name)
            .sort(compareNames),
          sessions: most,
        };

  let gain = null;
  for (const exercise of history.exercises) {
    if (exercise.assisted) continue;
    const valued = exercise.sessions.filter((session) => estimatedMax(session) !== null);
    let from = estimatedMax(exercise.baseline);
    let later = valued;
    if (from === null) {
      if (valued.length === 0) continue;
      from = estimatedMax(valued[0]);
      later = valued.slice(1);
    }
    if (later.length === 0) continue;
    const to = estimatedMax(later[later.length - 1]);
    const percent = Math.round(((to - from) / from) * 100);
    if (percent > 0 && (gain === null || percent > gain.percent)) {
      gain = { name: exercise.name, from: round1(from), to: round1(to), percent };
    }
  }

  return { workouts: history.workouts, sets, reps, mostDone, gain };
}
