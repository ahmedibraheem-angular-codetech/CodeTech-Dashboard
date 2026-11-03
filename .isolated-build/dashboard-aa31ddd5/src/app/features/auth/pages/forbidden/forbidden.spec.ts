import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { type Type } from '@angular/core';

import { routes } from '../../../../app.routes';
import { authGuard } from '../../../../core/guards/auth.guard';
import { ForbiddenPage } from './forbidden';

describe('ForbiddenPage', () => {
  it('renders StateView with the forbidden message', async () => {
    TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-state-view')).not.toBeNull();
    expect(root.textContent).toContain('ليس لديك صلاحية لعرض هذه الصفحة.');
  });

  it('navigates home when retry is clicked', async () => {
    TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button).not.toBeNull();
    button!.click();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});

describe('forbidden route', () => {
  it('is registered at /forbidden with authGuard only (no permissionGuard)', async () => {
    const route = routes.find((entry) => entry.path === 'forbidden');
    expect(route).toBeTruthy();
    expect(route?.canActivate).toEqual([authGuard]);
    expect(route?.canActivate).toHaveLength(1);
    expect(route?.data?.['titleKey']).toBe('auth.forbiddenTitle');
    expect(route?.loadComponent).toBeTruthy();
    const type = (await route!.loadComponent!()) as Type<unknown>;
    expect(type).toBe(ForbiddenPage);
  });
});
