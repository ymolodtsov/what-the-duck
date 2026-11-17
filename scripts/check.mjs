import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
for (const dir of ['src', 'shared', 'scripts', 'test'])
  for (const file of await readdir(dir)) {
    if (/\.m?js$/.test(file)) execFileSync(process.execPath, ['--check', dir + '/' + file]);
  }
// The Bar's JerryScript build omits ECMAScript Annex B (verified on 1.3.1: `substr` is undefined).
const annexB = /\.(substr|getYear|setYear|toGMTString|trimLeft|trimRight)\(|\b(escape|unescape)\(/;
for (const dir of ['src', 'shared'])
  for (const file of await readdir(dir)) {
    if (!/\.m?js$/.test(file)) continue;
    const match = annexB.exec(await readFile(dir + '/' + file, 'utf8'));
    assert.equal(match, null, `${dir}/${file} uses ${match?.[0]}, which the Bar does not support`);
  }
const manifest = JSON.parse(await readFile('src/appmeta/manifest.json', 'utf8'));
assert.equal(manifest.id, 'me.molodtsov.what-the-duck');
assert.equal(manifest.format_version, 1);
console.log('Syntax and manifest are valid.');
