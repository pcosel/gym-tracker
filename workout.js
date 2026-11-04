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
  parseIntensity,
  parseTime,
  formatTime,
  formatDate,
  formatWeight,
  formatSets,
} from './sheet-format.js';

const DEFAULT_SET_FIELDS = 3;
const NUMBER_PATTERN = /^\d+(?:[.,]\d+)?$/;
const WHOLE_PATTERN = /^\d+$/;

// An exercise name split at its "(assistiert)" marker: `base` is the name with
// every marker removed, ignoring case, spaces collapsed and trimmed, and
// `assisted` tells whether there was one.
export function splitAssisted(name) {
  const base = name.replace(/\(assistiert\)/gi, ' ').replace(/\s+/g, ' ').trim();
  return { base, assisted: /\(assistiert\)/i.test(name) };
}

// `rows` is the tab as read: index i is sheet row i + 1. Returns
// { todayRow, nextRow, lastWorkoutRow, exercises }, where todayRow is a 1-based
// row number or null, and nextRow the first row below every row that holds any
// value. lastWorkoutRow is the lowest dated row above today's row (or the
// lowest of all) with reps for any exercise, or null; the carry-over row never
// counts. Each exercise is { name, weightCol, repsCol, timed, assisted, today,
// last, doneLastWorkout }. `today` is null when today's row has neither a
// weight nor reps for it. `doneLastWorkout` tells whether its reps cell in
// lastWorkoutRow holds any set, readable or not. `last` is the entry of the
// exercise's last time (see `read`), plus `date` ({ y, m, d } from column A)
// for a workout row, or plus `carryOver: true` and `year` (the number in A2)
// for the carry-over row. A timed exercise (Ergometer) holds an intensity and
// a time in its two columns: its entries have `intensity` and `time` (from
// parseIntensity and parseTime) in place of `weight` and `reps`, it is done in
// a row when the time cell is not empty, and its last time needs a readable
// time.
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

  const read = (row, { weightCol, repsCol, timed }) => {
    const weightText = cell(row, weightCol);
    const repsText = cell(row, repsCol);
    if (timed) {
      return {
        row,
        weightText,
        repsText,
        intensity: parseIntensity(weightText),
        time: parseTime(repsText),
      };
    }
    return {
      row,
      weightText,
      repsText,
      weight: parseWeight(weightText),
      reps: parseReps(repsText),
    };
  };
  const hasReadable = (entry, { timed }) =>
    timed
      ? entry.time.seconds !== null && !entry.time.unreadable
      : entry.reps.sets.some((set) => set !== null);
  const hasEntry = (row, { repsCol, timed }) =>
    timed ? cell(row, repsCol).trim() !== '' : parseReps(cell(row, repsCol)).sets.length > 0;

  const header = parseHeader(rows[0] || []);
  const start = todayRow !== null ? todayRow - 1 : rows.length;

  let lastWorkoutRow = null;
  for (let row = start; row >= firstWorkoutRow && lastWorkoutRow === null; row--) {
    if (!parseDate(cell(row, 0))) continue;
    if (header.some((exercise) => hasEntry(row, exercise))) lastWorkoutRow = row;
  }

  const exercises = header.map((exercise) => {
    const { name, weightCol, repsCol, timed } = exercise;
    let todayEntry = null;
    if (todayRow !== null) {
      const entry = read(todayRow, exercise);
      if (entry.weightText.trim() !== '' || entry.repsText.trim() !== '') todayEntry = entry;
    }

    let last = null;
    for (let row = start; row >= firstWorkoutRow && last === null; row--) {
      if (!parseDate(cell(row, 0))) continue;
      const entry = read(row, exercise);
      if (hasReadable(entry, exercise)) last = { ...entry, date: parseDate(cell(row, 0)) };
    }
    if (last === null && carryOver) {
      const entry = read(2, exercise);
      if (hasReadable(entry, exercise)) last = { ...entry, carryOver: true, year: Number(cell(2, 0).trim()) };
    }

    return {
      name,
      weightCol,
      repsCol,
      timed,
      assisted: splitAssisted(name).assisted,
      today: todayEntry,
      last,
      doneLastWorkout: lastWorkoutRow !== null && hasEntry(lastWorkoutRow, exercise),
    };
  });

  return { todayRow, nextRow, lastWorkoutRow, exercises };
}

