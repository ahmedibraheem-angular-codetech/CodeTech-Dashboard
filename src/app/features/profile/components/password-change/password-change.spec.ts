import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { apiUrl } from '../../../../core/config/api';
import { PasswordChange, passwordRules } from './password-change';

const PASSWORD = apiUrl(environment.apiUrl, 'admin/profile/password');

function group(current: string, next: string, confirm: string): FormGroup {
  return new FormGroup({
    current: new FormControl(current),
    next: new FormControl(next),
    confirm: new FormControl(confirm),
  });
}

describe('passwordRules', () => {
  it('accepts a new, confirmed password', () => {
    expect(passwordRules(group('old-pass-1', 'new-pass-22', 'new-pass-22'))).toBeNull();
  });

  it('flags a new password equal to the current one', () => {
    expect(passwordRules(group('same-pass-1', 'same-pass-1', 'same-pass-1'))).toEqual({
      same: true,
    });
  });

  it('flags a mismatching confirmation', () => {
    expect(passwordRules(group('old-pass-1', 'new-pass-22', 'other-pass'))).toEqual({
      mismatch: true,
    });
  });

  it('leaves empty fields to the required validators', () => {
    expect(passwordRules(group('', '', ''))).toBeNull();
  });
});

describe('PasswordChange', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [PasswordChange],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = TestBed.createComponent(PasswordChange);
    fixture.detectChanges();
    return {
      fixture,
      root: fixture.nativeElement as HTMLElement,
      toast,
      http: TestBed.inject(HttpTestingController),
    };
  }

  async function submit(fixture: ReturnType<typeof render>['fixture']): Promise<void> {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows required errors and does not submit an empty form', async () => {
    const { fixture, root, toast, http } = render();
    await submit(fixture);

    expect(root.querySelectorAll('app-field-error')).toHaveLength(3);
    expect(root.querySelector('#password-current')?.getAttribute('aria-invalid')).toBe('true');
    expect(toast).not.toHaveBeenCalled();
    http.verify();
  });

  it('reports a mismatching confirmation on the confirm field', async () => {
    const { fixture, root, http } = render();
    fixture.componentInstance.form.setValue({
      current: 'old-pass-1',
      next: 'new-pass-22',
      confirm: 'different',
    });
    await submit(fixture);

    expect(root.querySelector('#password-confirm-error')).not.toBeNull();
    expect(root.querySelector('#password-next-error')).toBeNull();
    http.verify();
  });

  it('changes the password, clears the form and confirms with a toast', async () => {
    const { fixture, toast, http } = render();
    fixture.componentInstance.form.setValue({
      current: 'old-pass-1',
      next: 'new-pass-22',
      confirm: 'new-pass-22',
    });
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    const request = http.expectOne(PASSWORD);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      current_password: 'old-pass-1',
      password: 'new-pass-22',
      password_confirmation: 'new-pass-22',
    });
    request.flush({ message: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      current: '',
      next: '',
      confirm: '',
    });
    http.verify();
  });

  it('shows the server message when the password change is rejected', async () => {
    const { fixture, toast, http } = render();
    fixture.componentInstance.form.setValue({
      current: 'wrong',
      next: 'new-pass-22',
      confirm: 'new-pass-22',
    });
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    http
      .expectOne(PASSWORD)
      .flush(
        { message: 'كلمة المرور غير صحيحة.', errors: { current_password: ['invalid'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(toast).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'كلمة المرور غير صحيحة.',
    });
    http.verify();
  });

  it('toggles each field independently with a labelled button', () => {
    const { fixture, root, http } = render();
    const buttons = root.querySelectorAll<HTMLButtonElement>('.field__toggle button');
    expect(buttons).toHaveLength(3);
    expect(buttons[1].getAttribute('aria-label')).toBeTruthy();

    buttons[1].click();
    fixture.detectChanges();

    expect(root.querySelector('#password-next')?.getAttribute('type')).toBe('text');
    expect(root.querySelector('#password-current')?.getAttribute('type')).toBe('password');
    http.verify();
  });
});
