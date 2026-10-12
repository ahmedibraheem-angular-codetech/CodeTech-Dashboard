import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_LATENCY_MS } from '../../core/config/latency';
import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';

const SESSION = {
  token: 't',
  email: 'admin@codetech.sa',
  name: 'أحمد محمد',
  roleKey: 'roles.superAdmin',
};

describe('Profile entry points', () => {
  function render<T>(component: new () => T) {
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('codetech.session', JSON.stringify(SESSION));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('links the header picture to /profile', () => {
    const link = render(Header).querySelector<HTMLAnchorElement>('a.user-chip');
    expect(link?.getAttribute('href')).toBe('/profile');
    expect(link?.getAttribute('aria-label')).toBeTruthy();
    expect(link?.querySelector('img')).not.toBeNull();
  });

  it('links the sidebar user card to /profile without touching the logout button', () => {
    const root = render(Sidebar);
    expect(root.querySelector('a.sidebar__profile')?.getAttribute('href')).toBe('/profile');
    expect(root.querySelector('.sidebar__logout')).not.toBeNull();
  });
});
