# هيكل المشروع

```
mushaf-app/  (اسم المستودع — التطبيق اسمه «يتلو»)
├── AGENTS.md / CLAUDE.md        تعليمات لأدوات الذكاء الاصطناعي (بتشاور على docs/)
├── app.json                     إعدادات Expo (الاسم، المعرّف، الأيقونات، الأذونات، الإضافات)
├── eas.json                     بروفايلات بناء أندرويد و iOS
├── metro.config.js              ملفات .ytd (بيانات كبيرة) بتتعامل كـ assets
├── eslint.config.js             إعدادات الـ lint
├── workbox-config.cjs           الـ service worker لنسخة الويب
├── public/                      ملفات الويب الثابتة: manifest.json وأيقونات PWA
├── docs/                        التوثيق (الفولدر ده)
├── scripts/
│   ├── build-quran-data.mjs     بيبني بيانات المصحف من المصادر ويتحقق منها
│   ├── build-extra-data.mjs     الأذكار، المدن، التجويد، التفسير، الترجمة
│   ├── tests/data.test.mjs      اختبارات سلامة البيانات (npm test)
│   └── brand/                   توليد لوجو الاسم كـ SVG
├── assets/
│   ├── brand/                   ملفات اللوجو الأصلية (SVG)
│   ├── data/                    التفسير والترجمة (.ytd) — بيتحمّلوا وقت الحاجة
│   └── images/                  الأيقونات وشاشة البداية (PNG)
└── src/
    ├── app/                     الشاشات (Expo Router) — كل ملف = شاشة
    │   ├── _layout.tsx          الجذر: الـ Providers + الخطوط + الشاشة الافتتاحية + جدولة الإشعارات
    │   ├── +html.tsx            قالب HTML للويب (PWA، service worker)
    │   ├── (tabs)/              التابات: index (المصحف)، prayer، azkar، listen، settings
    │   ├── mushaf/[page].tsx    القارئ (+ generateStaticParams للويب)
    │   ├── azkar/[id].tsx       قسم أذكار بعدّادات
    │   ├── search.tsx           البحث
    │   ├── playlist.tsx         قايمة استماع (?id=)
    │   ├── bookmarks.tsx        العلامات
    │   ├── goto.tsx             الانتقال لصفحة أو آية
    │   ├── qibla.tsx            اتجاه القبلة
    │   ├── tasbih.tsx           السبحة
    │   ├── city.tsx             اختيار المدينة / GPS
    │   ├── method.tsx           طريقة حساب المواقيت
    │   ├── reciter.tsx          اختيار القارئ
    │   ├── about.tsx            عن التطبيق + مصادر البيانات
    │   └── privacy.tsx          سياسة الخصوصية
    ├── components/
    │   ├── ui/index.tsx         Txt، Row، Card، Btn، Toggle، Segmented، Stepper، Section، SettingRow، Icon
    │   ├── screen.tsx           غلاف الشاشات (عنوان + رجوع + أزرار)
    │   ├── app-tabs.tsx         التابات الأصلية (موبايل)
    │   ├── app-tabs.web.tsx     شريط التابات (ويب)
    │   ├── brand/intro-screen.tsx   الشاشة الافتتاحية
    │   ├── listen/              الاستماع: now-playing، list-row، download-button، add-to-playlist، name-prompt
    │   └── mushaf/
    │       ├── mushaf-page.tsx      صفحة بسطورها الـ 15 (+ التجويد والهامش والأحزاب)
    │       ├── page-pager.tsx       تقليب الصفحات (موبايل — FlatList، صفحة أو صفحتين)
    │       ├── page-pager.web.tsx   تقليب الصفحات (ويب — أزرار وأسهم)
    │       ├── text-reader.tsx      وضع النص المتصل (+ الترجمة)
    │       ├── tafsir-sheet.tsx     التفسير والترجمة للآية
    │       └── audio-bar.tsx        شريط التلاوة
    ├── constants/
    │   ├── theme.ts             المسافات، الخطوط، أسماء خطوط القرآن
    │   ├── brand.ts             ألوان الهوية، آية الاسم، روابط «عن التطبيق»
    │   └── rtl.ts               اتجاه الجهاز الأصلي (IS_RTL_LAYOUT)
    ├── data/
    │   ├── quran/index.ts       بيانات المصحف + دوال مساعدة (السورة، الصفحة، الجزء، الأحزاب، السجدات)
    │   ├── quran/search.ts      البحث وتبسيط النص
    │   ├── quran/extra.ts       التفسير والترجمة (تحميل وقت الحاجة) + تقطيع التجويد
    │   ├── quran/load-text*.ts  قراءة ملفات .ytd (موبايل / ويب)
    │   ├── azkar.ts             الأذكار
    │   └── *.json               بيانات مولّدة — ممنوع التعديل بالإيد
    ├── features/
    │   ├── prayer/              مواقيت الصلاة، القبلة، المدن، التاريخ الهجري، تحديد الموقع
    │   ├── audio/               audio-store (المشغّل + طابور السور + البسملة)، reciters، offline (ملفات الجهاز)،
    │   │                        downloads (طابور التحميل المشترك + useDownloads)
    │   ├── notifications/       جدولة الإشعارات المحلية (موبايل) — الويب فاضي
    │   └── backup*.ts           النسخ الاحتياطي (موبايل / ويب)
    ├── i18n/
    │   ├── strings.ts           كل نصوص الواجهة بالعربي والإنجليزي
    │   └── index.ts             useI18n(): t، lang، dir، num
    ├── store/
    │   ├── settings-store.tsx   كل الإعدادات
    │   └── reading-store.tsx    آخر صفحة + العلامات + الختمة والورد + قوايم الاستماع
    ├── hooks/use-theme.ts       ألوان الثيم الحالي (للتابات)
    └── theme/
        ├── theme.ts             الـ 7 ثيمات وألوان التجويد
        └── ThemeContext.tsx     اختيار الثيم + الوضع الليلي بالمواقيت + تشغيل التجويد
```

