// Confetti from a tile that just turned green: one canvas above the page, drawn
// by this module alone. It stops and removes itself when the last piece is gone.
const COLORS_FIXED = ['#f59e0b', '#ec4899', '#8b5cf6'];
const TILE_PIECES = 100;
const CANNON_PIECES = 60;
const MAX_PIECES = 300;
const MIN_LIFE = 0.9;
const MAX_LIFE = 1.2;
const GRAVITY = 900;
const DRAG = 1.6;
const MAX_STEP = 1 / 30;
const MAX_RATIO = 2;

let canvas = null;
let context = null;
let pieces = [];
let last = 0;
let ratio = 1;
let frame = 0;

const random = (min, max) => min + Math.random() * (max - min);

function colors() {
  const style = getComputedStyle(document.documentElement);
  return [
    style.getPropertyValue('--improved').trim(),
    style.getPropertyValue('--done').trim(),
  ].filter(Boolean).concat(COLORS_FIXED);
}

// The visible part of the screen in layout-viewport coordinates, which is what
// getBoundingClientRect() and the fixed canvas use too. Above an open keyboard
// when the browser tells.
function visibleArea() {
  const v = window.visualViewport;
  if (v) return { left: v.offsetLeft, top: v.offsetTop, width: v.width, height: v.height };
  return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
}

function piece(x, y, angle, speed, palette) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: random(6, 11),
    color: palette[Math.floor(Math.random() * palette.length)],
    spin: random(-12, 12),
    rotation: random(0, Math.PI * 2),
    flutter: random(0, Math.PI * 2),
    age: 0,
    life: random(MIN_LIFE, MAX_LIFE),
  };
}

function burst(rect, area, palette) {
  const fits = rect.left >= area.left && rect.right <= area.left + area.width
    && rect.top >= area.top && rect.bottom <= area.top + area.height;
  const made = [];
  if (fits) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (let i = 0; i < TILE_PIECES; i++) {
      // Outwards in every direction; downward pieces are turned up half the time.
      let angle = random(0, Math.PI * 2);
      if (Math.sin(angle) > 0 && Math.random() < 0.5) angle = -angle;
      made.push(piece(x, y, angle, random(250, 650), palette));
    }
  } else {
    const y = area.top + area.height * (2 / 3);
    for (let i = 0; i < CANNON_PIECES; i++) {
      made.push(piece(area.left, y, random(-1.3, -0.5), random(500, 900), palette));
      made.push(
        piece(area.left + area.width, y, random(-Math.PI + 0.5, -Math.PI + 1.3), random(500, 900), palette),
      );
    }
  }
  return made;
}

function draw(now) {
  const step = Math.min((now - last) / 1000, MAX_STEP);
  last = now;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  for (const p of pieces) {
    p.age += step;
    p.vx -= p.vx * DRAG * step;
    p.vy += (GRAVITY - p.vy * DRAG) * step;
    p.x += p.vx * step;
    p.y += p.vy * step;
    p.rotation += p.spin * step;
    const fade = Math.min(1, (p.life - p.age) / 0.3);
    if (fade <= 0) continue;
    context.save();
    context.globalAlpha = fade;
    context.translate(p.x, p.y);
    context.rotate(p.rotation);
    // The width follows a cosine, so the piece flutters as it turns.
    context.scale(Math.cos(p.flutter + p.age * 8), 1);
    context.fillStyle = p.color;
    context.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    context.restore();
  }
  pieces = pieces.filter((p) => p.age < p.life);
  if (pieces.length > 0) {
    frame = requestAnimationFrame(draw);
  } else {
    canvas.remove();
    canvas = null;
    context = null;
    frame = 0;
  }
}

// Plays a burst from `tile` when it lies entirely in the visible area, and from
// both sides of that area otherwise. A call during a burst adds to it.
export function playConfetti(tile) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const made = burst(tile.getBoundingClientRect(), visibleArea(), colors());

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    context = canvas.getContext('2d');
  }
  ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);

  pieces = pieces.concat(made).slice(-MAX_PIECES);
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(draw);
  }
}
