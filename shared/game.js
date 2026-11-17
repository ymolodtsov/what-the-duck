export const WIDTH = 72,
  HEIGHT = 16,
  GROUND = 14,
  DUCK_X = 9;
export const DUCKS = [
  ['...yyy..', '...ykyoo', 'y..yyy..', 'yyyyyy..', '.yyyyy..', '..yyyy..', '..o.o...'],
  ['...yyy..', '...ykyoo', 'y..yyy..', 'yyyyyy..', '.yyyyy..', '..yyyy..', '...o.o..'],
];
export const CACTI = [
  ['.g.', 'gg.', '.gg', '.g.'],
  ['.g.', '.gg', 'gg.', '.g.', '.g.'],
  ['.g.g.', 'gg.gg', '.ggg.', '..g..'],
];
const STEP = 1 / 60;

export function createGame(best = 0) {
  return {
    phase: 'ready',
    best: Math.max(0, Math.floor(Number(best) || 0)),
    score: 0,
    distance: 0,
    height: 0,
    velocity: 0,
    time: 0,
    deadTime: 0,
    buffer: 0,
    accumulator: 0,
    nextSpawn: 72,
    obstacles: [],
  };
}

export function speed(g) {
  return Math.min(32, 18 + g.distance / 180);
}

export function action(g) {
  if (g.phase === 'paused') {
    g.phase = 'running';
    return;
  }
  if (g.phase === 'dead' && g.deadTime < 0.45) return;
  if (g.phase === 'ready' || g.phase === 'dead') {
    const fresh = createGame(g.best);
    for (const key of Object.keys(fresh)) g[key] = fresh[key];
    g.phase = 'running';
    g.obstacles = [{ x: 65, kind: 0 }];
    g.nextSpawn = 48;
  }
  g.buffer = 0.12;
}

export function pause(g) {
  if (g.phase === 'running') g.phase = 'paused';
  else if (g.phase === 'paused') g.phase = 'running';
}

function collided(g, obstacle) {
  // Forgiving body hitbox: ignore the beak, tail tip, and animated feet.
  const left = DUCK_X + 1,
    right = DUCK_X + 6;
  const top = GROUND - 7 - g.height + 1,
    bottom = GROUND - g.height - 1;
  const sprite = CACTI[obstacle.kind];
  for (let y = 0; y < sprite.length; y++)
    for (let x = 0; x < sprite[y].length; x++) {
      if (sprite[y][x] === '.') continue;
      const ox = obstacle.x + x,
        oy = GROUND - sprite.length + y;
      if (left < ox + 1 && right > ox && top < oy + 1 && bottom > oy) return true;
    }
  return false;
}

function step(g, random) {
  g.time += STEP;
  if (g.buffer > 0 && g.height === 0) {
    g.velocity = 26;
    g.buffer = 0;
  }
  g.buffer = Math.max(0, g.buffer - STEP);
  if (g.height > 0 || g.velocity > 0) {
    g.height += g.velocity * STEP - 24 * STEP * STEP;
    g.velocity -= 48 * STEP;
    if (g.height <= 0) {
      g.height = 0;
      g.velocity = 0;
    }
  }
  const movement = speed(g) * STEP;
  g.distance += movement;
  g.score = Math.floor(g.distance / 8);
  g.best = Math.max(g.best, g.score);
  g.nextSpawn -= movement;
  if (g.nextSpawn <= 0) {
    const kind = speed(g) < 22 ? 0 : Math.min(2, Math.floor(random() * 3));
    g.obstacles.push({ x: WIDTH, kind });
    // At least 1.8 seconds between obstacles, enough to land and jump again at every speed.
    g.nextSpawn = speed(g) * (1.8 + random() * 0.8);
  }
  for (const obstacle of g.obstacles) {
    obstacle.x -= movement;
    if (collided(g, obstacle)) {
      g.phase = 'dead';
      g.deadTime = 0;
    }
  }
  g.obstacles = g.obstacles.filter(o => o.x > -6);
}

export function advance(g, seconds, random = Math.random) {
  if (g.phase === 'dead') {
    g.deadTime += Math.min(seconds, 0.25);
    return;
  }
  if (g.phase !== 'running') return;
  // A delayed HTTP draw never fast-forwards the duck through unseen obstacles.
  g.accumulator += Math.max(0, Math.min(seconds, 0.16));
  while (g.accumulator >= STEP && g.phase === 'running') {
    g.accumulator -= STEP;
    step(g, random);
  }
}