## ترتيب الـ Providers

```
SettingsProvider         كل الإعدادات (اللغة، الخطوط، المواقيت، الإشعارات…)
└── ThemeProvider        الثيم (وبيقرا الإعدادات علشان الوضع الليلي بالمواقيت)
    └── ReadingProvider  آخر صفحة + العلامات + الختمة
        └── AudioProvider    مشغّل التلاوة
            └── RootStack    بيستنى كل حاجة تتحمّل، يخفي الـ splash، يعرض الشاشة الافتتاحية،
                             ويعيد جدولة الإشعارات (NotificationsSync)
```

## التخزين على الجهاز (AsyncStorage)

| المفتاح | المحتوى | الملف |
|---|---|---|
| `yatlu.settings` | كل الإعدادات (`Settings`) | `settings-store.tsx` |
| `mushaf.themeMode` | الثيم المختار أو `system` | `ThemeContext.tsx` |
| `mushaf.tajweedEnabled` | ألوان التجويد (`1`/`0`) | `ThemeContext.tsx` |
| `mushaf.lastRead` | `{ page, at }` | `reading-store.tsx` |
| `mushaf.bookmarks` | `{ id, page, ayahId?, createdAt }[]` | `reading-store.tsx` |
| `yatlu.khatma` | `{ nextPage, startedAt, lastDoneDay, completed }` | `reading-store.tsx` |
| `yatlu.playlists` | `{ id, name, surahs[], createdAt }[]` (داخلة في النسخة الاحتياطية) | `reading-store.tsx` |

ملفات التلاوة المتحمّلة: `<Documents>/audio/<القارئ>/<SSSAAA>.mp3` (موبايل بس). تحميل السورة بيشمل `001001.mp3` (البسملة). التحميل بيتكتب في `.part` الأول وبعدين يتنقل، علشان ملف ناقص ما يتحسبش متحمّل.

## المكتبات

| المكتبة | الاستخدام |
|---|---|
| `expo-router` | التنقل والتابات |
| `@shopify/flash-list` | القوايم الطويلة ووضع النص المتصل |
| `@react-native-async-storage/async-storage` | التخزين |
| `@expo-google-fonts/scheherazade-new` | خط القرآن (عادي وعريض) |
| `adhan` | مواقيت الصلاة والقبلة (أوفلاين) |
| `hijri-converter` | التاريخ الهجري (أم القرى) |
| `ghunna` | أحكام التجويد (وقت البناء بس، في `build-extra-data`) |
| `expo-audio` | التلاوة + التحكم من شاشة القفل |
| `expo-file-system` | تحميل التلاوات وقراءة الملفات |
| `expo-notifications` | الإشعارات المحلية |
| `expo-location` | الموقع والبوصلة |
| `expo-haptics` | الاهتزاز |
| `expo-keep-awake` | الشاشة منورة أثناء القراءة |
| `expo-clipboard` | نسخ الآية |
| `expo-sharing`، `expo-document-picker` | النسخ الاحتياطي |
| `expo-localization` | لغة الجهاز (الافتراضي) |
| `expo-application`، `expo-constants` | رقم الإصدار |
| `expo-asset` | ملفات .ytd + مطلوبة لـ expo-audio |
| `workbox-cli` (dev) | الـ service worker للويب |
| `eslint`، `eslint-config-expo` (dev) | الـ lint |
