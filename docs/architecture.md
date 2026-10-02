# هيكل المشروع

```
mushaf-app/
├── AGENTS.md / CLAUDE.md        تعليمات لأدوات الذكاء الاصطناعي (بتشاور على docs/)
├── app.json                     إعدادات Expo (الاسم، الـ package والـ bundle ID، الأيقونة، لون الـ splash)
├── eas.json                     بروفايلات بناء أندرويد و iOS (preview و production)
├── workbox-config.cjs           إعدادات الـ service worker لنسخة الويب
├── public/                      ملفات الويب الثابتة: manifest.json وأيقونات PWA
├── package.json                 المكتبات والأوامر
├── docs/                        التوثيق (الفولدر ده)
├── scripts/
│   └── build-quran-data.mjs     بيبني بيانات المصحف من المصادر ويتحقق منها
├── assets/                      الأيقونات والصور
└── src/
    ├── app/                     الشاشات (Expo Router) — كل ملف = شاشة
    │   ├── _layout.tsx          الجذر: تحميل الخط + الثيم + حالة القراءة + Stack
    │   ├── +html.tsx            قالب HTML للويب (اللغة، PWA، service worker)
    │   ├── (tabs)/              التابات
    │   │   ├── _layout.tsx
    │   │   ├── index.tsx        الفهرس (السور والأجزاء + متابعة القراءة)
    │   │   ├── search.tsx       البحث
    │   │   ├── bookmarks.tsx    العلامات
    │   │   └── settings.tsx     الإعدادات + مصادر البيانات
    │   └── mushaf/
    │       └── [page].tsx       القارئ (+ generateStaticParams لبناء الـ 604 صفحة على الويب)
    ├── components/
    │   ├── app-tabs.tsx         التابات الأصلية للموبايل (NativeTabs)
    │   ├── app-tabs.web.tsx     شريط التابات على الويب
    │   ├── screen.tsx           غلاف موحّد للشاشات
    │   ├── themed-text.tsx      نص بألوان الثيم
    │   ├── themed-view.tsx      View بألوان الثيم
    │   └── mushaf/
    │       ├── mushaf-page.tsx      رسم صفحة واحدة بسطورها الـ 15
    │       ├── page-pager.tsx       تقليب الصفحات (موبايل — FlatList أفقية)
    │       └── page-pager.web.tsx   تقليب الصفحات (ويب — أزرار وأسهم)
    ├── constants/
    │   ├── theme.ts             المسافات، الخطوط، اسم خط القرآن، أنواع الألوان
    │   └── rtl.ts               قيم الاتجاه (ROW، TEXT_RIGHT، rtlText) حسب لغة الجهاز
    ├── data/quran/
    │   ├── index.ts             تحميل البيانات + دوال مساعدة (السورة، الصفحة، الجزء، الأرقام)
    │   ├── search.ts            البحث وتبسيط النص
    │   └── *.json               بيانات مولّدة — ممنوع التعديل بالإيد
    ├── hooks/
    │   └── use-theme.ts         ألوان الثيم الحالي بمفاتيح مختصرة
    ├── store/
    │   └── reading-store.tsx    آخر صفحة + العلامات (AsyncStorage)
    └── theme/
        ├── theme.ts             تعريف الـ 7 ثيمات
        ├── ThemeContext.tsx     اختيار الثيم وحفظه
        └── ThemePicker.tsx      واجهة اختيار الثيم
```

## ترتيب الـ Providers

```
ThemeProvider            (src/theme/ThemeContext.tsx)
└── ReadingProvider      (src/store/reading-store.tsx)
    └── RootStack        بيستنى الخط والإعدادات المحفوظة، وبعدين يخفي الـ splash
        ├── (tabs)
        └── mushaf/[page]
```

## الحالة والتخزين

| المفتاح في AsyncStorage | المحتوى | الملف |
|---|---|---|
| `mushaf.themeMode` | الثيم المختار أو `system` | `ThemeContext.tsx` |
| `mushaf.tajweedEnabled` | تشغيل ألوان التجويد (`1`/`0`) | `ThemeContext.tsx` |
| `mushaf.lastRead` | `{ page, at }` آخر صفحة اتقرت | `reading-store.tsx` |
| `mushaf.bookmarks` | قائمة العلامات `{ id, page, ayahId?, createdAt }` | `reading-store.tsx` |

## المكتبات الأساسية

| المكتبة | الاستخدام |
|---|---|
| `expo-router` | التنقل والتابات |
| `@shopify/flash-list` | القوايم الطويلة |
| `@react-native-async-storage/async-storage` | حفظ الإعدادات والعلامات |
| `@expo-google-fonts/scheherazade-new` | خط نص القرآن |
| `expo-splash-screen` | شاشة البداية لحد ما الخط يتحمّل |
| `expo-asset` | مطلوبة لـ `expo-audio` |
| `workbox-cli` (dev) | توليد الـ service worker للويب |

مكتبات متسطّبة ولسه مش مستخدمة (للمراحل الجاية): `expo-audio`، `expo-file-system`، `expo-sqlite`.
