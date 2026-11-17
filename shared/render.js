import { WIDTH, HEIGHT, GROUND, DUCK_X, DUCKS, CACTI } from './game.js';
import { CHARS, FONT } from './font.js';
export const COLORS = {
  '.': '#000000',
  y: '#FFD43B',
  o: '#F59E0B',
  k: '#24201B',
  g: '#87B65A',
  w: '#E8E5DB',
  d: '#666B73',
  m: '#30343A',
  r: '#ED8074',
};
const EMPTY = '.'.repeat(WIDTH);
const HEADER =
  '! XPM2\n72 16 9 1\n' +
  Object.keys(COLORS)
    .map(k => k + ' c ' + COLORS[k])
    .join('\n') +
  '\n';
const labels = {};

function label(value) {
  if (labels[value]) return labels[value];
  const rows = Array(5).fill('');
  for (const ch of value) {
    const i = CHARS.indexOf(ch),
      size = 2 + 3 * FONT.height;
    const record = FONT.data.slice(i * size, (i + 1) * size);
    const advance = parseInt(record[0], 16),
      width = parseInt(record[1], 16);
    for (let y = 0; y < 5; y++) {
      const gy = y + FONT.ascent - FONT.cap;
      const bits = parseInt(record.slice(2 + 3 * gy, 5 + 3 * gy), 16);
      for (let x = 0; x < advance; x++)
        rows[y] += x < width && (bits >> (width - 1 - x)) & 1 ? 'w' : '.';
    }
  }
  if (Object.keys(labels).length > 24) for (const key of Object.keys(labels)) delete labels[key];
  labels[value] = rows;
  return rows;
}

function sprite(rows, art, x, y, tint) {
  x = Math.round(x);
  y = Math.round(y);
  for (let sy = 0; sy < art.length; sy++) {
    const yy = sy + y;
    if (yy < 0 || yy >= HEIGHT) continue;
    for (let sx = 0; sx < art[sy].length; sx++) {
      const xx = sx + x,
        c = art[sy][sx];
      if (c !== '.' && xx >= 0 && xx < WIDTH)
        rows[yy] = rows[yy].slice(0, xx) + (tint || c) + rows[yy].slice(xx + 1);
    }
  }
}

export function frontRows(g) {
  const rows = Array(HEIGHT).fill(EMPTY);
  rows[GROUND] = 'd'.repeat(WIDTH);
  const offset = Math.floor(g.distance) % 12;
  rows[15] = '..m......m..'.repeat(7).slice(offset, offset + WIDTH);
  const cloudX = 60 - (Math.floor(g.distance / 5) % 90);
  sprite(rows, ['..mmm..', '.mmmmm.', 'mmmmmmm'], cloudX, 2);
  for (const obstacle of g.obstacles)
    if (g.phase !== 'dead' || obstacle.x < 28)
      sprite(rows, CACTI[obstacle.kind], obstacle.x, GROUND - CACTI[obstacle.kind].length);
  const leg = g.phase === 'running' && g.height === 0 ? Math.floor(g.time * 8) % 2 : 0;
  sprite(rows, DUCKS[leg], DUCK_X, GROUND - 7 - g.height);
  if (g.phase === 'dead') sprite(rows, ['r.r', '.r.', 'r.r'], DUCK_X + 3, GROUND - 7 - g.height);
  const score = label(String(g.score).padStart(4, '0'));
  // Clear the score area so scenery never merges with digits.
  const sx = WIDTH - score[0].length;
  for (let y = 0; y < 5; y++) rows[y] = rows[y].slice(0, sx - 1) + '.'.repeat(WIDTH - sx + 1);
  sprite(rows, score, sx, 0);
  const status =
    g.phase === 'ready'
      ? 'START'
      : g.phase === 'dead'
        ? 'AGAIN?'
        : g.phase === 'paused'
          ? 'PAUSE'
          : '';
  if (status) {
    for (let y = 6; y < 13; y++) rows[y] = rows[y].slice(0, 30) + '.'.repeat(42);
    sprite(rows, label(status), 33, 8);
  }
  return rows;
}

export function frontXpm(g) {
  return HEADER + frontRows(g).join('\n');
}

export function backElements(g) {
  const text = (id, y, value, font = 'small') => ({
    id,
    type: 'text',
    display: 'back',
    x: 3,
    y,
    align: 'top_left',
    font,
    color: '#FFFFFFFF',
    width: 142,
    text: value,
  });
  return [
    text('title', 1, 'WHAT THE DUCK'),
    text(
      'status',
      16,
      g.phase === 'dead'
        ? 'GAME OVER'
        : g.phase === 'paused'
          ? 'PAUSED'
          : g.phase === 'ready'
            ? 'READY?'
            : 'RUN!',
      'normal',
    ),
    text('score', 32, 'SCORE ' + g.score + '   BEST ' + g.best),
    text('jump', 48, g.phase === 'dead' ? 'START / OK: AGAIN' : 'START / OK: JUMP'),
    text('pause', 59, 'HOLD OK: PAUSE'),
    text('quit', 69, 'BACK: QUIT'),
  ];
}
