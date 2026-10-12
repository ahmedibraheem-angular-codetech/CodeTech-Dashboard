import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProfileService } from '../../../../core/profile/profile.service';
import { PersonalData } from './personal-data';

const SESSION = {
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.superAdmin',
};

describe('PersonalData', () => {
  function render() {
    sessionStorage.clear();
    sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    TestBed.configureTestingModule({
      imports: [PersonalData],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(PersonalData);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  async function submit(fixture: ReturnType<typeof render>['fixture']): Promise<void> {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('is prefilled from the profile', () => {
    const { fixture } = render();
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      name: SESSION.name,
      email: SESSION.email,
      phone: '+966 55 298 3389',
    });
  });

  it('blocks an invalid email and username', async () => {
    const { fixture, root } = render();
    fixture.componentInstance.form.patchValue({ email: 'nope', username: 'a b' });
    await submit(fixture);

    expect(root.querySelector('#profile-email-error')).not.toBeNull();
    expect(root.querySelector('#profile-username-error')).not.toBeNull();
    expect(TestBed.inject(ProfileService).profile()?.email).toBe(SESSION.email);
  });

  it('saves valid changes and restores the saved values on cancel', async () => {
    const { fixture } = render();
    fixture.componentInstance.form.patchValue({ phone: '0551112222' });
    await submit(fixture);
    expect(TestBed.inject(ProfileService).profile()?.phone).toBe('0551112222');

    fixture.componentInstance.form.patchValue({ phone: '0559999999' });
    fixture.componentInstance.cancel();
    expect(fixture.componentInstance.form.controls.phone.value).toBe('0551112222');
  });
});
