// إعدادات Metro: ملفات .ytd (بيانات JSON كبيرة زي التفسير والترجمة) بتتعامل كـ assets
// علشان تتحمّل وقت الحاجة بس، ومتدخلش في حجم كود التطبيق.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('ytd');

module.exports = config;
