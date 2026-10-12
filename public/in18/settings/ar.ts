import type { en } from './en';

export const ar: { [K in keyof typeof en]: string } = {
  'settings.title': 'الاعدادات',
  'settings.subtitle': 'تفضيلات المظهر وتخطيط اللوحة',
  'settings.general': 'عام',
  'settings.appearance': 'المظهر',
  'settings.language': 'اللغة',
  'settings.languageAr': 'العربية',
  'settings.languageEn': 'English',
  'settings.density': 'كثافة العرض',
  'settings.comfortable': 'مريح',
  'settings.compact': 'مضغوط',
  'settings.sidebar': 'طي القائمة الجانبية',
  'settings.sidebarHint': 'يُحفظ الاختيار على هذا الجهاز.',
};
