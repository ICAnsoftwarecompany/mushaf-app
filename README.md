# تطبيق المصحف

مصحف بيطلع منه 3 نسخ من نفس الكود (ويب، أندرويد، iOS)، مبني بـ Expo و React Native: رواية حفص عن عاصم، بترتيب صفحات مصحف المدينة النبوية (604 صفحة)، ويشتغل بالكامل من غير إنترنت.

## البداية

```bash
npm install
npx expo start --clear
```

## التوثيق

كل التوثيق في فولدر [`docs/`](docs/README.md):

- [الفهرس](docs/README.md)
- [قواعد المشروع](docs/rules.md) — اقراها قبل أي تعديل
- [التجهيز والتشغيل](docs/setup.md)
- [المنصات: البناء والنشر](docs/platforms.md)
- [هيكل المشروع](docs/architecture.md)
- [الشاشات](docs/screens.md)
- [بيانات المصحف والمصادر](docs/data.md)
- [الثيمات](docs/themes.md)
- [خطة المراحل](docs/roadmap.md)
- [سجل التغييرات](docs/changelog.md)

## المصادر والتراخيص

نص القرآن من موسوعة القرآن الكريم QuranEnc.com (CC BY 4.0)، وترتيب الصفحات من `quran-qcf4` (JSON، MIT)، والأجزاء والأحزاب من `quran-meta` (MIT)، والخط Scheherazade New (SIL OFL). التفاصيل في [docs/data.md](docs/data.md).
