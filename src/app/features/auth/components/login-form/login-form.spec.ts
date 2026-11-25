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
        inset: auto;
        right: 20px;
        left: auto;
      }

      .auth-card[dir='rtl'] .field__toggle {
        inset: auto;
        top: 50%;
        right: 8px;
        left: auto;
        transform: translateY(-50%);
      }

      .auth-card[dir='ltr'] .p-iconfield .p-inputtext,
      .auth-card[dir='ltr'] .p-inputtext {
        direction: ltr;
        text-align: left;
      }

      .auth-card[dir='ltr'] .p-iconfield .p-inputicon:last-child {
        inset: auto;
        right: 20px;
        left: auto;
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

    expect(getComputedStyle(icon!).right).toBe('20px');
    expect(getComputedStyle(icon!).left).toBe('auto');

    const toggle = root.querySelector<HTMLElement>('.field__toggle');
    expect(toggle).not.toBeNull();
    expect(getComputedStyle(toggle!).right).toBe('8px');
    expect(getComputedStyle(toggle!).left).toBe('auto');
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
    expect(getComputedStyle(icon!).right).toBe('20px');
    expect(getComputedStyle(icon!).left).toBe('auto');
  });
});
