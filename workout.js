// Today's workout from the year tab's rows: which exercises are shown, what
// the editor starts with, and which cells an edit writes. Pure functions with
// no DOM and no network.
import {
  parseHeader,
  parseDate,
  sameDate,
  hasCarryOverRow,
  parseWeight,
  parseReps,
  formatWeight,
  formatSets,
} from './sheet-format.js';

const DEFAULT_SET_FIELDS = 3;
const NUMBER_PATTERN = /^\d+(?:[.,]\d+)?$/;
const WHOLE_PATTERN = /^\d+$/;

// `rows` is the tab as read: index i is sheet row i + 1. Returns
// { todayRow, nextRow, exercises }, where todayRow is a 1-based row number or
// null, and nextRow the first row below every row that holds any value. Each
// exercise is { name, weightCol, repsCol, today, last }. `today` is null when
// today's row has neither a weight nor reps for it.
export function buildToday(rows, today) {
  const cell = (row, col) => String((rows[row - 1] && rows[row - 1][col]) ?? '');
  const carryOver = hasCarryOverRow(rows);
  const firstWorkoutRow = carryOver ? 3 : 2;

  let todayRow = null;
  for (let row = firstWorkoutRow; row <= rows.length; row++) {
    if (sameDate(parseDate(cell(row, 0)), today)) {
      todayRow = row;
      break;
    }
  }
  const nextRow = rows.length + 1;

  const read = (row, weightCol, repsCol) => {
    const weightText = cell(row, weightCol);
    const repsText = cell(row, repsCol);
    return {
      row,
      weightText,
      repsText,
      weight: parseWeight(weightText),
      reps: parseReps(repsText),
    };
  };
  const hasReadableSet = (entry) => entry.reps.sets.some((set) => set !== null);

  const exercises = parseHeader(rows[0] || []).map(({ name, weightCol, repsCol }) => {
    let todayEntry = null;
    if (todayRow !== null) {
      const entry = read(todayRow, weightCol, repsCol);
      if (entry.weightText.trim() !== '' || entry.repsText.trim() !== '') todayEntry = entry;
    }

    let last = null;
    const start = todayRow !== null ? todayRow - 1 : rows.length;
    for (let row = start; row >= firstWorkoutRow && last === null; row--) {
      if (!parseDate(cell(row, 0))) continue;
      const entry = read(row, weightCol, repsCol);
      if (hasReadableSet(entry)) last = entry;
    }
    if (last === null && carryOver) {
      const entry = read(2, weightCol, repsCol);
      if (hasReadableSet(entry)) last = { ...entry, carryOver: true };
    }

    return { name, weightCol, repsCol, today: todayEntry, last };
  });

  return { todayRow, nextRow, exercises };
}

// The editor's starting state for one exercise, with everything as the text
// of its input. In 'text' mode (an unreadable cell today) the two cells' text
// is edited as it is. In 'sets' mode there is the exercise weight and one
// field per set, each with its reps, its own weight (empty = follows the
// exercise weight) and a placeholder from last time.
export function initialState({ today, last }) {
  if (today && (today.weight.unreadable || today.reps.unreadable)) {
    return { mode: 'text', weightText: today.weightText, repsText: today.repsText };
  }

  const todaySets = today ? today.reps.sets : [];
  const lastSets = last ? last.reps.sets : [];

  let weight = '';
  if (today && today.weight.value !== null) weight = formatWeight(today.weight.value);
  else if (last && last.weight.value !== null) weight = formatWeight(last.weight.value);

  const count = Math.max(DEFAULT_SET_FIELDS, lastSets.length, todaySets.length);
  const sets = [];
  for (let i = 0; i < count; i++) {
    const own = (set) => (set && set.weight !== null ? formatWeight(set.weight) : '');
    if (todaySets[i]) {
      sets.push({ reps: String(todaySets[i].reps), ownWeight: own(todaySets[i]), placeholder: '' });
    } else {
      const lastSet = lastSets[i];
      sets.push({
        reps: '',
        ownWeight: own(lastSet),
        placeholder: lastSet ? String(lastSet.reps) : '',
      });
    }
  }
  return { mode: 'sets', weight, sets };
}

function toNumber(text) {
  return Number(text.replace(',', '.'));
}

// The cells to write for an exercise's state: { ok: true, weightText,
// repsText }, or { ok: false, invalid } with invalid = { weight, sets: [{
// reps, ownWeight }] } flagging the fields to mark. Fields that hold no reps
// are left out, and so are their own weights, which only come from prefill.
// With no reps at all, both cells are empty: a weight alone is not saved.
export function cellsFor(state) {
  if (state.mode === 'text') {
    return { ok: true, weightText: state.weightText, repsText: state.repsText };
  }

  const weightInput = state.weight.trim();
  const invalid = { weight: false, sets: state.sets.map(() => ({ reps: false, ownWeight: false })) };
  let weight = null;
  if (weightInput !== '') {
    if (NUMBER_PATTERN.test(weightInput)) weight = toNumber(weightInput);
    else invalid.weight = true;
  }

  const sets = [];
  state.sets.forEach((field, i) => {
    const repsInput = field.reps.trim();
    if (repsInput === '') return;
    let reps = null;
    let ownWeight = null;
    if (WHOLE_PATTERN.test(repsInput)) reps = Number(repsInput);
    else invalid.sets[i].reps = true;
    const ownInput = field.ownWeight.trim();
    if (ownInput !== '') {
      if (NUMBER_PATTERN.test(ownInput)) ownWeight = toNumber(ownInput);
      else invalid.sets[i].ownWeight = true;
    }
    sets.push({ reps, weight: ownWeight });
  });

  if (invalid.weight || invalid.sets.some((set) => set.reps || set.ownWeight)) {
    return { ok: false, invalid };
  }
  // An exercise without any reps leaves both cells empty, even with a weight.
  if (sets.length === 0) return { ok: true, weightText: '', repsText: '' };
  return {
    ok: true,
    weightText: weight === null ? '' : formatWeight(weight),
    repsText: formatSets(sets, weight),
  };
}
