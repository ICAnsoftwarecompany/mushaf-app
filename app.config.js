/**
 * إعدادات Expo الديناميكية: بتقرا app.json وتضيف صوت الأذان لو ملفاته موجودة:
 *   assets/sounds/adhan.mp3        الأذان كامل (أندرويد)
 *   assets/sounds/adhan_short.wav  أقل من ٣٠ ثانية (iOS — حد آبل لصوت الإشعار)
 * مصدر الملفات ورخصتها في docs/data.md.
 *
 * وكمان بيضيف extra.commit (الكوميت اللي التطبيق اتبنى منه) علشان يظهر جنب رقم الإصدار في الإعدادات.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** أول ٧ حروف من الكوميت: من git لو موجود، أو من متغير EAS وقت البناء على سيرفراتهم */
function gitCommit() {
  try {
    return execSync('git rev-parse --short=7 HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    const eas = process.env.EAS_BUILD_GIT_COMMIT_HASH;
    return eas ? eas.slice(0, 7) : null;
  }
}

module.exports = ({ config }) => {
  const file = (n) => path.join(__dirname, 'assets', 'sounds', n);
  const android = fs.existsSync(file('adhan.mp3'));
  const ios = fs.existsSync(file('adhan_short.wav'));
  const sounds = [android && './assets/sounds/adhan.mp3', ios && './assets/sounds/adhan_short.wav'].filter(Boolean);
  const plugins = (config.plugins ?? []).map((p) => {
    if (sounds.length && Array.isArray(p) && p[0] === 'expo-notifications') {
      return ['expo-notifications', { ...p[1], sounds }];
    }
    return p;
  });
  return { ...config, plugins, extra: { ...(config.extra ?? {}), adhanSound: { android, ios }, commit: gitCommit() } };
};
