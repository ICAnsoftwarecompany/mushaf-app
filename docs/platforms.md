# المنصات: ويب وأندرويد و iOS

المشروع كود واحد بيطلع منه **3 نسخ**. أي ميزة جديدة لازم تشتغل على التلاتة (القاعدة 11 في [rules.md](rules.md)).

| | الويب | أندرويد | iOS |
|---|---|---|---|
| **البناء** | `npm run build:web` | EAS Build (على السحابة) | EAS Build (على السحابة، من غير ماك) |
| **الناتج** | فولدر `dist/` (موقع ثابت) | APK للتجربة، AAB للمتجر | IPA عن طريق TestFlight / App Store |
| **الأوفلاين** | بعد أول زيارة (PWA + service worker) | دايمًا | دايمًا |
| **التقليب** | أزرار + أسهم الكيبورد | سحب | سحب |
| **مشاركة الآية** | مشاركة المتصفح أو نسخ | متاحة | متاحة |
| **الإشعارات** (أذان، أذكار، ورد، كهف) | مش متاحة | محلية (مش في Expo Go) | محلية (حد 64 إشعار) |
| **التلاوة والاستماع** (تاب الاستماع، قوايم) | أونلاين بس | أونلاين + تحميل سورة أو جزء | أونلاين + تحميل سورة أو جزء |
| **التلاوة في الخلفية / إشعار التشغيل وشاشة القفل** | لا | محتاج development build أو APK | محتاج development build |
| **المشغّل الصغير جوه التطبيق** | نعم | نعم | نعم |
| **التكبير بإصبعين في القارئ** | شاشات اللمس | نعم | نعم |
| **القبلة (بوصلة)** | الزاوية بس | بوصلة | بوصلة |
| **الاهتزاز / الشاشة منورة** | لا | نعم | نعم |
| **النسخ الاحتياطي** | تنزيل ملف + رفع | مشاركة ملف + اختيار ملف | مشاركة ملف + اختيار ملف |
| **صفحتين جنب بعض** | الشاشات العريضة | أفقي / تابلت | أفقي / آيباد |
| **مكان الحفظ** | المتصفح (localStorage) | الجهاز | الجهاز |

## الهوية

| | القيمة | الملف |
|---|---|---|
| اسم التطبيق | يتلو | `app.json` → `expo.name` |
| الـ slug والـ scheme | `yatlu` | `app.json` → `expo.slug` و `expo.scheme` |
| Android package | `com.icansoftware.yatlu` | `app.json` → `expo.android.package` |
| iOS bundle ID | `com.icansoftware.yatlu` | `app.json` → `expo.ios.bundleIdentifier` |
| رقم الإصدار | `1.0.0` | `app.json` → `expo.version` |
| مشروع EAS | `@moumenhafez/yatlu` (`8817d3ac-af3d-429e-8d06-e58f741e872d`) | `app.json` → `expo.owner` و `expo.extra.eas.projectId` |

> ⚠️ الـ package والـ bundle ID **مينفعش يتغيروا بعد أول نشر** على المتجر. لو عايز تغيّرهم، غيّرهم دلوقتي.

أرقام البناء (versionCode و buildNumber) بتزيد لوحدها مع كل بناء production، لأن `eas.json` فيه `appVersionSource: "remote"` و `autoIncrement: true`.

---

## الويب

### البناء والتجربة

```bash
npm run build:web     # بيبني الموقع في dist/ ومعاه الـ service worker
npm run serve:web     # بيشغّله محليًا للتجربة
```

البناء بيعمل الآتي:

1. `expo export --platform web` بيبني صفحة HTML لكل شاشة، ولكل صفحة من صفحات المصحف الـ 604 (عن طريق `generateStaticParams` في `src/app/mushaf/[page].tsx`). علشان كده أي لينك زي `/mushaf/50` بيفتح مباشرة على أي استضافة، من غير إعدادات إضافية.
2. `workbox generateSW` بيعمل `dist/sw.js` بالإعدادات اللي في `workbox-config.cjs`.

