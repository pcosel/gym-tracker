// The workout screen: renders today's exercises, handles the inputs and runs
// the save queue. All text from the sheet goes in through textContent, value
// or placeholder, never as HTML.
import * as auth from './auth.js';
import { readTab, writeCells } from './api.js';
import { buildToday, initialState, cellsFor, writesFor, removeSet } from './workout.js';

const $ = (id) => document.getElementById(id);

// One entry per exercise of the header row, in header order:
// { exercise, state, shown, element }.
let items = [];
let tab = '';
let today = null;
let todayRow = null;

// Writes go out one at a time. `dirty` holds the keys of exercises whose
// on-screen values are not in the sheet yet.
const dirty = new Set();
const invalid = new Set();
let running = false;
let failure = null;
let saved = false;

const keyOf = (item) => item.exercise.weightCol;

export function initToday() {
  $('add-select').addEventListener('change', onAddExercise);
  $('save-retry').addEventListener('click', () => runQueue());
  $('save-signin').addEventListener('click', onSignInToSave);
}

export function showMissingTab(title) {
  $('tab-missing').textContent = `The tab "${title}" is missing. Add it in Google Sheets, then reload this page.`;
  $('tab-missing').hidden = false;
  $('workout').hidden = true;
}

export function startWorkout({ tab: tabTitle, rows, today: date }) {
  tab = tabTitle;
  today = date;
  const model = buildToday(rows, date);
  todayRow = model.todayRow;
  items = model.exercises.map((exercise) => ({
    exercise,
    state: initialState(exercise),
    shown: exercise.today !== null,
    element: null,
  }));
  dirty.clear();
  invalid.clear();
  running = false;
  failure = null;
  saved = false;

  $('tab-missing').hidden = true;
  $('workout').hidden = false;
  $('exercises').replaceChildren();
  for (const item of items) if (item.shown) insertExercise(item);
  renderAddChoices();
  renderStatus();
}

// ---- Rendering ----

function textInput(value, { inputmode, label, placeholder = '' }) {
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = inputmode;
  input.autocomplete = 'off';
  input.value = value;
  input.placeholder = placeholder;
  input.setAttribute('aria-label', label);
  return input;
}

function labelled(text, input) {
  const label = document.createElement('label');
  const span = document.createElement('span');
  span.textContent = text;
  label.append(span, input);
  return label;
}

