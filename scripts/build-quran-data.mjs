#!/usr/bin/env node
/**
 * build-quran-data.mjs
 *
 * يبني بيانات المصحف اللي بتتحط جوه التطبيق (أوفلاين) في src/data/quran/
 * من مصادر موثّقة منشورة على npm، ويتأكد إن نص القرآن ما اتغيرش ولا حرف.
 *
 * التشغيل:  npm run build:quran-data
 *
 * المصادر (التفاصيل والتراخيص في docs/data.md):
 *   - quran-json@3.1.2   نص الرسم العثماني (رواية حفص) من موسوعة القرآن الكريم QuranEnc — CC BY 4.0
 *   - quran-qcf4@1.1.0   ترتيب السطور في صفحات مصحف المدينة (604 صفحة × 15 سطر) — ملفات JSON فقط (MIT)
 *                        ⚠️ ملفات الخطوط في الحزمة دي غير مسموح بإعادة توزيعها، والسكربت ما بيستخدمهاش
 *   - quran-meta@7.0.0   الأجزاء والأحزاب والأرباع والسجدات (MIT)
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.quran-sources');
const OUT = path.join(ROOT, 'src', 'data', 'quran');

const SOURCES = {
  text: 'quran-json@3.1.2',
  layout: 'quran-qcf4@1.1.0',
  meta: 'quran-meta@7.0.0',
};

const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;
const TOTAL_PAGES = 604;

// ───────────────────────── helpers ─────────────────────────

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

function fetchPackage(spec) {
  const name = spec.replace(/@[^@]+$/, '').replace('/', '-').replace(/^@/, '');
  const dir = path.join(CACHE, name);
  if (fs.existsSync(path.join(dir, 'package.json'))) return dir;

  fs.mkdirSync(CACHE, { recursive: true });
  console.log(`↓ npm pack ${spec}`);
  const out = execFileSync('npm', ['pack', spec, '--silent'], {
    cwd: CACHE,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  }).trim().split('\n').pop();
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('tar', ['-xzf', path.join(CACHE, out), '-C', dir, '--strip-components=1']);
  fs.rmSync(path.join(CACHE, out));
  return dir;
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** هيكل الحروف فقط (من غير تشكيل) — بيُستخدم للمطابقة بين المصدرين، مش للعرض */
function skeleton(word) {
  return word
    .normalize('NFC')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـࣰ-ࣿ]/g, '')
    // حروف المد والهمزات بتتكتب بشكل مختلف بين الرسم العثماني والإملائي، فبنقارن الحروف الثابتة بس
    .replace(/[اٱأإآىيوؤئءۥۦ]/g, '')
    .replace(/ة/g, 'ت')
    .replace(/[^ء-ي]/g, '');
}