### الأوفلاين (PWA)

- `public/manifest.json` و `public/icon-192.png` و `public/icon-512.png`: بيخلّوا الموقع يتسطّب على الموبايل والكمبيوتر زي التطبيق.
- `src/app/+html.tsx`: قالب الصفحة. فيه اللغة، وألوان المتصفح، وربط الـ manifest، وتسجيل الـ service worker.
- الـ service worker بيحفظ ملفات التطبيق والخط وبيانات المصحف (حوالي 6 ميجا) من أول زيارة. صفحات المصحف بتتحفظ لما تتفتح، ولو صفحة مش محفوظة والجهاز أوفلاين، الصفحة الرئيسية بتتحمّل والتطبيق بيفتح الصفحة المطلوبة.
- **الـ service worker مش بيشتغل على `localhost`** علشان ما يعملش مشاكل مع `expo start`. لتجربة الأوفلاين محليًا افتح `http://127.0.0.1:...` بدل `localhost`.

### النشر

فولدر `dist/` موقع ثابت، ينفع يترفع على أي استضافة:

```bash
npx eas-cli@latest deploy          # EAS Hosting (من Expo)
```

أو ارفع فولدر `dist/` كما هو على Netlify أو Vercel أو Cloudflare Pages أو GitHub Pages. **لازم HTTPS** علشان الـ PWA تشتغل (كل الاستضافات دي بتوفره).

---

## أندرويد و iOS

بنستخدم **EAS Build**: البناء بيحصل على سيرفرات Expo، فمش محتاج Android Studio ولا ماك.

### أول مرة

```bash
npx eas-cli@latest login       # حساب Expo مجاني من expo.dev
npx eas-cli@latest init        # بيربط المشروع بحسابك (بيضيف projectId في app.json)
```

### البروفايلات (`eas.json`)

| البروفايل | الاستخدام | أندرويد | iOS |
|---|---|---|---|
| `preview` | تجربة على أجهزة حقيقية | ملف **APK** تسطّبه مباشرة | محتاج تسجيل الأجهزة (`eas device:create`) |
| `production` | النشر على المتاجر | **AAB** لـ Google Play | للـ App Store و TestFlight |

### أندرويد

```bash
npx eas-cli@latest build --platform android --profile preview      # APK للتجربة
npx eas-cli@latest build --platform android --profile production   # AAB للمتجر
npx eas-cli@latest submit --platform android                       # رفع على Google Play
```

بعد ما البناء يخلص، EAS بيديك لينك تنزّل منه الـ APK على أي موبايل أندرويد.

**للنشر:** محتاج حساب **Google Play Console** (رسوم مرة واحدة)، وأول رفع لازم يتعمل يدوي من الموقع.

