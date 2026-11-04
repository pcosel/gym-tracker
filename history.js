// The History page: the overview (year so far, exercises by days since last
// done) and one exercise's detail. It only renders what stats.js computes. All
// text from the sheet goes in through textContent, never as HTML.
import { iconFor } from './icons.js';
import { buildIcon, svgElement } from './svg.js';
import { formatDate, formatWeight, formatTime, fromDayNumber } from './sheet-format.js';
import {
  historyOf,
  exerciseOrder,
  daysSinceLastDone,
  windowOf,
  summaryOf,
  yearSoFar,
} from './stats.js';

const $ = (id) => document.getElementById(id);

// Both last until the page reloads.
let windowChoice = { days: 30 };
let direction = 'recent';

const PRESETS = [
  { label: '30 days', choice: { days: 30 } },
  { label: '90 days', choice: { days: 90 } },
  { label: 'This year', choice: 'year' },
];

// One path per icon, in the style of the exercise icons: an arrow beside three
// bars of falling length.
const ORDERS = {
  recent: { label: 'Most recent first', d: 'M6 4v14 M2.5 14.5L6 18l3.5-3.5 M13 6h8 M13 12h6 M13 18h4' },
  longest: { label: 'Longest ago first', d: 'M6 20V6 M2.5 9.5L6 6l3.5 3.5 M13 6h8 M13 12h6 M13 18h4' },
};

