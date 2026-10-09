/**
 * اختبار البحث المرن (src/lib/fuzzy.ts) — اللي في الأذكار والاستماع.
 * الملف بيتحوّل لـ JS بـ TypeScript (مفيهوش imports) علشان يشتغل على أي نسخة Node.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'src/lib/fuzzy.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const { searchable, fuzzyFilter, matchScore, queryTokens } = mod;

const surahs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/quran/surahs.json'), 'utf8'));
const idx = surahs.map((s) => searchable(s.name, s.nameEn, s.id));
const find = (q) => fuzzyFilter(surahs.map((s) => s.id), q, (id) => idx[id - 1]);

test('البحث المرن: الهمزات والتاء المربوطة والتشكيل و«ال» والأرقام', () => {
  assert.equal(find('البقره')[0], 2);
  assert.equal(find('بقرة')[0], 2);
  assert.equal(find('الإسراء')[0], 17);
  assert.equal(find('اسرا')[0], 17);
  assert.equal(find('١٨')[0], 18);
  assert.equal(find('18')[0], 18);
  assert.equal(find('kahf')[0], 18);
  assert.equal(find('Al-Kahf')[0], 18);
  assert.equal(find('الكهق')[0], 18); // غلطة حرف
  assert.equal(find('مريم')[0], 19);
});

test('البحث المرن: كذا كلمة بأي ترتيب', () => {
  const s = searchable('أذكار الصباح والمساء');
  assert.ok(matchScore(s, queryTokens('المساء صباح')) > 0);
  assert.equal(matchScore(s, queryTokens('صباح نوم')), 0);
  assert.ok(matchScore(searchable('أَسْتَغْفِرُ اللَّهَ'), queryTokens('استغفر')) > 0);
});
