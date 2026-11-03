// SVG helpers shared by the Today and History pages.
const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

export function buildIcon({ d, dots = [], rings = [] }) {
  const svg = svgElement('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(svgElement('path', { d }));
  for (const [cx, cy, r] of dots) {
    svg.append(svgElement('circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }));
  }
  for (const [cx, cy, r] of rings) svg.append(svgElement('circle', { cx, cy, r }));
  return svg;
}
