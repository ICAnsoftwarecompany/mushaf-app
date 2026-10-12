/** رقم الإصدار: نفس الرقم في app.json و package.json وبالشكل X.Y.Z (scripts/bump-version.mjs) */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('رقم الإصدار متطابق وبالشكل X.Y.Z', () => {
  const v = read('app.json').expo.version;
  assert.match(v, /^\d+\.\d+\.\d+$/);
  assert.equal(read('package.json').version, v);
  const lock = read('package-lock.json');
  assert.equal(lock.version, v);
  assert.equal(lock.packages[''].version, v);
});
