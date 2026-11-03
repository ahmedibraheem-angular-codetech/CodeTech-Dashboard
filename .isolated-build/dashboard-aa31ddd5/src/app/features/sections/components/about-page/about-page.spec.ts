import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import { ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO } from '../../services/about.mock';
import { AboutPage } from './about-page';

const ABOUT = apiUrl(environment.apiUrl, 'admin/pages/about');
const PARTNERS = apiUrl(environment.apiUrl, 'admin/partners');
const ABOUT_GRANTS = ['about.view', 'about.create', 'about.update', 'about.delete'] as const;

describe('AboutPage', () => {
  async function render(options: { fail?: boolean } = {}) {
    TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...ABOUT_GRANTS],
      }),
    );
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    const about = http.expectOne(ABOUT);
    const partners = http.expectOne(PARTNERS);
    if (options.fail) {
      about.flush('nope', { status: 500, statusText: 'Server Error' });

    } else {
      about.flush({ data: ABOUT_PAGE_DTO });
      partners.flush({ data: ABOUT_PARTNERS_DTO });
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, http };
  }

  it('renders the About sections from the API', async () => {
    const { root, http } = await render();
    expect(root.querySelectorAll('app-about-groups')).toHaveLength(2);
    expect(root.querySelector('app-about-partners')).not.toBeNull();
    expect(root.querySelector('app-about-ceo')).not.toBeNull();
    expect(root.querySelector('app-about-team')).not.toBeNull();
    expect(root.textContent).toContain('فلسفة الشركة');
    expect(root.textContent).toContain('م. رامي حسن');
    expect(root.querySelectorAll('.partner-card')).toHaveLength(2);
    expect(root.querySelectorAll('.about-member')).toHaveLength(2);
    expect(root.querySelector('.partner-card__logo')).not.toBeNull();
    expect(root.querySelector('app-section-empty')).toBeNull();
    http.verify();
  });

  it('shows the error state when load fails', async () => {
    const { root, http } = await render({ fail: true });
    expect(root.querySelector('app-state-view')).not.toBeNull();
    expect(root.textContent).toContain('حدث خطأ');
    http.verify();
  });
});
