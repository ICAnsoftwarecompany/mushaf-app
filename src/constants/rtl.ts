/**
 * اتجاه الواجهة من اليمين للشمال — بيشتغل صح سواء الموبايل لغته عربي أو إنجليزي.
 *
 * لو لغة الجهاز عربي، React Native بيقلب التخطيط تلقائيًا (I18nManager.isRTL = true):
 * - 'row' بيرصّ العناصر من اليمين، فمش محتاجين 'row-reverse'
 * - textAlign 'right' بيتقلب لشمال على أندرويد، فلازم نستخدم 'left'
 * علشان كده بنحسب القيم دي هنا مرة واحدة، وكل الشاشات تستخدمها بدل ما تكتب الاتجاه بنفسها.
 */
import { I18nManager } from 'react-native';

export const IS_RTL_LAYOUT = I18nManager.isRTL;

/** صف بيبدأ من اليمين */
export const ROW = IS_RTL_LAYOUT ? 'row' : 'row-reverse';

/** محاذاة النص لليمين */
export const TEXT_RIGHT = IS_RTL_LAYOUT ? 'left' : 'right';

/** محاذاة النص للشمال */
export const TEXT_LEFT = IS_RTL_LAYOUT ? 'right' : 'left';

/** نص عربي محاذي لليمين */
export const rtlText = { textAlign: TEXT_RIGHT, writingDirection: 'rtl' } as const;
