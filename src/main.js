import { createGame, advance, action, pause } from '../shared/game.js';
import { frontXpm, backElements } from '../shared/render.js';
import manifest from './appmeta/manifest.json';
const APP = manifest.id,
  BASE = 'http://localhost/api',
  FRAME = 80,
  IDLE = 25;
let stopped = false,
  drawing = false,
  timer,
  unbind,
  previous = Date.now();
let backPhase = '',
  sentBack = {},
  nextBackCheck = 0,
  refreshAt = 0,
  backoff = 1000;
let best = 0;
try {
  if (typeof localStorage !== 'undefined') best = localStorage.getItem('best');
} catch {}
const game = createGame(best);

function report(where, e) {
  console.error('What the Duck ' + where + ': ' + (e && e.message ? e.message : String(e)));
}
function save() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem('best', String(game.best));
  } catch {}
}

async function frame() {
  if (stopped || drawing) return;
  drawing = true;
  const start = Date.now();
  let wait = FRAME;
  try {
    const phase = game.phase;
    // Resume after a long interruption only when the player is ready.
    if (start - previous > 500 && game.phase === 'running') pause(game);
    advance(game, (start - previous) / 1000);
    previous = start;
    if (phase !== 'dead' && game.phase === 'dead') save();
    const elements = [
      {
        id: 'game',
        type: 'xpmbitmap',
        display: 'front',
        x: 0,
        y: 0,
        align: 'top_left',
        data: frontXpm(game),
      },
    ];
    const phaseKey = game.phase;
    // Score changes update only their own text, at most once per second. State changes
    // flush immediately so pause, retry, and the final score never wait for the throttle.
    const refresh = start >= refreshAt;
    const checkBack = phaseKey !== backPhase || refresh || start >= nextBackCheck;
    const pendingBack = checkBack
      ? backElements(game)
          .map(element => ({ element, json: JSON.stringify(element) }))
          .filter(item => refresh || sentBack[item.element.id] !== item.json)
      : [];
    elements.push(...pendingBack.map(item => item.element));
    const r = await fetch(BASE + '/display/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_name: APP, priority: 50, elements }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (checkBack) {
      backPhase = phaseKey;
      nextBackCheck = start + 1000;
      for (const item of pendingBack) sentBack[item.element.id] = item.json;
      // Firmware can clear our canvas without notifying the app. Restore static rear
      // text occasionally, independently of score updates.
      if (refresh) refreshAt = start + 30000;
    }
    backoff = 1000;
  } catch (e) {
    report('draw', e);
    if (game.phase === 'running') pause(game);
    backPhase = '';
    sentBack = {};
    refreshAt = 0;
    wait = backoff;
    backoff = Math.min(backoff * 2, 30000);
  } finally {
    drawing = false;
  }
  if (!stopped) timer = setTimeout(tick, Math.max(IDLE, wait - (Date.now() - start)));
}
function tick() {
  void frame().catch(e => report('frame', e));
}

async function quit() {
  if (stopped) return;
  stopped = true;
  clearTimeout(timer);
  save();
  while (drawing) await new Promise(r => setTimeout(r, 50));
  try {
    await fetch(BASE + '/display/draw?application_name=' + APP, { method: 'DELETE' });
  } catch (e) {
    report('quit', e);
  }
  setTimeout(unbind, 0);
}

unbind = listen('input', event => {
  if (stopped) return;
  if (event.key === 'back' && event.action === 'short') {
    void quit().catch(e => report('quit', e));
  } else if (event.key === 'ok' && event.action === 'long') {
    pause(game);
    previous = Date.now();
  } else if (
    ((event.key === 'ok' || event.key === 'start') && event.action === 'short') ||
    (event.key === 'encoder' && event.delta)
  ) {
    action(game);
    previous = Date.now();
  }
});
tick();