// The editor's starting state for one exercise, with everything as the text
// of its input. In 'text' mode (an unreadable cell today) the two cells' text
// is edited as it is. In 'sets' mode there is the exercise weight and one
// field per set, each with its reps, its own weight (empty = follows the
// exercise weight) and a placeholder from last time. A timed exercise has the
// 'timed' mode instead: an intensity (today's, else last time's), today's time
// as m:ss, and last time's time as the time field's placeholder. Its text mode,
// for an unreadable intensity or time today, is the same as the other.
export function initialState({ today, last, timed = false }) {
  if (timed) {
    if (today && (today.intensity.unreadable || today.time.unreadable)) {
      return { mode: 'text', weightText: today.weightText, repsText: today.repsText };
    }
    let intensity = '';
    if (today && today.intensity.value !== null) intensity = String(today.intensity.value);
    else if (last && last.intensity.value !== null) intensity = String(last.intensity.value);
    return {
      mode: 'timed',
      intensity,
      time: today && today.time.seconds !== null ? formatTime(today.time.seconds) : '',
      placeholder: last && last.time.seconds !== null ? formatTime(last.time.seconds) : '',
    };
  }

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

// What a time field shows for the text typed into it, as { text, seconds,
// invalid }. Only the digits count and leading zeros are dropped. The last two
// digits are the seconds and the rest the minutes, so "4", "41" and "415" give
// "0:04", "0:41" and "4:15". Seconds above 59 stay visible but are invalid, with
// no `seconds`. No digits give an empty field, neither a time nor invalid.
// Formatting its own result changes nothing, so an unchanged field stays valid
// and deleting the last digit of "4:15" gives "0:41".
export function formatTimeInput(input) {
  const digits = String(input ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits === '') return { text: '', seconds: null, invalid: false };
  const padded = digits.padStart(3, '0');
  const minutes = Number(padded.slice(0, -2));
  const seconds = Number(padded.slice(-2));
  const text = `${minutes}:${padded.slice(-2)}`;
  if (seconds > 59) return { text, seconds: null, invalid: true };
  return { text, seconds: minutes * 60 + seconds, invalid: false };
}

// The cells to write for an exercise's state: { ok: true, weightText,
// repsText }, or { ok: false, invalid } with invalid = { weight, sets: [{
// reps, ownWeight }] } flagging the fields to mark. Fields that hold no reps
// are left out, and so are their own weights, which only come from prefill.
// With no reps at all, both cells are empty: a weight alone is not saved. In
// 'timed' mode, invalid = { intensity, time }, the cells are the intensity and
// the time as m:ss, and without a time both are empty.
export function cellsFor(state) {
  if (state.mode === 'text') {
    return { ok: true, weightText: state.weightText, repsText: state.repsText };
  }

  if (state.mode === 'timed') {
    const intensityInput = state.intensity.trim();
    const time = formatTimeInput(state.time);
    const invalid = {
      intensity: intensityInput !== '' && !WHOLE_PATTERN.test(intensityInput),
      time: time.invalid,
    };
    if (invalid.intensity || invalid.time) return { ok: false, invalid };
    if (time.seconds === null) return { ok: true, weightText: '', repsText: '' };
    return { ok: true, weightText: intensityInput, repsText: formatTime(time.seconds) };
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

// The fields to mark for an exercise's state: cellsFor's `invalid` flags, or
// null when nothing is invalid. While the user types (`typing`), a weight that
// is digits plus its decimal separator, such as "7,", counts as its digits: it
// is on its way to "7,5" and is marked only once the field is left.
export function invalidFields(state, { typing = false } = {}) {
  const cells = cellsFor(typing ? withoutTrailingSeparators(state) : state);
  return cells.ok ? null : cells.invalid;
}

const TRAILING_SEPARATOR_PATTERN = /^(\d+)[.,]$/;

function withoutTrailingSeparators(state) {
  if (state.mode !== 'sets') return state;
  const spare = (text) => text.trim().replace(TRAILING_SEPARATOR_PATTERN, '$1');
  return {
    ...state,
    weight: spare(state.weight),
    sets: state.sets.map((set) => ({ ...set, ownWeight: spare(set.ownWeight) })),
  };
}

// The state without the set field at `index`. `changed` tells whether the
// cells change, which is only so when that field held reps: fields without
// reps are not part of the cells.
export function removeSet(state, index) {
  return {
    state: { ...state, sets: state.sets.filter((_, i) => i !== index) },
    changed: state.sets[index].reps.trim() !== '',
  };
}

// The writes for one save of an exercise, as writeCells takes them: its two
// cells in `row`, after today's date in column A when the save creates the
// row. A save that would create the row with both cells empty writes nothing,
// so the row only appears with the first value.
export function writesFor({ weightCol }, { weightText, repsText }, { row, creating, today }) {
  if (creating && weightText === '' && repsText === '') return [];
  const writes = [{ row, col: weightCol, values: [weightText, repsText] }];
  if (creating) writes.unshift({ row, col: 0, values: [formatDate(today)] });
  return writes;
}

// One label per exercise name, in header order: the first letter and a second
// letter, so that no two labels are equal ignoring case. Only letters count.
// When the first two letters are taken, the first letter is paired with each
// later letter in turn; when none is free, the first pair stays. A name for
// which `hasIcon` is true gets null and takes no label.
export function tileLabels(names, hasIcon = () => false) {
  const taken = new Set();
  return names.map((name) => {
    if (hasIcon(name)) return null;
    const letters = [...name].filter((char) => /\p{L}/u.test(char));
    if (letters.length === 0) {
      const label = [...name].slice(0, 2).join('');
      taken.add(label.toLowerCase());
      return label;
    }
    const pairOf = (second) => letters[0].toUpperCase() + second.toLowerCase();
    if (letters.length === 1) {
      const label = letters[0].toUpperCase();
      taken.add(label.toLowerCase());
      return label;
    }
    let label = pairOf(letters[1]);
    for (let i = 1; i < letters.length; i++) {
      const candidate = pairOf(letters[i]);
      if (!taken.has(candidate.toLowerCase())) {
        label = candidate;
        break;
      }
    }
    taken.add(label.toLowerCase());
    return label;
  });
}

// 'none' | 'done' | 'improved' for the cells an exercise has or would save
// today, against its `last` entry from buildToday. Done means at least one set
// in the reps cell, readable or not. Improved means more reps: each time's
// reps are added up per weight and compared from the heaviest weight down
// (from the lightest for an assisted exercise, where the weight is the help
// it got). At the first entry that differs the better weight wins, or at the
// same weight the larger total; when one list ends first, the other wins.
// Nothing is compared when a cell is unreadable today or last time.
export function progressOf({ weightText, repsText }, last, assisted = false) {
  const reps = parseReps(repsText);
  if (reps.sets.length === 0) return 'none';
  const weight = parseWeight(weightText);
  if (!last || weight.unreadable || reps.unreadable) return 'done';
  if (last.weight.unreadable || last.reps.unreadable) return 'done';

  const totals = (sets, cellWeight) => {
    const perWeight = new Map();
    for (const set of sets) {
      const w = set.weight ?? cellWeight ?? 0;
      perWeight.set(w, (perWeight.get(w) ?? 0) + set.reps);
    }
    const direction = assisted ? 1 : -1;
    return [...perWeight].sort((a, b) => direction * (a[0] - b[0]));
  };
  const now = totals(reps.sets, weight.value);
  const then = totals(last.reps.sets, last.weight.value);

  for (let i = 0; i < Math.max(now.length, then.length); i++) {
    if (i >= then.length) return 'improved';
    if (i >= now.length) return 'done';
    const [nowWeight, nowReps] = now[i];
    const [thenWeight, thenReps] = then[i];
    if (nowWeight !== thenWeight) {
      const better = assisted ? nowWeight < thenWeight : nowWeight > thenWeight;
      return better ? 'improved' : 'done';
    }
    if (nowReps !== thenReps) return nowReps > thenReps ? 'improved' : 'done';
  }
  return 'done';
}

// 'none' | 'done' | 'improved' for a timed exercise's cells today, against its
// `last` entry from buildToday. Done means a time in the time cell, readable or
// not. Improved means a higher intensity, with an empty intensity as 0, or the
// same intensity and a longer time. Nothing is compared when a cell is
// unreadable today or last time.
export function timedProgressOf({ weightText, repsText }, last) {
  if (String(repsText ?? '').trim() === '') return 'none';
  const intensity = parseIntensity(weightText);
  const time = parseTime(repsText);
  if (!last || intensity.unreadable || time.unreadable) return 'done';
  if (last.intensity.unreadable || last.time.unreadable) return 'done';

  const nowIntensity = intensity.value ?? 0;
  const thenIntensity = last.intensity.value ?? 0;
  if (nowIntensity !== thenIntensity) return nowIntensity > thenIntensity ? 'improved' : 'done';
  return time.seconds > last.time.seconds ? 'improved' : 'done';
}
