import type { Translation } from 'primeng/api';

/**
 * Arabic strings for PrimeNG widgets (date picker, empty table/select states and their
 * accessibility labels). English is not listed here: `LanguageService` snapshots PrimeNG's
 * built-in English defaults and restores them when the language switches back.
 *
 * `firstDayOfWeek` is 6 (Saturday) to match the Egyptian calendar week; the day-name arrays
 * still start with Sunday because PrimeNG indexes them with `Date#getDay()`.
 */
export const PRIMENG_AR: Translation = {
  dayNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  dayNamesShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  dayNamesMin: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  monthNames: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  monthNamesShort: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  firstDayOfWeek: 6,
  today: 'اليوم',
  clear: 'مسح',
  weekHeader: 'أسبوع',
  emptyMessage: 'لا توجد نتائج',
  emptyFilterMessage: 'لا توجد نتائج',
  chooseYear: 'اختر السنة',
  chooseMonth: 'اختر الشهر',
  chooseDate: 'اختر التاريخ',
  prevDecade: 'العقد السابق',
  nextDecade: 'العقد التالي',
  prevYear: 'السنة السابقة',
  nextYear: 'السنة التالية',
  prevMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
};
