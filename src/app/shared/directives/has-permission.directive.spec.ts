import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authSession } from '../../core/auth/auth-session.fixture';
import { AuthService } from '../../core/auth/auth.service';
import { HasPermissionDirective } from './has-permission.directive';

@Component({
  selector: 'app-has-permission-host',
  imports: [HasPermissionDirective],
  template: `
    <span id="single" *appHasPermission="required">single</span>
    <span id="any" *appHasPermission="list; mode: 'any'">any</span>
    <span id="all" *appHasPermission="list; mode: 'all'">all</span>
  `,
})
class Host {
  required = 'products.view';
  list: string[] = ['products.view', 'products.update'];
}

describe('HasPermissionDirective', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function setSession(
    partial: Parameters<typeof authSession>[0] & { profileLoaded?: boolean; permissions?: string[] },
  ): void {
    auth.session.set(authSession(partial));
  }

  it('shows the template when the required permission is held', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: ['products.view'],
    });
    const root = render();
    expect(root.querySelector('#single')?.textContent?.trim()).toBe('single');
  });

  it('hides the template when the required permission is missing', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: ['users.view'],
    });
    const root = render();
    expect(root.querySelector('#single')).toBeNull();
  });

  it('uses any-match for a permission array by default', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: ['products.update'],
    });
    const root = render();
    expect(root.querySelector('#any')?.textContent?.trim()).toBe('any');
    expect(root.querySelector('#all')).toBeNull();
  });

  it('requires every grant when mode is all', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: ['products.view', 'products.update'],
    });
    const root = render();
    expect(root.querySelector('#all')?.textContent?.trim()).toBe('all');
  });

  it('creates the view when permissions change to allow access', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: [],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#single')).toBeNull();

    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['products.view'],
      }),
    );
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#single')?.textContent?.trim()).toBe(
      'single',
    );
  });

  it('clears the view when permissions change to deny access', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: ['products.view'],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#single')).not.toBeNull();

    auth.session.set(
      authSession({
        token: 't',
        email: 'a@b.sa',
        name: 'A',
        profileLoaded: true,
        permissions: ['users.view'],
      }),
    );
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#single')).toBeNull();
  });

  it('hides everything while the profile has not loaded yet', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: false,
      permissions: [],
    });
    const root = render();
    expect(root.querySelector('#single')).toBeNull();
    expect(root.querySelector('#any')).toBeNull();
    expect(root.querySelector('#all')).toBeNull();
  });

  it('stays hidden when profile is loaded with an empty permissions list', () => {
    setSession({
      token: 't',
      email: 'a@b.sa',
      name: 'A',
      profileLoaded: true,
      permissions: [],
    });
    const root = render();
    expect(root.querySelector('#single')).toBeNull();
    expect(root.querySelector('#any')).toBeNull();
    expect(root.querySelector('#all')).toBeNull();
  });
});
