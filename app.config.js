/**
 * إعدادات Expo الديناميكية: بتقرا app.json وتضيف صوت الأذان لو ملفاته موجودة:
 *   assets/sounds/adhan.mp3        الأذان كامل (أندرويد)
 *   assets/sounds/adhan_short.wav  أقل من ٣٠ ثانية (iOS — حد آبل لصوت الإشعار)
 * مصدر الملفات ورخصتها في docs/data.md.
 */
const fs = require('fs');
const path = require('path');

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
  return { ...config, plugins, extra: { ...(config.extra ?? {}), adhanSound: { android, ios } } };
};
