import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { HOME_PAGE_DTO } from '../../services/homepage.mock';
import { Home } from './home';

const HOME = apiUrl(environment.apiUrl, 'admin/pages/home');
const HOME_GRANTS = ['home.view', 'home.create', 'home.update', 'home.delete'] as const;

describe('Home', () => {
  async function render(options: { fail?: boolean } = {}) {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        MessageService,
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...HOME_GRANTS],
      }),
    );
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const request = http.expectOne(HOME);
    if (options.fail) {
      request.flush('nope', { status: 500, statusText: 'Server Error' });
    } else {
      request.flush({ data: HOME_PAGE_DTO });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, http };
  }

  it('composes every section once the content is loaded', async () => {
    const { root, http } = await render();
    expect(root.querySelector('app-partners-section')).not.toBeNull();
    expect(root.querySelector('app-video-section')).not.toBeNull();
    expect(root.querySelectorAll('app-content-block-card')).toHaveLength(2);
    expect(root.querySelector('app-overview-stats')).toBeNull();
    expect(root.textContent).toContain('عملاؤنا و شركاؤنا');
    http.verify();
  });

  it('renders partners, video, filled about and empty vision from the API', async () => {
    const { root, http } = await render();
    expect(root.querySelectorAll('.partner-card')).toHaveLength(2);
    expect(root.querySelector('.partner-card__logo')).not.toBeNull();
    expect(root.querySelector('.video-frame')).not.toBeNull();
    expect(root.querySelectorAll('.story').length).toBeGreaterThan(0);
    expect(root.querySelectorAll('app-section-empty').length).toBeGreaterThanOrEqual(1);
    http.verify();
  });

  it('shows the error state when load fails', async () => {
    const { root, http } = await render({ fail: true });
    expect(root.querySelector('app-state-view')).not.toBeNull();
    expect(root.textContent).toContain('حدث خطأ');
    http.verify();
  });
});
