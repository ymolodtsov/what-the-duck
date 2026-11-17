import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const code = execFileSync(
  'tar',
  ['-xOzf', 'dist/me.molodtsov.what-the-duck.tgz', 'me.molodtsov.what-the-duck/scripts/main.js'],
  { encoding: 'utf8' },
);

function runtime(fetchImpl) {
  let handler,
    clock = 1000,
    id = 0,
    unbound = false;
  const tasks = new Map(),
    calls = [];
  class FakeDate extends Date {
    static now() {
      return clock;
    }
  }
  const context = vm.createContext({
    Date: FakeDate,
    console: { error() {} },
    setTimeout(fn, ms) {
      tasks.set(++id, { fn, ms });
      return id;
    },
    clearTimeout(key) {
      tasks.delete(key);
    },
    listen(type, fn) {
      assert.equal(type, 'input');
      handler = fn;
      return () => {
        unbound = true;
      };
    },
    fetch: (url, opts = {}) => {
      calls.push({ url, opts, at: clock });
      return fetchImpl ? fetchImpl(url, opts) : Promise.resolve({ ok: true, status: 200 });
    },
  });
  vm.runInContext(code, context, { timeout: 1000 });
  const flush = async () => {
    for (let i = 0; i < 25; i++) await Promise.resolve();
  };
  return {
    calls,
    tasks,
    flush,
    input: e => handler(e),
    get unbound() {
      return unbound;
    },
    async next() {
      const [key, task] = tasks.entries().next().value;
      tasks.delete(key);
      clock += task.ms;
      task.fn();
      await flush();
    },
  };
}
const draws = r => r.calls.filter(c => c.opts.method === 'POST').map(c => JSON.parse(c.opts.body));

test('packaged bundle boots without Node, browser, Intl, or storage APIs', async () => {
  assert.ok(code.length < 250 * 1024);
  const r = runtime();
  await r.flush();
  const draw = draws(r)[0];
  assert.equal(draw.application_name, 'me.molodtsov.what-the-duck');
  assert.equal(draw.priority, 50);
  assert.match(draw.elements[0].data, /^! XPM2\n72 16 9 1\n/);
  assert.equal(draw.elements.find(e => e.id === 'status').text, 'READY?');
  assert.ok(r.calls.every(c => c.url.startsWith('http://localhost/api/display/draw')));
});
test('short controls start, long OK pauses, and raw button events are ignored', async () => {
  const r = runtime();
  await r.flush();
  r.input({ key: 'ok', action: 'press' });
  await r.next();
  assert.equal(draws(r).length, 2);
  assert.ok(!draws(r)[1].elements.some(e => e.text === 'RUN!'));
  r.input({ key: 'ok', action: 'short' });
  await r.next();
  assert.equal(
    draws(r)
      .at(-1)
      .elements.find(e => e.id === 'status').text,
    'RUN!',
  );
  r.input({ key: 'ok', action: 'long' });
  await r.next();
  assert.equal(
    draws(r)
      .at(-1)
      .elements.find(e => e.id === 'status').text,
    'PAUSED',
  );
});
test('draws remain serialized while input arrives; Back waits for pending draw before cleanup', async () => {
  let release;
  const r = runtime((url, opts) =>
    opts.method === 'POST'
      ? new Promise(resolve => {
          release = resolve;
        })
      : Promise.resolve({ ok: true, status: 200 }),
  );
  r.input({ key: 'start', action: 'short' });
  r.input({ key: 'ok', action: 'short' });
  assert.equal(r.calls.length, 1);
  r.input({ key: 'back', action: 'short' });
  assert.equal(r.calls.length, 1);
  release({ ok: true, status: 200 });
  await r.flush();
  await r.next();
  await r.next();
  assert.equal(r.calls.filter(c => c.opts.method === 'DELETE').length, 1);
  assert.equal(r.unbound, true);
  assert.equal(r.tasks.size, 0);
});
test('failed drawing backs off and pauses gameplay', async () => {
  let success = true;
  const r = runtime(() => Promise.resolve({ ok: success, status: success ? 200 : 500 }));
  await r.flush();
  r.input({ key: 'start', action: 'short' });
  success = false;
  await r.next();
  assert.ok([...r.tasks.values()][0].ms >= 1000);
  success = true;
  await r.next();
  assert.equal(
    draws(r)
      .at(-1)
      .elements.find(e => e.id === 'status').text,
    'PAUSED',
  );
});

test('running score updates send only the score line, no more than once per second', async () => {
  const r = runtime();
  await r.flush();
  r.input({ key: 'start', action: 'short' });
  await r.next();
  assert.deepEqual(
    draws(r)
      .at(-1)
      .elements.filter(e => e.display === 'back')
      .map(e => e.id),
    ['status'],
  );
  const first = r.calls.length;
  for (let i = 0; i < 28; i++) await r.next();
  const updates = r.calls.slice(first).flatMap(call => {
    const rear = JSON.parse(call.opts.body).elements.filter(e => e.display === 'back');
    if (!rear.length) return [];
    assert.deepEqual(
      rear.map(e => e.id),
      ['score'],
    );
    return [{ at: call.at, text: rear[0].text }];
  });
  assert.equal(updates.length, 2);
  assert.ok(updates[1].at - updates[0].at >= 1000);
  assert.notEqual(updates[0].text, updates[1].text);
});

test('game over and retry flush status and the latest score immediately', async () => {
  const r = runtime();
  await r.flush();
  r.input({ key: 'start', action: 'short' });
  let final;
  for (let i = 0; i < 60; i++) {
    await r.next();
    const elements = draws(r).at(-1).elements;
    if (elements.some(e => e.id === 'status' && e.text === 'GAME OVER')) {
      final = elements;
      break;
    }
  }
  assert.ok(final);
  assert.ok(final.some(e => e.id === 'score' && !e.text.startsWith('SCORE 0 ')));
  assert.ok(final.some(e => e.id === 'jump' && e.text.includes('AGAIN')));
  assert.ok(!final.some(e => ['title', 'pause', 'quit'].includes(e.id)));
  for (let i = 0; i < 7; i++) await r.next();
  r.input({ key: 'ok', action: 'short' });
  await r.next();
  const retry = draws(r).at(-1).elements;
  assert.ok(retry.some(e => e.id === 'status' && e.text === 'RUN!'));
  assert.ok(retry.some(e => e.id === 'score' && e.text.startsWith('SCORE 0 ')));
});

test('static rear text is restored periodically after potential firmware canvas clears', async () => {
  const r = runtime();
  await r.flush();
  for (let i = 0; i < 374; i++) await r.next();
  assert.ok(
    draws(r)
      .slice(1)
      .every(d => d.elements.every(e => e.display === 'front')),
  );
  await r.next();
  assert.equal(
    draws(r)
      .at(-1)
      .elements.filter(e => e.display === 'back').length,
    6,
  );
});
