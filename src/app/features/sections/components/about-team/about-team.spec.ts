import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../../environments/environment';
import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiUrl } from '../../../../core/config/api';
import type { AboutMember } from '../../models/about.model';
import { ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO } from '../../services/about.mock';
import { mapAboutPage } from '../../services/about.mapper';
import { AboutTeamSection } from './about-team';

const ABOUT = apiUrl(environment.apiUrl, 'admin/pages/about');
const PARTNERS = apiUrl(environment.apiUrl, 'admin/partners');
const TEAM = apiUrl(environment.apiUrl, 'admin/team-members');
const ABOUT_GRANTS = ['about.view', 'about.create', 'about.update', 'about.delete'] as const;

describe('AboutTeamSection', () => {
  const seed = mapAboutPage(ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO).team;

  async function render(team: AboutMember[] = seed) {
    const teamSignal = signal(team);
    TestBed.configureTestingModule({
      imports: [AboutTeamSection],
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
    const fixture = TestBed.createComponent(AboutTeamSection);
    fixture.componentRef.setInput('team', teamSignal());
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      root: fixture.nativeElement as HTMLElement,
      http,
      teamSignal,
      setTeam(next: AboutMember[]) {
        teamSignal.set(next);
        fixture.componentRef.setInput('team', next);
        fixture.detectChanges();
      },
    };
  }

  function flushReload(http: HttpTestingController): void {
    http.expectOne(ABOUT).flush({ data: ABOUT_PAGE_DTO });
    http.expectOne(PARTNERS).flush({ data: ABOUT_PARTNERS_DTO });
  }

  it('maps and displays both Arabic and English team values from the API seed', async () => {
    const { root, http } = await render();
    expect(root.textContent).toContain('سارة محمد');
    expect(root.textContent).toContain('مصممة واجهات');
    expect(seed[0]?.texts.en).toEqual({ name: 'Sara Mohamed', role: 'UI designer' });
    http.verify();
  });

  it('opens an existing member with both language fields initialized', async () => {
    const { component, fixture, http } = await render();
    component.open(seed[0]);
    fixture.detectChanges();

    expect(component.form.controls.ar.getRawValue()).toEqual({
      name: 'سارة محمد',
      role: 'مصممة واجهات',
    });
    expect(component.form.controls.en.getRawValue()).toEqual({
      name: 'Sara Mohamed',
      role: 'UI designer',
    });
    expect(component.image()?.uuid).toBe('team-1');
    http.verify();
  });

  it('updates a member with both languages and omits photo when unchanged', async () => {
    const { component, fixture, http } = await render();
    const emitted: AboutMember[][] = [];
    component.changed.subscribe((next) => emitted.push(next));

    component.open(seed[0]);
    component.form.controls.ar.setValue({ name: 'سارة م.', role: 'مصممة' });
    fixture.detectChanges();
    component.save();
    fixture.detectChanges();

    const put = http.expectOne(`${TEAM}/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      name: { ar: 'سارة م.', en: 'Sara Mohamed' },
      job_title: { ar: 'مصممة', en: 'UI designer' },
    });
    expect(put.request.body).not.toHaveProperty('photo');
    put.flush({
      data: {
        ...ABOUT_PAGE_DTO.team[0],
        name: { ar: 'سارة م.', en: 'Sara Mohamed' },
        job_title: { ar: 'مصممة', en: 'UI designer' },
      },
    });
    flushReload(http);
    await fixture.whenStable();
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.[0]?.texts.en.name).toBe('Sara Mohamed');
    http.verify();
  });

  it('creates a member with Arabic required and English null when empty', async () => {
    const { component, fixture, http } = await render([]);
    component.open();
    component.form.controls.ar.setValue({ name: 'نورة', role: 'محللة' });
    component.form.controls.en.setValue({ name: '', role: '' });
    fixture.detectChanges();
    component.save();
    fixture.detectChanges();

    const post = http.expectOne(TEAM);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      name: { ar: 'نورة', en: null },
      job_title: { ar: 'محللة', en: null },
    });
    post.flush(
      {
        data: {
          id: 99,
          name: { ar: 'نورة', en: null },
          job_title: { ar: 'محللة', en: null },
          photo: null,
          sort_order: 1,
          created_at: '2026-11-01T10:00:00.000000Z',
          updated_at: '2026-11-01T10:00:00.000000Z',
        },
      },
      { status: 201, statusText: 'Created' },
    );
    flushReload(http);
    await fixture.whenStable();
    http.verify();
  });

  it('does not change the displayed team list when an update fails', async () => {
    const { component, fixture, root, http, setTeam } = await render();
    const emitted: AboutMember[][] = [];
    component.changed.subscribe((next) => emitted.push(next));
    setTeam(seed);

    component.open(seed[0]);
    component.form.controls.ar.controls.name.setValue('سارة م.');
    component.save();
    fixture.detectChanges();

    http.expectOne(`${TEAM}/1`).flush('nope', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitted).toHaveLength(0);
    expect(root.querySelectorAll('.about-member')).toHaveLength(2);
    expect(root.textContent).toContain('سارة محمد');
    http.verify();
  });
});
