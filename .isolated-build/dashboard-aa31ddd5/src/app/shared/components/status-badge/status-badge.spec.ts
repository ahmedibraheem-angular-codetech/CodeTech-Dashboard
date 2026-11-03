import { TestBed } from '@angular/core/testing';

import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  function render(status: 'active' | 'suspended'): HTMLElement {
    localStorage.setItem('codetech.language', 'en');
    TestBed.configureTestingModule({ imports: [StatusBadge] });
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders an active user as a success PrimeNG tag', () => {
    const tag = render('active').querySelector('.p-tag');
    expect(tag?.classList.contains('p-tag-success')).toBe(true);
    expect(tag?.textContent?.trim()).toBe('Active');
  });

  it('renders a suspended user as a danger PrimeNG tag', () => {
    const tag = render('suspended').querySelector('.p-tag');
    expect(tag?.classList.contains('p-tag-danger')).toBe(true);
    expect(tag?.textContent?.trim()).toBe('Suspended');
  });
});
