import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { LanguageService } from '../../../../core/services/language.service';
import { LoginResetForm, type LoginResetPasswordFormGroup } from './login-reset-form';

describe('LoginResetForm submit arrow', () => {
  function render(language: 'ar' | 'en') {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [LoginResetForm] });
    TestBed.inject(LanguageService).set(language);
    const fixture = TestBed.createComponent(LoginResetForm);
    const form: LoginResetPasswordFormGroup = new FormGroup({
      password: new FormControl('', { nonNullable: true }),
      confirmPassword: new FormControl('', { nonNullable: true }),
    });
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('points forward to the right in English', () => {
    const root = render('en');
    expect(root.querySelector('button[type="submit"] .pi-angle-double-right')).not.toBeNull();
    expect(root.querySelector('button[type="submit"] .pi-angle-left')).toBeNull();
  });

  it('points forward to the left in Arabic', () => {
    const root = render('ar');
    expect(root.querySelector('button[type="submit"] .pi-angle-double-left')).not.toBeNull();
  });
});
