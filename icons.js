// Pictograms for the exercise tiles, and the lookup of an exercise name. Pure
// data and functions with no DOM, so Node tests can import it. Each icon is
// drawn on a 24 x 24 grid with a 2-unit round stroke in the tile's text colour:
// `d` is one path with all strokes, `dots` are filled heads and `rings` are
// weights or pads, both as [cx, cy, r]. `assisted` is a variant for the name
// marked "(assistiert)". Draw a new icon by the rules in the design of the
// exercise-icons change.
import { splitAssisted } from './workout.js';

export const ICONS = {
  'Bankdrücken': {
    d: 'M7.62 14.01L15.35 14.01 M4.53 17.1L19.98 17.1 M6.59 17.1L6.59 21.22 M17.92 17.1L17.92 21.22 M15.35 14.01L18.95 12.98L19.98 21.22 M9.68 13.7L9.99 7.31',
    dots: [[5.15, 13.08, 2.1]],
    rings: [[9.99, 5.25, 2.4]],
  },
  'Bauchmaschine': {
    d: 'M7.29 10.16L13.03 13.95L13.64 7.08L19.58 7.08 M2.78 16.92L21.23 16.92',
    dots: [[5.13, 8.62, 2.1]],
  },
  'Rückenheben': {
    d: 'M2.83 17.21L10.43 10.16L17.48 7.34 M10.21 14.28L14.01 14.28 M12.05 14.28L12.05 18.83',
    dots: [[19.97, 6.36, 2.1]],
  },
  'Bizepsmaschine': {
    d: 'M5.8 7.85L5.8 14.75L10.8 14.75L10.8 21.25 M8.6 10.15L13.3 13.35L15.9 7.35',
    dots: [[5.8, 5.15, 2.1]],
    rings: [[16.9, 5.15, 2.4]],
  },
  'Seitheber': {
    d: 'M12 9.23L12 16.28 M9.29 10.32L3.54 7.5 M14.71 10.32L20.46 7.5 M8.2 21.17L8.2 16.28L15.8 16.28L15.8 21.17',
    dots: [[12, 6.41, 2.1]],
    rings: [[5.6, 4.35, 1.4], [18.4, 4.35, 1.4]],
  },
  'Schulterpresse': {
    d: 'M12 9.64L12 16.61 M9.44 10.46L6.88 8.93L6.88 2.78 M14.56 10.46L17.12 8.93L17.12 2.78 M4.83 2.78L8.93 2.78 M15.07 2.78L19.17 2.78 M8.41 21.23L8.41 16.61L15.59 16.61L15.59 21.23',
    dots: [[12, 7.08, 2.1]],
  },
  'Trizepspull': {
    d: 'M8.09 7.38L8.09 14.91L6.66 21.3 M8.09 14.91L10 21.3 M10.67 9.09L11.14 12.81L14.48 15.48 M14.48 15.48L16.2 2.7 M15.05 2.7L17.34 2.7',
    dots: [[8.09, 4.8, 2.1]],
  },
  'Ruderzug': {
    d: 'M8.06 6.6L8.06 13.06L12.3 15.99L11.5 21.24 M4.43 15.79L7.86 15.79 M10.49 8.31L16.31 8.31 M15.94 6.9L19.57 20.63',
    dots: [[8.06, 3.87, 2.1]],
  },
  'Butterfly': {
    d: 'M12 9.12L12 16.38 M9.12 9.86L4.53 8.58L8.16 2.82 M14.88 9.86L19.47 8.58L15.84 2.82 M8.26 21.18L8.26 16.38L15.74 16.38L15.74 21.18',
    dots: [[12, 6.45, 2.1]],
  },
  'Beinpresse': {
    d: 'M5.74 9.48L9.32 14.31 M2.8 11.05L7.53 17.89L13.84 17.89 M9.32 14.31L14.16 8.43L18.78 10.74 M21.2 7.37L17.2 15.15',
    dots: [[4.17, 7.27, 2.1]],
  },
  'Klimmzüge': {
    d: 'M3.37 2.83L20.63 2.83 M7.14 2.83L9.3 10.38 M16.86 2.83L14.7 10.38 M9.3 10.38L14.7 10.38 M12 10.38L12 17.39 M12 17.39L8.76 20.09 M12 17.39L15.24 20.09 M6.61 21.17L17.39 21.17',
    dots: [[12, 7.47, 2.1]],
    assisted: {
      d: 'M2.75 2.75L18.75 2.75 M6.25 2.75L8.25 9.75 M15.25 2.75L13.25 9.75 M8.25 9.75L13.25 9.75 M10.75 9.75L10.75 16.25 M10.75 16.25L7.75 18.75 M10.75 16.25L13.75 18.75 M5.75 19.75L15.75 19.75 M19.25 21.25L19.25 13.75 M17.25 15.75L19.25 13.75L21.25 15.75',
      dots: [[10.75, 7.05, 2.1]],
    },
  },
  'Beinstrecker': {
    d: 'M6.74 7.73L6.74 15.38L12.83 15.38L16.93 20.48 M2.86 18.7L10.06 18.7',
    dots: [[6.74, 4.74, 2.1]],
    rings: [[19.37, 17.15, 1.6]],
  },
  'Latzug': {
    d: 'M4.52 7.29L5.84 5.53L18.16 5.53L19.48 7.29 M12 5.53L12 2.63 M12 12.4L12 16.97 M9.71 13.19L7.42 11.78L7.42 8.08 M14.29 13.19L16.58 11.78L16.58 8.08 M8.92 21.37L8.92 17.85L15.08 17.85L15.08 21.37',
    dots: [[12, 10.02, 2.1]],
  },
  'Duale Schulterpresse': {
    d: 'M12 10.36L12 16.93 M9.58 11.13L7.17 9.68L7.17 2.72 M5.23 2.72L9.1 2.72 M14.42 11.13L16.83 9.68L16.83 6.2 M14.9 6.2L18.77 6.2 M8.62 21.28L8.62 16.93L15.38 16.93L15.38 21.28',
    dots: [[12, 7.94, 2.1]],
  },
  'Brustpresse': {
    d: 'M8.9 6.87L8.9 14.24L14.78 14.24L14.78 21.18 M4.63 6.55L4.63 17.45L11.57 17.45 M12.11 8.9L19.37 8.9 M19.37 6.23L19.37 11.57',
    dots: [[8.9, 3.99, 2.1]],
  },
  'Crunchmaschine': {
    d: 'M15.14 6.88L10.72 15.03L17.24 11.3L16.08 21.09 M6.18 17.82L13.05 17.82',
    dots: [[16.54, 4.2, 2.1]],
  },
};

const fold = (name) => name.normalize('NFC').toLowerCase();
const BY_NAME = new Map(Object.entries(ICONS).map(([name, icon]) => [fold(name), icon]));

// The icon for an exercise name, matched ignoring case and the "(assistiert)"
// marker, as { d, dots, rings }, or null when the name has none. A name with
// the marker gets the entry's `assisted` variant if it has one.
export function iconFor(name) {
  const { base, assisted } = splitAssisted(name);
  const entry = BY_NAME.get(fold(base));
  if (!entry) return null;
  return assisted && entry.assisted ? entry.assisted : entry;
}
