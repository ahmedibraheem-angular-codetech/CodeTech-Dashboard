import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProfilePage } from './profile';

const SESSION = {
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.superAdmin',
  remember: false,
};

describe('ProfilePage', () => {
  // jsdom has no ResizeObserver, which PrimeNG's tab list uses to size its scroll buttons.
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  function render() {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, navigate };
  }

  it('shows the user, role and last sign in in the header card', () => {
    const { root } = render();
    expect(root.querySelector('h1')?.textContent).toContain(SESSION.name);
    expect(root.querySelector('.profile-head__role')?.textContent).toContain('أدمن عام');
    expect(root.querySelector('.profile-head time')?.getAttribute('datetime')).toBe(
      '2026-03-18T10:00:00',
    );
    expect(root.querySelector('.profile-head app-user-avatar img')?.getAttribute('src')).toContain(
      'avatar-placeholder',
    );
  });

  it('uses PrimeNG tabs for personal data and password', () => {
    const { root } = render();
    const tabs = root.querySelectorAll('p-tab');
    expect(tabs).toHaveLength(2);
    expect(root.querySelector('p-tabs')).not.toBeNull();
    expect(root.querySelector('app-personal-data')).not.toBeNull();
  });

  it('switches to the password panel from the second tab', async () => {
    const { fixture, root } = render();
    root.querySelectorAll<HTMLElement>('p-tab')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.tab()).toBe('password');
    expect(root.querySelector('#password-current')).not.toBeNull();
  });

  it('signs out and goes to the login page', () => {
    const { fixture, root, navigate } = render();
    root.querySelector<HTMLElement>('.profile-head__logout button')?.click();
    TestBed.inject(HttpTestingController)
      .expectOne(apiUrl(environment.apiUrl, 'admin/auth/logout'))
      .flush('', { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
