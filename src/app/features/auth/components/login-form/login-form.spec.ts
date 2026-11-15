import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../../../../core/services/language.service';
import { LoginForm, type LoginFormGroup } from './login-form';

@Component({
  selector: 'app-login-form-host',
  imports: [LoginForm],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="auth-card" [attr.dir]="lang.language() === 'ar' ? 'rtl' : 'ltr'">
      <app-login-form [form]="form" />
    </div>
  `,
  styles: [
    `
      .auth-card[dir='rtl'] .p-iconfield .p-inputtext,
      .auth-card[dir='rtl'] .p-inputtext {
        direction: ltr;
        text-align: left;
      }

      .auth-card[dir='rtl'] .p-iconfield .p-inputicon:last-child {
        inset-inline-end: auto;
        inset-inline-start: 20px;
      }

      .auth-card[dir='rtl'] .field__toggle {
        inset-inline-end: auto;
        inset-inline-start: 6px;
        transform: translateY(-50%);
      }

      .auth-card[dir='ltr'] .p-iconfield .p-inputtext,
      .auth-card[dir='ltr'] .p-inputtext {
        direction: ltr;
        text-align: left;
      }

      .auth-card[dir='ltr'] .p-iconfield .p-inputicon:last-child {
        inset-inline-start: auto;
        inset-inline-end: 20px;
      }
    `,
  ],
})
class LoginFormHost {
  readonly lang = TestBed.inject(LanguageService);
  readonly form: LoginFormGroup = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

describe('LoginForm Arabic input direction', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [LoginFormHost] });
    const fixture = TestBed.createComponent(LoginFormHost);
    fixture.detectChanges();
    return {
      fixture,
      root: fixture.nativeElement as HTMLElement,
      lang: TestBed.inject(LanguageService),
    };
  }

  it('starts typing from the left and pins icons to the right in Arabic', () => {
    const { root, lang } = render();
    expect(lang.language()).toBe('ar');

    const form = root.querySelector('form');
    const card = root.querySelector('.auth-card');
    const email = root.querySelector<HTMLInputElement>('#email');
    const password = root.querySelector<HTMLInputElement>('#password');
    const icon = root.querySelector<HTMLElement>('.p-inputicon');

    expect(form?.getAttribute('dir')).toBe('rtl');
    expect(card?.getAttribute('dir')).toBe('rtl');
    expect(email).not.toBeNull();
    expect(password).not.toBeNull();
    expect(icon).not.toBeNull();

    expect(getComputedStyle(email!).direction).toBe('ltr');
    expect(getComputedStyle(email!).textAlign).toBe('left');
    expect(getComputedStyle(password!).direction).toBe('ltr');
    expect(getComputedStyle(password!).textAlign).toBe('left');

    // In RTL, inline-start is the physical right.
    expect(getComputedStyle(icon!).insetInlineStart).toBe('20px');
    expect(getComputedStyle(icon!).insetInlineEnd).toBe('auto');
  });

  it('keeps left-start typing and end-side icons for English', () => {
    const { fixture, root, lang } = render();
    lang.set('en');
    fixture.detectChanges();

    const form = root.querySelector('form');
    const email = root.querySelector<HTMLInputElement>('#email');
    const icon = root.querySelector<HTMLElement>('.p-inputicon');

    expect(form?.getAttribute('dir')).toBe('ltr');
    expect(root.querySelector('.auth-card')?.getAttribute('dir')).toBe('ltr');
    expect(getComputedStyle(email!).direction).toBe('ltr');
    expect(getComputedStyle(email!).textAlign).toBe('left');
    expect(getComputedStyle(icon!).insetInlineEnd).toBe('20px');
    expect(getComputedStyle(icon!).insetInlineStart).toBe('auto');
  });
});
