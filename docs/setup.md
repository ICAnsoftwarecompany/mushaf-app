# تجهيز وتشغيل المشروع

## المتطلبات

- **Node.js** نسخة LTS حديثة (22 أو أحدث). اعرف نسختك بـ `node -v`.
- **Git**.
- **VS Code** (اختياري).
- تطبيق **Expo Go** على الموبايل، من Play Store أو App Store.
- للمحاكي: **Android Studio** (شوف تحت).

## أول مرة

```bash
git clone https://github.com/ICAnsoftwarecompany/mushaf-app.git
cd mushaf-app
npm install
npx expo start --clear
```

بيانات المصحف موجودة في المشروع جاهزة، فمش محتاج تشغّل `npm run build:quran-data` إلا لو هتغيّر في البيانات.

## بعد أي `git pull`

```bash
git pull
npm install
npx expo start --clear
```

`npm install` مهم بعد أي pull، لأن ممكن تكون اتضافت مكتبات جديدة.

## طرق العرض

| الطريقة | الخطوات |
|---|---|
| **الموبايل** (الأدق) | الموبايل والكمبيوتر على نفس الواي فاي ← افتح Expo Go ← اعمل Scan للـ QR code |
| **الويب** (معاينة سريعة) | اضغط `w` في الـ terminal |
| **محاكي أندرويد** | شغّل المحاكي الأول، وبعدين اضغط `a` |

لو الموبايل مش راضي يتصل:

```bash
npx expo start --tunnel
```

ولو ويندوز سألك عن **Windows Firewall**، اختار **Allow access**.

## محاكي أندرويد على ويندوز

1. سطّب **Android Studio**، وبعدها افتح **More Actions ← Virtual Device Manager ← Create Device**، واختار جهاز زي Pixel 7 مع نسخة أندرويد حديثة.
2. ضيف متغيرات البيئة: `ANDROID_HOME` = `C:\Users\<اسمك>\AppData\Local\Android\Sdk`، وضيف للـ Path:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   ```
3. اقفل VS Code وافتحه تاني، وبعدين:
   ```bash
   emulator -list-avds
   emulator -avd <اسم الجهاز>
   ```
4. في terminal تاني: `npx expo start` واضغط `a`.

محاكي iOS بيشتغل على الماك بس. على ويندوز جرّب iOS بـ Expo Go على آيفون حقيقي.

## مشاكل متكررة وحلولها

| المشكلة | الحل |
|---|---|
| `Unable to resolve module @react-native-async-storage/async-storage` (أو أي مكتبة) | المكتبة مش متسطّبة عندك: `npm install` وبعدين `npx expo start --clear` |
| `'Need' is not recognized...` أو `npm error canceled` | لزقت أكتر من أمر مرة واحدة. نفّذ كل أمر لوحده، أو استخدم `npx --yes ...` |
| `mkdir -p` مش شغال في cmd | على ويندوز اكتبه من غير `-p`: `mkdir src\theme` |
| Expo Go بيقول إن نسخة المشروع مش متوافقة | حدّث Expo Go من المتجر |
| التعديلات مش بتظهر | `npx expo start --clear` |
| ميزة محتاجة مكتبة native مش في Expo Go | محتاج development build: `npx expo install expo-dev-client` وبعدين `npx expo run:android` |

## ملاحظات

- **متشغّلش `reset-project`**. السكربت ده كان جاي مع قالب Expo واتشال، لأنه بيمسح شاشات التطبيق.
- فولدر `.quran-sources/` بيتعمل لما تبني البيانات، ومتجاهل في git.
