/**
 * اختبارات سلامة البيانات — `npm test`
 * أهمها: نص القرآن ما اتغيرش (بصمة SHA-256) وإعادة تركيب الصفحات بترجّع النص بالحرف.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const ayahs = read('src/data/quran/ayahs.json');
const surahs = read('src/data/quran/surahs.json');
const pages = read('src/data/quran/pages.json');
const meta = read('src/data/quran/meta.json');

test('نص القرآن: 6236 آية والبصمة مطابقة لـ meta.json', () => {
  assert.equal(ayahs.length, 6236);
  const hash = createHash('sha256').update(ayahs.join('\n'), 'utf8').digest('hex');
  assert.equal(hash, meta.textSha256, 'ملف ayahs.json اتعدّل بالإيد! أعد بناءه بـ npm run build:quran-data');
});

test('السور: 114 سورة وعدد آياتها مجموعه 6236', () => {
  assert.equal(surahs.length, 114);
  assert.equal(surahs.reduce((n, s) => n + s.ayahs, 0), 6236);
});

test('الصفحات: 604 صفحة وإعادة تركيب كل آية بترجّع النص بالحرف', () => {
  assert.equal(pages.length, 604);
  const rebuilt = new Map();
  for (const p of pages)
    for (const line of p.lines)
      if (line[0] === 'w')
        for (const [id, from, to] of line.slice(1)) {
          const words = ayahs[id - 1].split(' ').slice(from, to + 1);
          rebuilt.set(id, [...(rebuilt.get(id) ?? []), ...words]);
        }
  for (let id = 1; id <= 6236; id++) assert.equal(rebuilt.get(id)?.join(' '), ayahs[id - 1], `الآية ${id}`);
});

test('التجويد: كل المواضع جوه حدود الآية، والتقطيع بيرجّع النص بالحرف', () => {
  const tj = read('src/data/quran/tajweed.json');
  assert.equal(tj.length, 6236);
  for (let id = 1; id <= 6236; id++) {
    const text = ayahs[id - 1];
    const runs = tj[id - 1];
    let pos = 0;
    let joined = '';
    for (let i = 0; i < runs.length; i += 3) {
      const [s, len, cat] = [runs[i], runs[i + 1], runs[i + 2]];
      assert.ok(s >= pos && s + len <= text.length && cat >= 0 && cat <= 3, `الآية ${id}`);
      joined += text.slice(pos, s) + text.slice(s, s + len);
      pos = s + len;
    }
    joined += text.slice(pos);
    assert.equal(joined, text);
  }
});

test('الأذكار: المراجع القرآنية أرقام آيات صحيحة', () => {
  const az = read('src/data/azkar.json');
  assert.ok(az.categories.length > 50);
  for (const c of az.categories)
    for (const z of c.items) {
      assert.ok(z.text || z.quran, `ذكر فاضي في ${c.name}`);
      for (const [a, b] of z.quran ?? []) assert.ok(a >= 1 && b <= 6236 && a <= b);
    }
});

test('التفسير والترجمة: 6236 نص لكل واحد', () => {
  for (const f of ['assets/data/tafsir-muyassar.ytd', 'assets/data/translation-en.ytd']) {
    const arr = read(f);
    assert.equal(arr.length, 6236, f);
    assert.ok(arr.every((x) => typeof x === 'string' && x.length > 0), f);
  }
});

test('المدن: فيها القاهرة والإسكندرية والإحداثيات منطقية', () => {
  const cities = read('src/data/cities.json');
  assert.ok(cities.length > 1000);
  for (const [, , cc, lat, lng] of cities) assert.ok(cc.length === 2 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180);
  assert.ok(cities.find((c) => c[0] === 'Cairo' && c[2] === 'EG'));
});

test('مواقيت الصلاة: الترتيب منطقي للإسكندرية', async () => {
  const { CalculationMethod, Coordinates, PrayerTimes } = await import('adhan');
  const t = new PrayerTimes(new Coordinates(31.2018, 29.9158), new Date(2026, 9, 6), CalculationMethod.Egyptian());
  assert.ok(t.fajr < t.sunrise && t.sunrise < t.dhuhr && t.dhuhr < t.asr && t.asr < t.maghrib && t.maghrib < t.isha);
});

test('النصوص: نفس المفاتيح في العربي والإنجليزي', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/i18n/strings.ts'), 'utf8');
  const block = (name) => src.slice(src.indexOf(`const ${name}`), src.indexOf('};', src.indexOf(`const ${name}`)));
  const keys = (b) => [...b.matchAll(/^\s{2}([a-zA-Z_]+):/gm)].map((m) => m[1]).sort();
  assert.deepEqual(keys(block('en')), keys(block('ar')));
});
