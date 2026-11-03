import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { LayoutService } from '../../core/services/layout.service';
import { AdminLayout } from './admin-layout';

@Component({ selector: 'app-sidebar', template: '' })
class SidebarStub {}

@Component({ selector: 'app-header', template: '' })
class HeaderStub {}

@Component({ template: '<p>page</p>' })
class PageStub {}

describe('AdminLayout route enter', () => {
  let fixture: ComponentFixture<AdminLayout>;
  let layout: AdminLayout;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideRouter([
          { path: '', component: PageStub },
          { path: 'about', component: PageStub },
        ]),
        LayoutService,
        LanguageService,
      ],
    })
      .overrideComponent(AdminLayout, {
        set: { imports: [RouterOutlet, SidebarStub, HeaderStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
    layout = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('does not enter-animate on the first NavigationEnd', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(layout.pageEnter()).toBe(false);
    expect(fixture.nativeElement.querySelector('.shell__page--enter')).toBeNull();
  });

  it('replays shell__page--enter on later navigations', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    await router.navigateByUrl('/about');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    fixture.detectChanges();

    expect(layout.pageEnter()).toBe(true);
    expect(fixture.nativeElement.querySelector('.shell__page--enter')).not.toBeNull();
  });

  it('clears the enter class after route-page-in ends', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await router.navigateByUrl('/about');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    fixture.detectChanges();

    const page = fixture.nativeElement.querySelector('.shell__page') as HTMLElement;
    layout.onPageEnterEnd({
      target: page,
      currentTarget: page,
      animationName: 'route-page-in',
    } as unknown as AnimationEvent);
    fixture.detectChanges();

    expect(layout.pageEnter()).toBe(false);
    expect(fixture.nativeElement.querySelector('.shell__page--enter')).toBeNull();
  });
});
