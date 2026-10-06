#!/usr/bin/env node
/**
 * build-extra-data.mjs
 *
 * بيبني البيانات الإضافية اللي بتتحط جوه التطبيق (أوفلاين):
 *   src/data/azkar.json                    الأذكار (حصن المسلم) — الآيات بتتعرض من ayahs.json مش من نص الأذكار
 *   src/data/cities.json                   المدن بالإحداثيات (لمواقيت الصلاة من غير إنترنت)
 *   src/data/countries.json                أسماء الدول بالعربي والإنجليزي
 *   src/data/quran/tajweed.json            مواضع أحكام التجويد على نص المصحف بتاعنا (تلوين فقط)
 *   assets/data/tafsir-muyassar.ytd        التفسير الميسر (6236 آية)
 *   assets/data/translation-en.ytd         ترجمة معاني إنجليزية (مركز رواد الترجمة)
 *
 * التشغيل:  npm run build:extra-data
 * المصادر والتراخيص: docs/data.md
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.quran-sources', 'extra');
const DATA = path.join(ROOT, 'src', 'data');
const ASSETS = path.join(ROOT, 'assets', 'data');
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(ASSETS, { recursive: true });

const SOURCES = {
  azkar: 'https://raw.githubusercontent.com/osamayy/azkar-db/master/azkar.json',
  translation: 'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/eng-rowwadtranslati.min.json',
  tafsir: (s) => `https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/ar-tafsir-muyassar/${s}.json`,
  cities: 'all-the-cities@3.1.0',
};

const fail = (m) => {
  console.error(`\n✖ ${m}`);
  process.exit(1);
};
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

async function fetchCached(url, name) {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  console.log(`↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) fail(`تحميل ${url} فشل: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text);
  return text;
}

const ayahs = readJson(path.join(DATA, 'quran', 'ayahs.json'));
const surahs = readJson(path.join(DATA, 'quran', 'surahs.json'));
const ayahId = (s, a) => surahs[s - 1].firstAyah + a - 1;
const write = (file, data, raw = false) => {
  const json = raw ? data : JSON.stringify(data);
  fs.writeFileSync(file, json);
  console.log(`✔ ${path.relative(ROOT, file).padEnd(36)} ${(json.length / 1024).toFixed(0)} KB`);
};

// ───────────────────────── الأذكار ─────────────────────────
{
  const db = JSON.parse(await fetchCached(SOURCES.azkar, 'azkar.json'));
  const rows = db.rows;
  if (!Array.isArray(rows) || rows.length < 300) fail('ملف الأذكار مش بالشكل المتوقع');

  // الأذكار اللي هي آيات: بنعرضها من ayahs.json (القاعدة 1) بدل نصها في المصدر
  const QURAN_REFS = [
    { match: (r) => /البقرة 255/.test(r[4] ?? ''), refs: [[2, 255, 255]] },
    { match: (r) => /البقرة 285 - 286/.test(r[4] ?? ''), refs: [[2, 285, 286]] },
    { match: (r) => (r[4] ?? '') === 'سورة الإخلاص', refs: [[112, 1, 4]] },
    { match: (r) => (r[4] ?? '') === 'سورة الفلق', refs: [[113, 1, 5]] },
    { match: (r) => (r[4] ?? '') === 'سورة الناس', refs: [[114, 1, 6]] },
    // المعوذات بعد الصلاة وقبل النوم (من غير مرجع في المصدر)
    {
      match: (r) => !r[4] && plain(r[1]).includes('قل هو الله احد'),
      refs: [[112, 1, 4], [113, 1, 5], [114, 1, 6]],
      keepIntro: true,
    },
  ];
  // مقارنة من غير تشكيل (ترتيب علامات التشكيل بيختلف بين المصادر)
  function plain(t) {
    return t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[أإآٱ]/g, 'ا');
  }
  const SKIP_CATEGORIES = new Set(['الرقية الشرعية من القرآن الكريم']); // أغلبها آيات طويلة

  const categories = [];
  const byName = new Map();
  for (const r of rows) {
    const [category, zekr, description, count, reference] = r;
    if (SKIP_CATEGORIES.has(category)) continue;
    if (!byName.has(category)) {
      const c = { id: categories.length + 1, name: category.trim(), items: [] };
      categories.push(c);
      byName.set(category, c);
    }
    const q = QURAN_REFS.find((x) => x.match(r));
    const item = {
      text: q ? null : zekr.trim(),
      quran: q ? q.refs.map(([s, a1, a2]) => [ayahId(s, a1), ayahId(s, a2)]) : undefined,
      intro: q?.keepIntro && zekr.includes(':') ? zekr.split(':')[0].replace(/[(（]+/g, '').trim() || undefined : undefined,
      note: (description ?? '').trim() || undefined,
      count: Number(count) > 0 ? Number(count) : 1,
      ref: (reference ?? '').trim() || undefined,
    };
    byName.get(category).items.push(item);
  }
  // تحقق: كل مرجع قرآني رقم آية صحيح
  for (const c of categories)
    for (const it of c.items)
      for (const [a, b] of it.quran ?? []) if (!(a >= 1 && b <= 6236 && a <= b)) fail(`مرجع آية غلط في ${c.name}`);
  const quranItems = categories.flatMap((c) => c.items).filter((i) => i.quran).length;
  if (quranItems < 10) fail(`المتوقع على الأقل 10 أذكار قرآنية، لقينا ${quranItems}`);
  write(path.join(DATA, 'azkar.json'), { source: SOURCES.azkar, categories });
}

// ───────────────────────── المدن والدول ─────────────────────────
{
  const dir = path.join(CACHE, 'all-the-cities');
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    fs.mkdirSync(dir, { recursive: true });
    const tgz = execFileSync('npm', ['pack', SOURCES.cities, '--silent'], {
      cwd: CACHE,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    }).trim().split('\n').pop();
    execFileSync('tar', ['-xzf', path.join(CACHE, tgz), '-C', dir, '--strip-components=1']);
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent', 'pbf@3'], {
      cwd: dir,
      shell: process.platform === 'win32',
    });
  }
  const { createRequire } = await import('node:module');
  const all = createRequire(pathToFileURL(path.join(dir, 'index.js')))(path.join(dir, 'index.js'));

  // أسماء عربية لأهم المدن (الأسماء بس — الإحداثيات من GeoNames)
  const AR = {
    Cairo: 'القاهرة', Alexandria: 'الإسكندرية', Giza: 'الجيزة', 'Shubra al Khaymah': 'شبرا الخيمة', 'Port Said': 'بورسعيد',
    Suez: 'السويس', Luxor: 'الأقصر', Mansoura: 'المنصورة', 'Al Mansurah': 'المنصورة', Tanta: 'طنطا', Asyut: 'أسيوط',
    Ismailia: 'الإسماعيلية', Faiyum: 'الفيوم', 'Al Fayyum': 'الفيوم', Zagazig: 'الزقازيق', Aswan: 'أسوان', Damietta: 'دمياط',
    Damanhur: 'دمنهور', 'Al Minya': 'المنيا', Minya: 'المنيا', 'Beni Suef': 'بني سويف', Qena: 'قنا', Sohag: 'سوهاج',
    Hurghada: 'الغردقة', 'Shibin al Kawm': 'شبين الكوم', Banha: 'بنها', 'Kafr ash Shaykh': 'كفر الشيخ', 'Marsa Matruh': 'مرسى مطروح',
    'Sharm el-Sheikh': 'شرم الشيخ', Arish: 'العريش', 'Al Mahallah al Kubra': 'المحلة الكبرى', '6th of October City': 'مدينة 6 أكتوبر',
    Riyadh: 'الرياض', Jeddah: 'جدة', Mecca: 'مكة المكرمة', Medina: 'المدينة المنورة', Dammam: 'الدمام', 'Ta’if': 'الطائف', Taif: 'الطائف',
    Tabuk: 'تبوك', Buraydah: 'بريدة', 'Khamis Mushait': 'خميس مشيط', Abha: 'أبها', Hail: 'حائل', 'Ha’il': 'حائل', 'Al Hufuf': 'الهفوف',
    Dubai: 'دبي', 'Abu Dhabi': 'أبوظبي', Sharjah: 'الشارقة', 'Al Ain': 'العين', Ajman: 'عجمان', Doha: 'الدوحة', Kuwait: 'الكويت',
    'Kuwait City': 'الكويت', Manama: 'المنامة', Muscat: 'مسقط', "Sana'a": 'صنعاء', Sanaa: 'صنعاء', Aden: 'عدن', Amman: 'عمّان',
    Zarqa: 'الزرقاء', Irbid: 'إربد', Beirut: 'بيروت', Tripoli: 'طرابلس', Damascus: 'دمشق', Aleppo: 'حلب', Homs: 'حمص',
    Latakia: 'اللاذقية', Baghdad: 'بغداد', Basrah: 'البصرة', Basra: 'البصرة', Mosul: 'الموصل', Erbil: 'أربيل', Najaf: 'النجف',
    Karbala: 'كربلاء', Jerusalem: 'القدس', Gaza: 'غزة', Hebron: 'الخليل', Nablus: 'نابلس', Khartoum: 'الخرطوم', Omdurman: 'أم درمان',
    'Port Sudan': 'بورتسودان', Benghazi: 'بنغازي', Misratah: 'مصراتة', Tunis: 'تونس', Sfax: 'صفاقس', Sousse: 'سوسة',
    Algiers: 'الجزائر', Oran: 'وهران', Constantine: 'قسنطينة', Annaba: 'عنابة', Rabat: 'الرباط', Casablanca: 'الدار البيضاء',
    Marrakesh: 'مراكش', Fes: 'فاس', Tangier: 'طنجة', Agadir: 'أكادير', Meknes: 'مكناس', Nouakchott: 'نواكشوط', Mogadishu: 'مقديشو',
    Djibouti: 'جيبوتي', Moroni: 'موروني', Istanbul: 'إسطنبول', Ankara: 'أنقرة', Tehran: 'طهران', Karachi: 'كراتشي',
    Lahore: 'لاهور', Islamabad: 'إسلام آباد', Kabul: 'كابل', Dhaka: 'دكا', Jakarta: 'جاكرتا', 'Kuala Lumpur': 'كوالالمبور',
    London: 'لندن', Paris: 'باريس', Berlin: 'برلين', 'New York City': 'نيويورك', Toronto: 'تورونتو', Moscow: 'موسكو',
  };

  const egyptMin = 50000;
  const picked = all.filter(
    (c) =>
      c.population >= 150000 || c.featureCode === 'PPLC' || (c.country === 'EG' && c.population >= egyptMin) || AR[c.name]
  );
  // من غير تكرار: نفس الاسم في نفس الدولة → الأكبر بس
  const seen = new Map();
  for (const c of picked) {
    const k = `${c.country}|${c.name}`;
    if (!seen.has(k) || seen.get(k).population < c.population) seen.set(k, c);
  }
  const cities = [...seen.values()]
    .sort((a, b) => b.population - a.population)
    .map((c) => [
      c.name,
      AR[c.name] ?? '',
      c.country,
      Math.round(c.loc.coordinates[1] * 1e4) / 1e4,
      Math.round(c.loc.coordinates[0] * 1e4) / 1e4,
    ]);
  if (!cities.find((c) => c[0] === 'Alexandria' && c[2] === 'EG')) fail('الإسكندرية مش موجودة في المدن');
  write(path.join(DATA, 'cities.json'), cities);

  const codes = [...new Set(cities.map((c) => c[2]))].sort();
  const ar = new Intl.DisplayNames(['ar'], { type: 'region' });
  const en = new Intl.DisplayNames(['en'], { type: 'region' });
  const countries = Object.fromEntries(codes.map((cc) => [cc, [ar.of(cc) ?? cc, en.of(cc) ?? cc]]));
  write(path.join(DATA, 'countries.json'), countries);
}

// ───────────────────────── التجويد ─────────────────────────
{
  const { annotateVerse } = await import(pathToFileURL(path.join(ROOT, 'node_modules', 'ghunna', 'dist', 'index.js')).href);

  // تصنيف الأحكام للألوان الأربعة المتعارف عليها في مصاحف التجويد
  const CATEGORY = (rule) => {
    if (/^madd-(muttasil|munfasil|lazim|arid|lin|iwad|silah)/.test(rule)) return 0; // مد (أحمر)
    if (/ghunnah|ikhfa|iqlab|^idgham-bighunnah|^idgham-shafawi/.test(rule)) return 1; // غنة وإخفاء (أخضر)
    if (/^qalqalah/.test(rule)) return 2; // قلقلة (أزرق)
    if (/^(silent|hamzat-wasl|lam-shamsiyyah|idgham-bila-ghunnah)$/.test(rule)) return 3; // لا تُنطق (رمادي)
    return -1;
  };
  const isBase = (ch) => /[ء-يٱ]/.test(ch);
  const norm = (ch) => (ch === 'ى' || ch === 'ي' ? 'ي' : ch === 'أ' || ch === 'إ' || ch === 'آ' || ch === 'ا' ? 'ا' : ch);

  /** محاذاة الحروف الأساسية بين نصين (LCS) → خريطة: موضع في نص المكتبة → موضع في نصنا */
  function align(a, b) {
    const A = [], B = [];
    for (let i = 0; i < a.length; i++) if (isBase(a[i])) A.push(i);
    for (let j = 0; j < b.length; j++) if (isBase(b[j])) B.push(j);
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = norm(a[A[i]]) === norm(b[B[j]]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const map = new Map();
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (norm(a[A[i]]) === norm(b[B[j]])) { map.set(A[i], B[j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return { map, matched: dp[0][0], total: m };
  }

  /** نهاية «الحرف» في نصنا: الحرف الأساسي + كل العلامات اللي بعده */
  const graphemeEnd = (s, k) => {
    let e = k + 1;
    while (e < s.length && !isBase(s[e]) && s[e] !== ' ') e++;
    return e;
  };

  const out = new Array(ayahs.length);
  let matched = 0, total = 0, runs = 0;
  for (const s of surahs)
    for (let a = 1; a <= s.ayahs; a++) {
      const id = ayahId(s.id, a);
      const ours = ayahs[id - 1];
      const r = annotateVerse(s.id, a);
      const { map, matched: mt, total: tt } = align(r.text, ours);
      matched += mt; total += tt;
      const cats = new Int8Array(ours.length).fill(-1);
      for (const an of r.annotations) {
        const c = CATEGORY(an.rule);
        if (c < 0) continue;
        for (let p = an.range[0]; p < an.range[1]; p++) {
          const k = map.get(p);
          if (k === undefined) continue;
          const e = graphemeEnd(ours, k);
          for (let q = k; q < e; q++) if (cats[q] < 0 || c === 0) cats[q] = c; // المد ليه الأولوية
        }
      }
      const flat = [];
      for (let p = 0; p < cats.length; ) {
        if (cats[p] < 0) { p++; continue; }
        let e = p;
        while (e < cats.length && cats[e] === cats[p]) e++;
        flat.push(p, e - p, cats[p]);
        runs++;
        p = e;
      }
      out[id - 1] = flat;
    }
  const ratio = matched / total;
  if (ratio < 0.995) fail(`محاذاة التجويد ضعيفة: ${(ratio * 100).toFixed(2)}%`);
  console.log(`  محاذاة حروف التجويد: ${(ratio * 100).toFixed(3)}% — ${runs} موضع ملوّن`);
  write(path.join(DATA, 'quran', 'tajweed.json'), out);
}

// ───────────────────────── الترجمة الإنجليزية ─────────────────────────
{
  const d = JSON.parse(await fetchCached(SOURCES.translation, 'translation-en.json'));
  const list = d.quran;
  if (list.length !== 6236) fail(`الترجمة فيها ${list.length} آية بدل 6236`);
  const arr = new Array(6236);
  for (const v of list) arr[ayahId(v.chapter, v.verse) - 1] = v.text;
  if (arr.some((x) => typeof x !== 'string')) fail('الترجمة ناقصة');
  write(path.join(ASSETS, 'translation-en.ytd'), JSON.stringify(arr), true);
}

// ───────────────────────── التفسير الميسر ─────────────────────────
{
  const arr = new Array(6236);
  for (const s of surahs) {
    const list = JSON.parse(await fetchCached(SOURCES.tafsir(s.id), `muyassar-${s.id}.json`));
    if (!Array.isArray(list)) fail(`التفسير: ملف السورة ${s.id} مش بالشكل المتوقع`);
    for (const v of list) arr[ayahId(v.surah, v.ayah) - 1] = v.text;
  }
  const missing = arr.filter((x) => typeof x !== 'string').length;
  if (missing) fail(`التفسير ناقص ${missing} آية`);
  write(path.join(ASSETS, 'tafsir-muyassar.ytd'), JSON.stringify(arr), true);
}

const hash = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
console.log('\n✔ تم بناء البيانات الإضافية', hash(path.join(DATA, 'azkar.json')));
