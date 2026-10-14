/** القرّاء: أسماء الملفات والروابط (آية بآية من EveryAyah، وسورة كاملة من mp3quran) */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/features/audio/reciters.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const R = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('القرّاء: معرّفات فريدة وروابط صح', () => {
  const ids = R.RECITERS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(R.ayahFileName(2, 255), '002255.mp3');
  assert.equal(R.ayahFileName(18, 0), '018.mp3');
  assert.equal(R.ayahUrl('Alafasy_128kbps', 1, 1), 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3');
});

test('الشيخ محمد رفعت: سورة كاملة من mp3quran والسور المسجّلة بس', () => {
  const id = 'mp3quran_muhammad-refaat';
  assert.equal(R.isSurahReciter(id), true);
  assert.equal(R.isSurahReciter('Alafasy_128kbps'), false);
  assert.equal(R.ayahUrl(id, 18, 0), 'https://cdn.mp3quran.net/audio/muhammad-refaat/r1/018.mp3');
  assert.equal(R.reciterHasSurah(id, 18), true);
  assert.equal(R.reciterHasSurah(id, 2), false);
  assert.equal(R.reciterById(id).surahs.length, 31);
  assert.equal(R.reciterHasSurah('Alafasy_128kbps', 2), true);
});
