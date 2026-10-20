import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICONS, iconFor } from '../icons.js';

const NAMES = [
  'Bankdrücken', 'Bauchmaschine', 'Rückenheben', 'Bizepsmaschine', 'Seitheber', 'Schulterpresse',
  'Trizepspull', 'Ruderzug', 'Butterfly', 'Beinpresse', 'Klimmzüge', 'Beinstrecker', 'Latzug',
  'Duale Schulterpresse', 'Brustpresse', 'Crunchmaschine',
];

test('Exercise with an icon: each of the 16 names has its own entry', () => {
  assert.deepEqual(Object.keys(ICONS).sort(), [...NAMES].sort());
  for (const name of NAMES) assert.equal(iconFor(name), ICONS[name], name);
});

test('Different case: the name is matched ignoring case', () => {
  assert.equal(iconFor('LATZUG'), ICONS.Latzug);
});

test('Assisted exercise: the marker does not change the icon', () => {
  assert.equal(iconFor('Latzug (assistiert)'), ICONS.Latzug);
});

test('Assisted Klimmzüge: the variant with the arrow', () => {
  assert.equal(iconFor('Klimmzüge (assistiert)'), ICONS['Klimmzüge'].assisted);
});

test('Marker in another case: the variant with the arrow', () => {
  assert.equal(iconFor('Klimmzüge (Assistiert)'), ICONS['Klimmzüge'].assisted);
});

test('Klimmzüge without assistance: the drawing without the arrow', () => {
  assert.equal(iconFor('Klimmzüge'), ICONS['Klimmzüge']);
  assert.notEqual(iconFor('Klimmzüge'), ICONS['Klimmzüge'].assisted);
});

test('Only Klimmzüge has an assisted variant', () => {
  const withVariant = Object.keys(ICONS).filter((name) => ICONS[name].assisted);
  assert.deepEqual(withVariant, ['Klimmzüge']);
});

test('A name with a decomposed umlaut is found', () => {
  const decomposed = 'Rückenheben';
  assert.notEqual(decomposed, 'Rückenheben');
  assert.equal(iconFor(decomposed), ICONS['Rückenheben']);
});

test('Different spelling: no icon', () => {
  assert.equal(iconFor('Klimmzug'), null);
  assert.equal(iconFor('Kniebeuge'), null);
});

const drawings = [];
for (const name of NAMES) {
  drawings.push([name, ICONS[name]]);
  if (ICONS[name].assisted) drawings.push([`${name} (assistiert)`, ICONS[name].assisted]);
}

test('Every icon is different', () => {
  const paths = drawings.map(([, icon]) => icon.d);
  assert.equal(new Set(paths).size, paths.length);
});

test('Every coordinate lies within the 24 x 24 grid', () => {
  for (const [name, icon] of drawings) {
    const numbers = icon.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (const [cx, cy] of [...(icon.dots || []), ...(icon.rings || [])]) numbers.push(cx, cy);
    assert.ok(numbers.length > 0, name);
    for (const value of numbers) assert.ok(value >= 0 && value <= 24, `${name}: ${value}`);
  }
});