function el(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Renders the overview, or the detail when `name` is one of the exercises.
export function showHistory({ rows, today, name }) {
  const data = historyOf(rows, today);
  const exercise = name === undefined ? undefined : data.exercises.find((e) => e.name === name);
  $('history').replaceChildren(exercise ? buildDetail(exercise, today) : buildOverview(data, today));
}

function lastDoneText(days) {
  if (days === null) return 'not done this year';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ---- Overview ----

function buildOverview(data, today) {
  const root = el('div');
  root.append(buildYear(data, today), buildList(data, today));
  return root;
}

function buildYear(data, today) {
  const section = el('section', undefined, 'year');
  section.append(el('h3', 'Year so far'));
  const year = yearSoFar(data);
  if (year.workouts === 0) {
    section.append(el('p', `No workouts in ${today.y} yet.`));
    return section;
  }
  section.append(
    el('p', `${plural(year.workouts, 'workout', 'workouts')}, ${plural(year.sets, 'set', 'sets')}, ${plural(year.reps, 'rep', 'reps')}`),
  );
  const { names, sessions } = year.mostDone;
  section.append(
    el('p', `Most done: ${names.join(', ')}, ${plural(sessions, 'session', 'sessions')}${names.length > 1 ? ' each' : ''}`),
  );
  const { gain } = year;
  section.append(
    el(
      'p',
      gain
        ? `Biggest gain: ${gain.name}, estimated 1RM from ${formatWeight(gain.from)} kg to ${formatWeight(gain.to)} kg, +${gain.percent}%`
        : 'Biggest gain: no gain yet',
    ),
  );
  return section;
}

function buildList(data, today) {
  const section = el('section', undefined, 'exercise-list');
  const head = el('div', undefined, 'list-head');
  const list = el('ul');

  const order = el('button');
  order.type = 'button';
  order.className = 'order';
  const renderOrder = () => {
    const { label, d } = ORDERS[direction];
    order.setAttribute('aria-label', label);
    order.title = label;
    order.replaceChildren(buildIcon({ d }));
  };
  const renderList = () => {
    list.replaceChildren(
      ...exerciseOrder(data, today, direction).map((exercise) => {
        const item = el('li');
        const link = el('a');
        link.href = `#history/${encodeURIComponent(exercise.name)}`;
        const icon = iconFor(exercise.name);
        if (icon) {
          const wrap = el('span', undefined, 'icon');
          wrap.append(buildIcon(icon));
          link.append(wrap);
        }
        link.append(
          el('span', exercise.name, 'name'),
          el('span', lastDoneText(daysSinceLastDone(exercise, today)), 'last-done'),
        );
        item.append(link);
        return item;
      }),
    );
  };
  // The button stays outside the list, so it keeps focus when the list changes.
  order.addEventListener('click', () => {
    direction = direction === 'recent' ? 'longest' : 'recent';
    renderOrder();
    renderList();
  });
  renderOrder();
  renderList();

  head.append(el('h3', 'Exercises'), order);
  section.append(head, list);
  return section;
}

// ---- Detail ----

const sameChoice = (a, b) => (a === 'year' || b === 'year' ? a === b : a.days === b.days);

const isCustom = (choice) => !PRESETS.some((preset) => sameChoice(preset.choice, choice));

function windowLabel(choice) {
  if (choice === 'year') return 'this year';
  return choice.days === 1 ? 'today' : `in the last ${choice.days} days`;
}

function buildDetail(exercise, today) {
  const root = el('div', undefined, 'detail');

  const head = el('div', undefined, 'detail-head');
  // A link, not a button, so it does not read as one of the window buttons. The
  // href is only a fallback for when the click is not handled.
  const back = el('a', undefined, 'back');
  back.href = '#history';
  back.setAttribute('aria-label', 'Back');
  back.append(buildIcon({ d: 'M15 5l-7 7 7 7' }));
  back.addEventListener('click', (event) => {
    event.preventDefault();
    window.history.back();
  });
  head.append(back, el('h3', exercise.name));

  const results = el('div', undefined, 'results');
  const controls = el('div', undefined, 'window');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Window');

  const buttons = PRESETS.map(({ label, choice }) => {
    const button = el('button', label);
    button.type = 'button';
    button.addEventListener('click', () => {
      field.removeAttribute('aria-invalid');
      field.value = '';
      apply(choice);
    });
    return { button, choice };
  });

  const field = document.createElement('input');
  field.type = 'text';
  field.inputMode = 'numeric';
  field.autocomplete = 'off';
  field.value = isCustom(windowChoice) ? String(windowChoice.days) : '';
  field.addEventListener('change', () => {
    const text = field.value.trim();
    if (text === '') {
      field.removeAttribute('aria-invalid');
      return;
    }
    const days = Number(text);
    if (/^\d+$/.test(text) && Number.isSafeInteger(days) && days >= 1) {
      field.removeAttribute('aria-invalid');
      apply({ days });
    } else {
      field.setAttribute('aria-invalid', 'true');
    }
  });
  const label = el('label');
  label.append(el('span', 'Days'), field);

  function apply(choice) {
    windowChoice = choice;
    renderControls();
    results.replaceChildren(...buildResults(exercise, today));
  }
  function renderControls() {
    for (const { button, choice } of buttons) {
      button.setAttribute('aria-pressed', String(sameChoice(choice, windowChoice)));
    }
  }

  controls.append(...buttons.map(({ button }) => button), label);
  renderControls();
  results.replaceChildren(...buildResults(exercise, today));
  root.append(head, controls, results);
  return root;
}

function buildResults(exercise, today) {
  const win = windowOf(today, windowChoice);
  const summary = summaryOf(exercise, win);
  const nodes = [];

  if (win.partial) {
    nodes.push(
      el(
        'p',
        `Only ${win.coveredDays} of the last ${win.totalDays} days are covered, those since ${formatDate(fromDayNumber(win.coveredFirstDay))}. Earlier workouts are in the tab "${today.y - 1}", which the history does not read.`,
        'note',
      ),
    );
  }

  const times =
    summary.count === 0 ? 'Not done' : summary.count === 1 ? 'Done once' : `Done ${summary.count} times`;
  nodes.push(
    el('p', `${times} ${windowLabel(windowChoice)}`, 'frequency'),
    el('p', `Last done: ${lastDoneText(daysSinceLastDone(exercise, today))}`),
  );

  if (summary.count > 0) {
    if (summary.readableCount === 0) {
      nodes.push(el('p', 'No session in this window is readable, so there are no averages.', 'note'));
    } else {
      const list = el('dl', undefined, 'averages');
      const add = (term, value) => {
        const row = el('div');
        row.append(el('dt', term), el('dd', value));
        list.append(row);
      };
      if (exercise.timed) {
        if (summary.averageIntensity !== null) {
          add('Intensity per session', formatWeight(summary.averageIntensity));
        }
        add('Time per session', formatTime(summary.averageTime));
      } else {
        add('Reps per session', formatWeight(summary.averageReps));
      }
      if (summary.averageWeight !== null) {
        add(
          exercise.assisted ? 'Assistance per session' : 'Weight per session',
          `${formatWeight(summary.averageWeight)} kg`,
        );
      }
      nodes.push(list);
      if (summary.leftOut > 0) {
        nodes.push(
          el(
            'p',
            `${plural(summary.leftOut, 'session', 'sessions')} with unreadable cells ${summary.leftOut === 1 ? 'is' : 'are'} left out.`,
            'note',
          ),
        );
      }
    }
  }

  if (summary.points.length >= 2) {
    const measure = measureOf(exercise);
    nodes.push(el('p', measure.caption, 'caption'), buildGraph(summary.points, win, measure));
  } else {
    nodes.push(el('p', 'There is not enough data for a graph in this window.', 'note'));
  }
  return nodes;
}

// ---- Graph ----

const dateOf = (day) => formatDate(fromDayNumber(day));

// What a graph plots: `name` and `caption` for its text, `format` for its
// values, and `unit` after each value in the accessible name.
function measureOf(exercise) {
  if (exercise.timed) {
    return { name: 'Time per session', caption: 'Time per session', format: formatTime, unit: '' };
  }
  if (exercise.assisted) {
    return {
      name: 'Assistance',
      caption: 'Assistance (kg), lower is better',
      format: formatWeight,
      unit: ' kg',
    };
  }
  return { name: 'Estimated 1RM', caption: 'Estimated 1RM (kg)', format: formatWeight, unit: ' kg' };
}

function buildGraph(points, win, { name, format, unit }) {
  const width = 320;
  const height = 180;
  const left = 44;
  const right = 12;
  const top = 14;
  const bottom = 30;

  const first = win.coveredFirstDay;
  const span = Math.max(1, win.lastDay - first);
  const values = points.map((point) => point.value);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  let min = lowest;
  let max = highest;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.1;
  min -= pad;
  max += pad;
  const x = (day) => left + ((day - first) / span) * (width - left - right);
  const y = (value) => top + (1 - (value - min) / (max - min)) * (height - top - bottom);

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const svg = svgElement('svg', {
    class: 'graph',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `${name} over ${points.length} sessions, from ${format(firstPoint.value)}${unit} on ${dateOf(firstPoint.day)} to ${format(lastPoint.value)}${unit} on ${dateOf(lastPoint.day)}`,
  });
  svg.append(
    svgElement('path', {
      class: 'axis',
      d: `M${left} ${top}V${height - bottom}H${width - right}`,
      fill: 'none',
    }),
    svgElement('polyline', {
      class: 'line',
      points: points.map((point) => `${x(point.day)},${y(point.value)}`).join(' '),
      fill: 'none',
    }),
  );
  for (const point of points) {
    svg.append(svgElement('circle', { class: 'point', cx: x(point.day), cy: y(point.value), r: 3 }));
  }

  const label = (text, attributes) => {
    const node = svgElement('text', attributes);
    node.textContent = text;
    return node;
  };
  svg.append(label(format(highest), { x: left - 6, y: y(highest), dy: '0.35em', 'text-anchor': 'end' }));
  if (lowest !== highest) {
    svg.append(label(format(lowest), { x: left - 6, y: y(lowest), dy: '0.35em', 'text-anchor': 'end' }));
  }
  svg.append(
    label(dateOf(first).slice(0, 6), { x: left, y: height - 8, 'text-anchor': 'start' }),
    label(dateOf(win.lastDay).slice(0, 6), { x: width - right, y: height - 8, 'text-anchor': 'end' }),
  );
  return svg;
}
