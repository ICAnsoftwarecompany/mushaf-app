/**
 * قالب HTML لنسخة الويب: اللغة والاتجاه، ألوان المتصفح، ملف PWA، وتسجيل الـ service worker
 * علشان الموقع يتسطّب زي التطبيق ويشتغل من غير إنترنت بعد أول زيارة.
 * (الملف ده بيتستخدم على الويب بس — مش بيأثر على أندرويد و iOS)
 */
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const registerServiceWorker = `
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;

export default function Root({ children }: PropsWithChildren) {
  // من غير dir="rtl": الاتجاه بيتظبط في الشاشات نفسها عن طريق src/constants/rtl.ts
  return (
    <html lang="ar">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="يتلو — المصحف الشريف برواية حفص عن عاصم، بترتيب صفحات مصحف المدينة، ويعمل بدون إنترنت" />
        <meta name="theme-color" content="#FDF6E3" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1A1A" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="يتلو" />
        <title>يتلو — المصحف الشريف</title>
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
