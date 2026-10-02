// إعدادات الـ service worker لنسخة الويب (بيتولّد بعد `expo export`)
// بيحفظ ملفات التطبيق والخط وبيانات المصحف في المتصفح، فالموقع يشتغل من غير إنترنت بعد أول زيارة.
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,ttf,woff,woff2,png,ico,json}', 'index.html', '+not-found.html', 'search.html', 'bookmarks.html', 'settings.html'],
  globIgnores: ['sw.js', 'workbox-*.js'],
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  swDest: 'dist/sw.js',
  // صفحات المصحف الـ 604 بتتحفظ أول ما تتفتح، ولو مش محفوظة والجهاز أوفلاين بنرجّع الصفحة الرئيسية
  // والتطبيق نفسه بيفتح الصفحة المطلوبة من الرابط
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: { cacheName: 'pages', networkTimeoutSeconds: 3, expiration: { maxEntries: 700 } },
    },
  ],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
};