### iOS

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios      # رفع على App Store Connect / TestFlight
```

**محتاج حساب Apple Developer** (اشتراك سنوي). EAS بيعمل الشهادات والتوقيع لوحده، ومش محتاج ماك. التجربة الأسهل على الآيفون بتكون عن طريق **TestFlight** بعد الـ submit.

### Expo Go مقابل البناء الحقيقي

- **Expo Go** للتطوير السريع بس. فيه مكتبات Expo الأساسية، وبيتجاهل بعض إعدادات `app.json` (زي الاسم والأيقونة والاتجاه).
- لو ضفت مكتبة native مش موجودة في Expo Go (زي `react-native-track-player`)، هتحتاج **development build**: سطّب `expo-dev-client` وضيف بروفايل `development` في `eas.json`. الخطوات في وثائق Expo.

---

## قبل أي نشر

- [ ] مراجعة متخصص لعرض الصفحات (القاعدة 1 في [rules.md](rules.md))
- [x] أيقونة التطبيق وشاشة البداية بهوية «يتلو» ([brand.md](brand.md))
- [ ] تجربة على أندرويد و iOS والويب
- [ ] زيادة `version` في `app.json` وتسجيل التغييرات في [changelog.md](changelog.md)
- [x] صفحة سياسة الخصوصية جوه التطبيق (`/privacy`) — لسه محتاجة تتنشر على رابط ويب للمتاجر
- [ ] ملء `LINKS.contactEmail` و `LINKS.appStoreId` في `src/constants/brand.ts`
- [ ] تجربة فولدرات القرّاء في EveryAyah على جهاز حقيقي

---

## إضافات `app.json` (native)

| الإضافة | السبب |
|---|---|
| `expo-location` | إذن الموقع (نص عربي + إنجليزي) للمواقيت والقبلة |
| `expo-notifications` | الإشعارات المحلية؛ قنوات أندرويد: `adhan` و `adhan-silent` و `reminders` |
| `expo-audio` (`enableBackgroundPlayback`) | التلاوة في الخلفية (UIBackgroundModes audio على iOS) |

- `orientation: "default"` — الوضع الأفقي مسموح علشان الصفحتين.
- **Expo Go:** المواقيت والقبلة والتلاوة بتشتغل. **الإشعارات مقفولة في Expo Go على أندرويد** (Expo Go شال `expo-notifications` من SDK 53، ومجرد استيرادها بيوقّع التطبيق)، فالمكتبة بتتحمّل وقت الحاجة بس، والإعدادات بتعرض تنبيه. التلاوة في الخلفية والتحكم من شاشة القفل كمان محتاجين development build (`eas build --profile development` أو `npx expo run:android`).
- **حد iOS (64 إشعار):** الأذان بيتجدول لـ 10 أيام (أو 5 لو التنبيه قبل الصلاة مفعّل، ويوم أقل لو تذكير الفروض مفعّل)، وتذكير الفروض للنهارده وبكرة، وكله بيتجدد كل ما التطبيق يتفتح أو تعلّم على صلاة.
- **صوت الأذان:** حاليًا صوت الإشعار الافتراضي أو صامت. صوت أذان مخصص محتاج ملف صوتي برخصة واضحة (مهمة في [roadmap.md](roadmap.md)).
- **الويب:** ملفات `.ytd` (التفسير والترجمة) وكل صفحات الشاشات الجديدة داخلة في الـ precache (حوالي 13 ميجا).

## التنبيهات وصوت الأذان

- **خطة واحدة** (`plan.ts`) لكل التنبيهات لـ ٧ أيام قدام. الموبايل بيجدول **أقرب 60** (حد iOS 64)، وده بيكفي حوالي ٤–٦ أيام. الخطة بتتجدد كل ما التطبيق يتفتح أو الإعدادات/الفروض/القراءة تتغير — **لو التطبيق ما اتفتحش أسبوع، الإشعارات هتقف لحد ما يتفتح.**
- **قنوات أندرويد:** `adhan` (أو `adhan-full` لما صوت الأذان الكامل موجود)، `adhan-silent`، `prayer-alerts` (التنبيه قبل الصلاة والفروض)، `reminders`.
- **صوت الأذان الكامل حتى والتطبيق مقفول:** محتاج ملف أذان **برخصة واضحة** في `assets/sounds/adhan.wav`. `app.config.js` بيضيفه لإضافة `expo-notifications` تلقائيًا وقت البناء، والتطبيق بيستخدمه لقناة الأذان. من غيره: صوت التنبيه العادي. بعد إضافته لازم بناء جديد (مش Expo Go). على iOS صوت الإشعار لازم يكون **أقل من ٣٠ ثانية** وإلا بيشتغل الصوت الافتراضي. وفي الإعدادات «صوت الأذان» بيقفله.
- **الويب ووقت Expo Go أندرويد:** مفيش إشعارات برّه التطبيق، بس مركز التنبيهات والكارت اللي فوق والعد التنازلي شغالين.