function sha256(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

// ───────────────────────── load sources ─────────────────────────

const textDir = fetchPackage(SOURCES.text);
const layoutDir = fetchPackage(SOURCES.layout);
const metaDir = fetchPackage(SOURCES.meta);

const quranJson = readJson(path.join(textDir, 'dist', 'quran.json'));
const layoutIndex = readJson(path.join(layoutDir, 'index.json'));
const hafs = await import(pathToFileURL(path.join(metaDir, 'dist', 'hafs.js')).href);

// ───────────────────────── text ─────────────────────────

if (quranJson.length !== TOTAL_SURAHS) fail(`عدد السور ${quranJson.length} بدل ${TOTAL_SURAHS}`);

/** ayahs[i] = نص الآية رقم i+1 (ترقيم عام من 1 إلى 6236) — منسوخ زي ما هو */
const ayahs = [];
const surahFirstAyah = [];
for (const s of quranJson) {
  if (s.verses.length !== s.total_verses) fail(`السورة ${s.id}: عدد الآيات غير متطابق`);
  surahFirstAyah[s.id] = ayahs.length + 1;
  for (const v of s.verses) ayahs.push(v.text);
}
if (ayahs.length !== TOTAL_AYAHS) fail(`عدد الآيات ${ayahs.length} بدل ${TOTAL_AYAHS}`);

const ayahId = (surah, ayah) => surahFirstAyah[surah] + ayah - 1;

// ───────────────────────── page layout ─────────────────────────
// كل سطر في الصفحة واحد من:
//   ["h", surah]                         عنوان سورة
//   ["b"]                                البسملة
//   ["w", [ayahId, from, to, end], ...]  كلمات: من الكلمة from إلى to (ترقيم من 0) في الآية ayahId،
//                                        و end = 1 لو علامة نهاية الآية في السطر ده

/** قائمة كلمات كل آية في ملفات التخطيط بالترتيب، مع رقم الصفحة والسطر */
const layoutWords = new Map(); // ayahId -> [{page,line,text}]
const rawPages = [];
for (let p = 1; p <= TOTAL_PAGES; p++) {
  const page = readJson(path.join(layoutDir, 'pages', `${String(p).padStart(3, '0')}.json`));
  rawPages.push(page);
  for (const line of page.lines) {
    for (const w of line.words) {
      if (w.type !== 'word' || w.text.startsWith('#')) continue; // # = علامة السجدة كرمز منفصل
      const [s, a] = w.verse_key.split(':').map(Number);
      const id = ayahId(s, a);
      if (!layoutWords.has(id)) layoutWords.set(id, []);
      layoutWords.get(id).push({ page: p, line: line.line, text: w.text });
    }
  }
}

/**
 * لكل كلمة في النص العثماني: في أي صفحة وسطر بتبدأ.
 * أحيانًا المصدرين بيقسموا الكلمة بشكل مختلف (مثلًا «مَالِيَ» كلمة واحدة في النص وكلمتين في التخطيط)،
 * فبنطابق بهيكل الحروف.
 */
const wordPos = new Map(); // ayahId -> [{page,line}] لكل كلمة في النص
for (let id = 1; id <= TOTAL_AYAHS; id++) {
  const words = ayahs[id - 1].split(' ');
  const lw = layoutWords.get(id);
  if (!lw) fail(`الآية ${id} مش موجودة في التخطيط`);
  const pos = [];
  let j = 0;
  for (const word of words) {
    const target = skeleton(word);
    const start = lw[j];
    if (!start) fail(`الآية ${id}: كلمات التخطيط خلصت قبل «${word}»`);
    let acc = skeleton(lw[j++].text);
    while (j < lw.length && acc.length < target.length) acc += skeleton(lw[j++].text);
    if (acc !== target) fail(`الآية ${id}: عدم تطابق «${word}» ↔ «${acc}»`);
    pos.push({ page: start.page, line: start.line });
  }
  if (j !== lw.length) fail(`الآية ${id}: كلمات زيادة في التخطيط`);
  wordPos.set(id, pos);
}

/** علامة نهاية الآية في أي صفحة/سطر */
const endPos = new Map();
for (const page of rawPages) {
  for (const line of page.lines) {
    for (const w of line.words) {
      if (w.type !== 'end') continue;
      const [s, a] = w.verse_key.split(':').map(Number);
      endPos.set(ayahId(s, a), { page: page.page, line: line.line });
    }
  }
}

const pages = rawPages.map((page) => {
  const lines = page.lines.map((line) => {
    const head = line.words[0];
    if (head.type === 'surah_header') return ['h', head.sura];
    if (head.type === 'bismillah') return ['b'];
    return ['w'];
  });
  return { page: page.page, lines };
});

for (let id = 1; id <= TOTAL_AYAHS; id++) {
  const pos = wordPos.get(id);
  const end = endPos.get(id);
  if (!end) fail(`الآية ${id} من غير علامة نهاية`);
  let i = 0;
  while (i < pos.length) {
    const { page, line } = pos[i];
    let k = i;
    while (k + 1 < pos.length && pos[k + 1].page === page && pos[k + 1].line === line) k++;
    const isEnd = k === pos.length - 1 && end.page === page && end.line === line ? 1 : 0;
    const row = pages[page - 1].lines[line - 1];
    if (row[0] !== 'w') fail(`الصفحة ${page} السطر ${line} مش سطر كلمات`);
    row.push([id, i, k, isEnd]);
    i = k + 1;
  }
  const last = pos[pos.length - 1];
  if (end.page !== last.page || end.line !== last.line) {
    // علامة النهاية نزلت لوحدها في السطر اللي بعده
    pages[end.page - 1].lines[end.line - 1].push([id, pos.length, pos.length - 1, 1]);
  }
}

// تحقق: إعادة تركيب النص من الصفحات لازم تطلع النص الأصلي بالحرف
{
  const rebuilt = new Map();
  for (const p of pages)
    for (const l of p.lines)
      if (l[0] === 'w')
        for (const [id, from, to] of l.slice(1)) {
          const words = ayahs[id - 1].split(' ').slice(from, to + 1);
          rebuilt.set(id, [...(rebuilt.get(id) ?? []), ...words]);
        }
  for (let id = 1; id <= TOTAL_AYAHS; id++)
    if ((rebuilt.get(id) ?? []).join(' ') !== ayahs[id - 1]) fail(`إعادة تركيب الآية ${id} لا تطابق النص`);
}

// ───────────────────────── metadata ─────────────────────────

const pageOfAyah = new Array(TOTAL_AYAHS + 1);
for (let id = 1; id <= TOTAL_AYAHS; id++) pageOfAyah[id] = wordPos.get(id)[0].page;

// مقارنة صفحة بداية كل آية مع quran-meta.
// التخطيط من طبعة 1441هـ وquran-meta من طبعة أقدم، فيه فروق معروفة في 56 آية (موثقة في docs/data.md).
// لو الرقم ده اتغير، يبقى فيه حاجة اتغيرت في المصادر ولازم تتراجع.
const EXPECTED_PAGE_DIFFS = 56;
let pageMismatch = 0;
for (let id = 1; id <= TOTAL_AYAHS; id++) if (hafs.findPageByAyahId(id) !== pageOfAyah[id]) pageMismatch++;
if (pageMismatch !== EXPECTED_PAGE_DIFFS)
  fail(`فروق الصفحات مع quran-meta بقت ${pageMismatch} بدل ${EXPECTED_PAGE_DIFFS} — راجع المصادر`);

const surahs = quranJson.map((s) => {
  const info = layoutIndex.chapters[s.id - 1];
  return {
    id: s.id,
    name: info.name_arabic,
    nameEn: s.transliteration,
    type: s.type === 'meccan' ? 'meccan' : 'medinan',
    ayahs: s.total_verses,
    firstAyah: surahFirstAyah[s.id],
    page: pageOfAyah[surahFirstAyah[s.id]],
  };
});

const juz = [];
for (let j = 1; j <= 30; j++) {
  const id = hafs.JuzList[j];
  const [surah, ayah] = hafs.findSurahAyahByAyahId(id);
  juz.push({ id: j, ayahId: id, surah, ayah, page: pageOfAyah[id] });
}

const quarters = []; // 240 ربع؛ كل حزب = 4 أرباع
for (let q = 1; q <= 240; q++) {
  const id = hafs.HizbQuarterList[q];
  const [surah, ayah] = hafs.findSurahAyahByAyahId(id);
  quarters.push({ id: q, hizb: Math.ceil(q / 4), juz: Math.ceil(q / 8), ayahId: id, surah, ayah, page: pageOfAyah[id] });
}

const sajdas = hafs.SajdaList.filter((x) => x > 0).map((x) => (Array.isArray(x) ? x[0] : x));

// ───────────────────────── write ─────────────────────────

fs.mkdirSync(OUT, { recursive: true });
const write = (name, data) => {
  const json = JSON.stringify(data);
  fs.writeFileSync(path.join(OUT, name), json);
  console.log(`✔ ${name.padEnd(14)} ${(json.length / 1024).toFixed(0)} KB`);
};

write('ayahs.json', ayahs);
write('surahs.json', surahs);
write('pages.json', pages);
write('juz.json', juz);
write('quarters.json', quarters);
write('sajdas.json', sajdas);
write('meta.json', {
  generatedBy: 'scripts/build-quran-data.mjs',
  riwaya: 'حفص عن عاصم',
  mushaf: 'مصحف المدينة النبوية — 604 صفحة، 15 سطر',
  sources: SOURCES,
  counts: { surahs: TOTAL_SURAHS, ayahs: TOTAL_AYAHS, pages: TOTAL_PAGES, juz: 30, quarters: 240, sajdas: sajdas.length },
  textSha256: sha256(ayahs.join('\n')),
});

console.log('\n✔ تم بناء بيانات المصحف والتحقق منها');