function buildExercise(item) {
  const { state, exercise } = item;
  const section = document.createElement('section');
  section.className = 'exercise';
  const heading = document.createElement('h3');
  heading.textContent = exercise.name;
  section.append(heading);

  if (state.mode === 'text') {
    const weight = textInput(state.weightText, { inputmode: 'text', label: `${exercise.name} weight` });
    const reps = textInput(state.repsText, { inputmode: 'text', label: `${exercise.name} reps` });
    weight.addEventListener('input', () => { state.weightText = weight.value; });
    reps.addEventListener('input', () => { state.repsText = reps.value; });
    weight.addEventListener('change', () => onChange(item));
    reps.addEventListener('change', () => onChange(item));
    section.append(labelled('Weight', weight), labelled('Reps', reps));
    return section;
  }

  const weight = textInput(state.weight, { inputmode: 'decimal', label: `${exercise.name} weight in kg` });
  const own = [];
  weight.addEventListener('input', () => {
    state.weight = weight.value;
    for (const input of own) input.placeholder = weight.value;
  });
  weight.addEventListener('change', () => onChange(item));
  const weightRow = labelled('Weight (kg)', weight);
  weightRow.classList.add('weight');
  section.append(weightRow);

  const list = document.createElement('ol');
  list.className = 'sets';
  state.sets.forEach((set, i) => {
    const row = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'set-number';
    number.textContent = String(i + 1);
    const reps = textInput(set.reps, {
      inputmode: 'numeric',
      label: `${exercise.name} set ${i + 1} reps`,
      placeholder: set.placeholder,
    });
    const ownWeight = textInput(set.ownWeight, {
      inputmode: 'decimal',
      label: `${exercise.name} set ${i + 1} weight in kg`,
      placeholder: state.weight,
    });
    own.push(ownWeight);
    reps.addEventListener('input', () => { set.reps = reps.value; });
    ownWeight.addEventListener('input', () => { set.ownWeight = ownWeight.value; });
    reps.addEventListener('change', () => onChange(item));
    ownWeight.addEventListener('change', () => onChange(item));
    reps.dataset.field = 'reps';
    ownWeight.dataset.field = 'ownWeight';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${exercise.name} set ${i + 1}`);
    remove.addEventListener('click', () => {
      const result = removeSet(item.state, i);
      item.state = result.state;
      rebuildExercise(item);
      if (result.changed) onChange(item);
    });
    row.append(number, ownWeight, reps, remove);
    list.append(row);
  });
  section.append(list);

  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = '+ Set';
  add.addEventListener('click', () => {
    state.sets.push({ reps: '', ownWeight: '', placeholder: '' });
    rebuildExercise(item);
    const rows = item.element.querySelectorAll('.sets li');
    rows[rows.length - 1].querySelector('input[data-field="reps"]').focus();
  });
  section.append(add);
  return section;
}

function insertExercise(item) {
  item.element = buildExercise(item);
  // Keep header order: put it before the next shown exercise, if there is one.
  const after = items.slice(items.indexOf(item) + 1).find((other) => other.shown && other.element);
  $('exercises').insertBefore(item.element, after ? after.element : null);
}

function rebuildExercise(item) {
  const element = buildExercise(item);
  item.element.replaceWith(element);
  item.element = element;
}

function renderAddChoices() {
  const select = $('add-select');
  const prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Add an exercise…';
  const options = [prompt];
  items.forEach((item, index) => {
    if (item.shown) return;
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = item.exercise.name;
    options.push(option);
  });
  select.replaceChildren(...options);
  select.value = '';
}

function onAddExercise(event) {
  const index = event.target.value;
  if (index === '') return;
  const item = items[Number(index)];
  item.shown = true;
  insertExercise(item);
  renderAddChoices();
  item.element.scrollIntoView({ block: 'center' });
}

function markInvalid(item, flags) {
  const element = item.element;
  const setInputs = (field) => element.querySelectorAll(`.sets input[data-field="${field}"]`);
  const weight = element.querySelector('.weight input');
  const mark = (input, bad) => {
    if (bad) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };
  if (weight) mark(weight, flags ? flags.weight : false);
  ['reps', 'ownWeight'].forEach((field) => {
    setInputs(field).forEach((input, i) => mark(input, flags ? flags.sets[i][field] : false));
  });
}

function renderStatus() {
  const status = $('save-status');
  const retry = $('save-retry');
  const signIn = $('save-signin');
  retry.hidden = true;
  signIn.hidden = true;
  if (failure) {
    if (failure.expired) {
      status.textContent = 'Your session expired. Not saved.';
      signIn.hidden = false;
    } else {
      status.textContent = `Not saved: ${failure.message}`;
      retry.hidden = false;
    }
  } else if (running || dirty.size > 0) {
    status.textContent = 'Saving…';
  } else if (invalid.size > 0) {
    status.textContent = 'Not saved: check the marked fields.';
  } else {
    status.textContent = saved ? 'Saved' : '';
  }
}

// ---- Saving ----

function onChange(item) {
  dirty.add(keyOf(item));
  runQueue();
}

function itemForKey(key) {
  return items.find((item) => keyOf(item) === key);
}

// The row to write today's exercises into. While there is none, read the tab
// again first: a row may have been typed in the sheet since the screen loaded.
async function ensureRow() {
  if (todayRow !== null) return { row: todayRow, creating: false };
  const model = buildToday(await readTab(tab), today);
  if (model.todayRow !== null) return { row: model.todayRow, creating: false };
  return { row: model.nextRow, creating: true };
}

async function saveOne(key) {
  const item = itemForKey(key);
  const { row, creating } = await ensureRow();

  // Compute the cells only now, so edits made while reading are included. The
  // key leaves the set right before the write, so an edit made during the
  // write marks it dirty again.
  const cells = cellsFor(item.state);
  dirty.delete(key);
  if (!cells.ok) {
    invalid.add(key);
    markInvalid(item, cells.invalid);
    return;
  }
  invalid.delete(key);
  markInvalid(item, null);

  // Nothing to write yet, such as a weight changed before the first set: no
  // request, and today's row is not created.
  const writes = writesFor(item.exercise, cells, { row, creating, today });
  if (writes.length === 0) return;
  try {
    await writeCells(tab, writes);
  } catch (error) {
    dirty.add(key);
    throw error;
  }
  todayRow = row;
}

async function runQueue() {
  if (running) return;
  running = true;
  failure = null;
  renderStatus();
  try {
    while (dirty.size > 0) {
      await saveOne(dirty.values().next().value);
    }
    saved = true;
  } catch (error) {
    failure = {
      message: error.message,
      expired: error.kind === 'expired' || error.kind === 'unauthenticated',
    };
  } finally {
    running = false;
    renderStatus();
  }
}

function onSignInToSave() {
  // signIn() must start synchronously inside the tap, or the popup is blocked.
  auth.signIn().then(
    () => runQueue(),
    () => {
      // Cancelled: the button and the values stay.
    },
  );
}
