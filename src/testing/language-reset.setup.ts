import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.setItem('codetech.language', 'ar');
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
});
