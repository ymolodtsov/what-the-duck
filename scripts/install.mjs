// Install and launch What the Duck on a connected Busy Bar. Replaces `busy-cli app install/run`, whose
// fetch-based client rejects every response from firmware 1.3.1 (see scripts/bar.mjs).
// Usage: node scripts/install.mjs [--launch-only]
import { readFile } from 'node:fs/promises';
import { barFetch, barBase, barHeaders } from './bar.mjs';

const manifest = JSON.parse(await readFile('src/appmeta/manifest.json', 'utf8'));
const APP = manifest.id;
const PACKAGE = `dist/${APP}.tgz`;

async function call(method, path, body, headers = {}) {
  const r = await barFetch(new URL('/api/' + path, barBase()), {
    method,
    body,
    headers: barHeaders(headers),
    timeoutMs: 60000,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} /api/${path}: HTTP ${r.status} ${text.trim()}`);
  return text ? JSON.parse(text) : {};
}

try {
  if (!process.argv.includes('--launch-only')) {
    const tgz = await readFile(PACKAGE).catch(() => {
      throw new Error(`${PACKAGE} is missing. Run npm run build first.`);
    });
    // Launching over a running copy is refused, so stop whatever app is running first.
    await call('POST', 'apps/quit').catch(() => {});
    const staged = await call('POST', 'apps/stage', tgz, {
      'Content-Type': 'application/octet-stream',
    });
    if (!staged.install_key) throw new Error('The Bar did not return an install key.');
    await call('POST', 'apps/install?install_key=' + staged.install_key);
    console.log(`Installed ${staged.staged.name} ${staged.staged.version} on ${barBase()}`);
  }
  await call('POST', 'apps/launch?app_id=' + encodeURIComponent(APP));
  console.log(`Launched ${APP}`);
} catch (e) {
  console.error(e.message);
  if (e.code === 'ECONNREFUSED' || e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT')
    console.error('Connect the Bar over USB, or set BUSY_BAR_URL in .env for Wi-Fi.');
  process.exitCode = 1;
}
