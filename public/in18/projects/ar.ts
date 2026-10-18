import type { en } from './en';

export const ar: { [K in keyof typeof en]: string } = {
  'project.manage': 'إدارة المشاريع',
  'project.subtitle': 'إدارة المشاريع المعروضة بالموقع',
  'project.catalog': 'المشاريع',
  'project.add': 'إضافة مشروع جديد',
  'project.edit': 'تعديل المشروع',
  'project.deleteTitle': 'حذف المشروع',
  'project.deleteMessage': 'هل تريد حذف هذا المشروع؟',
  'project.deleted': 'تم حذف المشروع',
  'project.saved': 'تم حفظ المشروع',
  'project.empty': 'لا توجد مشاريع بعد',
  'project.notFound': 'لم يتم العثور على هذا المشروع.',
  'project.name': 'اسم المشروع',
  'project.summary': 'وصف مختصر',
  'project.back': 'العودة للمشاريع',
};
