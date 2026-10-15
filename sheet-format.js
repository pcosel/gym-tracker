// How the gym sheet is laid out and written. Pure functions with no DOM and no
// network, so Node's test runner can cover them.

const DATE_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const WEIGHT_PATTERN = /^\d+(?:[.,]\d+)?$/;
const SET_PATTERN = /^(\d+)(?:\s*@\s*(\d+(?:\.\d+)?))?$/;

// The exercises of row 1: each is a weight column followed by a reps column,
// starting at column B. A pair with an empty name above the weight column is
// not an exercise. Merged cells only keep their text in the first column, so
// the reps column is always the weight column + 1.
export function parseHeader(row1 = []) {
  const exercises = [];
  for (let col = 1; col < row1.length; col += 2) {
    const name = String(row1[col] ?? '').trim();
    if (name) exercises.push({ name, weightCol: col, repsCol: col + 1 });
  }
  return exercises;
}

// A date as day.month.year, or null. Dates stay {y, m, d} and never go
// through Date, so time zones cannot shift them.
export function parseDate(text) {
  const match = DATE_PATTERN.exec(String(text ?? '').trim());
  if (!match) return null;
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

export function formatDate({ y, m, d }) {
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${String(y).padStart(4, '0')}`;
}

export function sameDate(a, b) {
  return Boolean(a && b) && a.y === b.y && a.m === b.m && a.d === b.d;
}

export function dateOf(jsDate) {
  return { y: jsDate.getFullYear(), m: jsDate.getMonth() + 1, d: jsDate.getDate() };
}

// Row 2 is the carry-over row when its column A holds a four-digit year.
export function hasCarryOverRow(rows) {
  const cell = rows[1] && rows[1][0];
  return /^\d{4}$/.test(String(cell ?? '').trim());
}

// { value: number | null, unreadable: boolean }. An empty cell has no value
// and is not unreadable.
export function parseWeight(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return { value: null, unreadable: false };
  if (!WEIGHT_PATTERN.test(trimmed)) return { value: null, unreadable: true };
  return { value: Number(trimmed.replace(',', '.')), unreadable: false };
}

// { sets, unreadable }. `sets` has one entry per non-empty position: either
// { reps, weight } with weight null for "the exercise weight", or null for an
// entry that does not follow the notation. The cell is unreadable when any
// entry is.
export function parseReps(text) {
  const sets = String(text ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .map((entry) => {
      const match = SET_PATTERN.exec(entry);
      if (!match) return null;
      return { reps: Number(match[1]), weight: match[2] === undefined ? null : Number(match[2]) };
    });
  return { sets, unreadable: sets.some((set) => set === null) };
}

export function formatWeight(value) {
  return String(value);
}

// `@weight` only on sets whose weight differs from the exercise weight.
export function formatSets(sets, weight) {
  return sets
    .map((set) => {
      const own = set.weight !== null && set.weight !== undefined && set.weight !== weight;
      return own ? `${set.reps}@${formatWeight(set.weight)}` : String(set.reps);
    })
    .join(', ');
}

// 0 -> A, 25 -> Z, 26 -> AA.
export function columnLetter(index) {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

// A tab title as it starts an A1 range: in single quotes, with any quote in
// the title doubled.
export function quoteTab(title) {
  return `'${title.replace(/'/g, "''")}'`;
}

// A1 range on a tab, such as 'Tab'!Z14:AA14.
export function rangeFor(tab, row, fromCol, toCol = fromCol) {
  const quoted = quoteTab(tab);
  const from = `${columnLetter(fromCol)}${row}`;
  return toCol === fromCol ? `${quoted}!${from}` : `${quoted}!${from}:${columnLetter(toCol)}${row}`;
}
