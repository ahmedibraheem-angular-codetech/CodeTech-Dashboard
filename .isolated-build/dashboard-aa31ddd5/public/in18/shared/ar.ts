import type { en } from './en';

export const ar: { [K in keyof typeof en]: string } = {
  'app.name': 'كود التقنية',
  'a11y.skip': 'تجاوز إلى المحتوى',
  'roles.superAdmin': 'أدمن عام',
  'roles.editor': 'محرر',
  'roles.viewer': 'مشاهد',
  'status.active': 'نشط',
  'status.suspended': 'موقوف',
  'common.loading': 'جار التحميل',
  'common.empty': 'لا توجد بيانات',
  'common.error': 'حدث خطأ',
  'common.close': 'إغلاق',
  'common.save': 'حفظ',
  'common.saveChanges': 'حفظ التعديلات',
  'common.cancel': 'إلغاء',
  'common.back': 'تراجع',
};
