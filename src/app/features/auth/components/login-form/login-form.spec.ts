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

      .auth-card[dir='rtl'] .p-inputicon {
        transform: scaleX(-1);
      }

      .auth-card[dir='rtl'] .field__toggle {
        transform: translateY(-50%) scaleX(-1);
      }

      .auth-card[dir='ltr'] .p-iconfield .p-inputtext,
      .auth-card[dir='ltr'] .p-inputtext {
        direction: ltr;
        text-align: left;
      }

      .auth-card[dir='ltr'] .p-inputicon {
        transform: none;
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

  it('keeps Arabic form dir=rtl while input typing starts from the left', () => {
    const { root, lang } = render();
    expect(lang.language()).toBe('ar');

    const form = root.querySelector('form');
    const email = root.querySelector<HTMLInputElement>('#email');
    const password = root.querySelector<HTMLInputElement>('#password');
    const icon = root.querySelector<HTMLElement>('.p-inputicon');

    expect(form?.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('.auth-card')?.getAttribute('dir')).toBe('rtl');

    expect(email).not.toBeNull();
    expect(password).not.toBeNull();
    expect(getComputedStyle(email!).direction).toBe('ltr');
    expect(getComputedStyle(email!).textAlign).toBe('left');
    expect(getComputedStyle(password!).direction).toBe('ltr');
    expect(getComputedStyle(password!).textAlign).toBe('left');

    expect(icon).not.toBeNull();
    const iconTransform = getComputedStyle(icon!).transform;
    expect(
      iconTransform.includes('matrix(-1') || iconTransform.includes('scaleX(-1)'),
    ).toBe(true);
  });

  it('does not flip icons in English and keeps left-start typing', () => {
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

    const transform = getComputedStyle(icon!).transform;
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });
});
