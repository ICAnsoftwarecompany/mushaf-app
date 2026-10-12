/**
 * إضافة Expo (أندرويد): الحفاظ على بيانات يتلو لما التطبيق يتمسح.
 *
 * 1) android:hasFragileUserData="true" — أندرويد ١٠+ بيعرض في رسالة إلغاء التثبيت اختيار
 *    «الاحتفاظ ببيانات التطبيق». لو المستخدم علّم عليه: التلاوات المتحمّلة والإعدادات والعلامات والختمة
 *    بتفضل على الموبايل، ولما يتثبّت يتلو تاني (نفس التوقيع) بيلاقيها زي ما هي.
 *    (التطبيق نفسه مينفعش يعرض رسالة وقت المسح — النظام هو اللي بيعرضها.)
 *
 * 2) قواعد النسخ الاحتياطي (Google Auto Backup): الإعدادات والعلامات والختمة بتتنسخ لحساب جوجل
 *    وبترجع لوحدها لو التطبيق اتثبّت تاني (حتى على موبايل جديد)، **من غير** ملفات التلاوة
 *    (حد النسخ ٢٥ ميجا — لو الملفات اتنسخت والحجم عدّى الحد، أندرويد بيبطّل ينسخ أي حاجة).
 *
 * التفاصيل في docs/platforms.md.
 */
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// files/audio = Paths.document/audio في src/features/audio/offline.ts
const FULL_BACKUP = `<?xml version="1.0" encoding="utf-8"?>
<!-- أندرويد ١١ وأقدم: كل حاجة ما عدا التلاوات المتحمّلة (ممكن تبقى جيجات) -->
<full-backup-content>
  <exclude domain="file" path="audio/" />
</full-backup-content>
`;

const DATA_EXTRACTION = `<?xml version="1.0" encoding="utf-8"?>
<!-- أندرويد ١٢+: نفس القواعد للنسخ على حساب جوجل وللنقل لموبايل جديد -->
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="file" path="audio/" />
  </cloud-backup>
  <device-transfer>
    <exclude domain="file" path="audio/" />
  </device-transfer>
</data-extraction-rules>
`;

function withKeepData(config) {
  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:hasFragileUserData'] = 'true';
    app.$['android:allowBackup'] = 'true';
    app.$['android:fullBackupContent'] = '@xml/yatlu_backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/yatlu_data_extraction_rules';
    return cfg;
  });
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'yatlu_backup_rules.xml'), FULL_BACKUP);
      fs.writeFileSync(path.join(dir, 'yatlu_data_extraction_rules.xml'), DATA_EXTRACTION);
      return cfg;
    },
  ]);
  return config;
}

module.exports = withKeepData;
