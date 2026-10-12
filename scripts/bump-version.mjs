/**
 * رقم الإصدار (X.Y.Z) — مصدره app.json (expo.version) وبيتنسخ لـ package.json و package-lock.json.
 *
 *   node scripts/bump-version.mjs patch     1.1.0 → 1.1.1   (تلقائي مع كل رفع على GitHub — .github/workflows/version.yml)
 *   node scripts/bump-version.mjs minor     1.1.4 → 1.2.0   (ميزة كبيرة — بإيدك: npm run version:minor)
 *   node scripts/bump-version.mjs major     1.2.0 → 2.0.0
 *   node scripts/bump-version.mjs 1.3.0     رقم محدد
 *   node scripts/bump-version.mjs --check   يتأكد إن الملفات متطابقة (من غير تعديل)
 *
 * رقم البناء (versionCode / buildNumber) منفصل: EAS بيزوّده لوحده مع كل APK أو AAB (eas.json → autoIncrement).
 * التفاصيل في docs/platforms.md («الإصدارات»).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (p) => path.join(ROOT, p);
const readJson = (p) => JSON.parse(fs.readFileSync(file(p), 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(file(p), `${JSON.stringify(v, null, 2)}\n`);
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const app = readJson('app.json');
const pkg = readJson('package.json');
const current = app.expo.version;
const arg = process.argv[2] ?? 'patch';

if (!SEMVER.test(current)) {
  console.error(`app.json expo.version مش بالشكل X.Y.Z: ${current}`);
  process.exit(1);
}

if (arg === '--check') {
  if (pkg.version !== current) {
    console.error(`package.json (${pkg.version}) ≠ app.json (${current}) — شغّل: node scripts/bump-version.mjs ${current}`);
    process.exit(1);
  }
  console.log(current);
  process.exit(0);
}

let [, major, minor, patch] = current.match(SEMVER).map(Number);
let next;
if (arg === 'patch') next = `${major}.${minor}.${patch + 1}`;
else if (arg === 'minor') next = `${major}.${minor + 1}.0`;
else if (arg === 'major') next = `${major + 1}.0.0`;
else if (SEMVER.test(arg)) next = arg;
else {
  console.error(`استخدام: patch | minor | major | X.Y.Z | --check`);
  process.exit(1);
}

app.expo.version = next;
writeJson('app.json', app);
pkg.version = next;
writeJson('package.json', pkg);
if (fs.existsSync(file('package-lock.json'))) {
  const lock = readJson('package-lock.json');
  lock.version = next;
  if (lock.packages?.['']) lock.packages[''].version = next;
  writeJson('package-lock.json', lock);
}
console.log(next);
