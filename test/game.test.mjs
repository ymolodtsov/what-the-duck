import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, action, advance, pause, speed, DUCK_X } from '../shared/game.js';
import { frontRows, frontXpm, backElements } from '../shared/render.js';

test('starts ready, jumps on input, lands, and cannot double jump', () => {
  const g = createGame();
  advance(g, 0.1);
  assert.equal(g.distance, 0);
  action(g);
  advance(g, 0.08);
  assert.equal(g.phase, 'running');
  assert.ok(g.height > 1);
  const velocity = g.velocity;
  action(g);
  advance(g, 0.08);
  assert.ok(g.velocity < velocity);
  for (let i = 0; i < 15; i++) advance(g, 0.08);
  assert.equal(g.height, 0);
  assert.equal(g.velocity, 0);
});
test('an unavoided cactus ends the run, then restart preserves the best score', () => {
  const g = createGame();
  action(g);
  for (let i = 0; i < 100 && g.phase !== 'dead'; i++) advance(g, 0.08);
  assert.equal(g.phase, 'dead');
  assert.ok(g.score > 0);
  const best = g.best;
  action(g);
  assert.equal(g.phase, 'dead');
  advance(g, 0.25);
  advance(g, 0.25);
  action(g);
  assert.equal(g.phase, 'running');
  assert.equal(g.score, 0);
  assert.equal(g.best, best);
});
test('pausing freezes physics and resumes without resetting the run', () => {
  const g = createGame();
  action(g);
  advance(g, 0.08);
  pause(g);
  const state = JSON.stringify(g);
  advance(g, 30);
  assert.equal(JSON.stringify(g), state);
  action(g);
  advance(g, 0.08);
  assert.equal(g.phase, 'running');
  assert.ok(g.distance > 2);
});
test('timed jumps clear every obstacle type through maximum difficulty', () => {
  const g = createGame();
  action(g);
  let seed = 23,
    jumps = 0;
  const kinds = new Set();
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 4000; i++) {
    for (const o of g.obstacles) kinds.add(o.kind);
    const next = g.obstacles.find(o => o.x + 5 > DUCK_X);
    if (g.height === 0 && next && next.x < DUCK_X + 6 + speed(g) * 0.4) {
      action(g);
      jumps++;
    }
    advance(g, 0.08, random);
    assert.equal(g.phase, 'running', 'collision at frame ' + i);
    assert.ok(g.obstacles.length <= 3);
  }
  assert.equal(speed(g), 32);
  assert.equal(kinds.size, 3);
  assert.ok(jumps > 100);
});
test('late frames are bounded and equal elapsed time gives equal physics', () => {
  const a = createGame(),
    b = createGame();
  action(a);
  action(b);
  advance(a, 0.16, () => 0.5);
  advance(b, 0.08, () => 0.5);
  advance(b, 0.08, () => 0.5);
  assert.deepEqual(a, b);
  advance(a, 60);
  assert.ok(a.distance < 6);
});
test('front frames fit the display and preserve a yellow duck, score, and ground', () => {
  const g = createGame();
  for (const phase of ['ready', 'running', 'paused', 'dead']) {
    g.phase = phase;
    for (const height of [0, 3, 7]) {
      g.height = height;
      const rows = frontRows(g);
      assert.equal(rows.length, 16);
      assert.ok(rows.every(r => r.length === 72));
      assert.ok(rows.slice(0, 14).some(r => r.includes('y')));
      assert.equal(rows[14], 'd'.repeat(72));
      assert.match(frontXpm(g), /^! XPM2\n72 16 9 1\n/);
      for (const e of backElements(g)) assert.ok(e.x + e.width <= 145);
    }
  }
});
