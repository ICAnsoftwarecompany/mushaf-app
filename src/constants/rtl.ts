/**
 * اتجاه الجهاز الأصلي. الاتجاه حسب لغة التطبيق في src/i18n (useI18n().dir و ARABIC_DIR).
 */
import { I18nManager, Platform } from 'react-native';

export const IS_RTL_LAYOUT = Platform.OS === 'web' ? false : !!I18nManager.isRTL;
