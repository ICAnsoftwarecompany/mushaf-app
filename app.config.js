/**
 * إعدادات Expo الديناميكية: بتقرا app.json وتضيف صوت الأذان الكامل لو ملفه موجود.
 * ضيف ملف أذان برخصة واضحة في assets/sounds/adhan.wav (docs/platforms.md) وابنِ من جديد.
 */
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const adhanFile = path.join(__dirname, 'assets', 'sounds', 'adhan.wav');
  const hasAdhan = fs.existsSync(adhanFile);
  const plugins = (config.plugins ?? []).map((p) => {
    if (hasAdhan && Array.isArray(p) && p[0] === 'expo-notifications') {
      return ['expo-notifications', { ...p[1], sounds: ['./assets/sounds/adhan.wav'] }];
    }
    return p;
  });
  return { ...config, plugins, extra: { ...(config.extra ?? {}), adhanSound: hasAdhan } };
};
