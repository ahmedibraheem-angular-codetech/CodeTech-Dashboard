import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../../core/services/language.service';
import { AuthShell } from './auth-shell';

describe('AuthShell brand panel', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [AuthShell] });
    const fixture = TestBed.createComponent(AuthShell);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('shows the Arabic label with the flag, and the decorative mark', () => {
    const { root } = render();
    expect(root.querySelector('.lang-pill')?.textContent).toContain('العربية');
    expect(root.querySelector('.lang-pill__flag')).not.toBeNull();
    expect(root.querySelector('.lang-pill__badge')).toBeNull();
    expect(root.querySelector('svg.auth-mark')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches the pill to the English label when the language is toggled', () => {
    const { fixture, root } = render();
    root.querySelector<HTMLButtonElement>('.lang-pill')?.click();
    fixture.detectChanges();

    expect(TestBed.inject(LanguageService).language()).toBe('en');
    expect(root.querySelector('.lang-pill')?.textContent).toContain('English');
    expect(root.querySelector('.lang-pill__badge')?.textContent?.trim()).toBe('EN');
    expect(root.querySelector('.lang-pill__flag')).toBeNull();
  });
});
