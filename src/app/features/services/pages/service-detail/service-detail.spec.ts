import { Component, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { NEVER, of, throwError, type Observable } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PROJECTS_SEED } from '../../../projects/services/projects.mock';
import { ProjectsService } from '../../../projects/services/projects.service';
import {
  blankService,
  localeText,
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
  type Service,
} from '../../models/service.model';
import { SERVICES_SEED } from '../../services/services.mock';
import { ServicesService } from '../../services/services.service';
import { ServiceDetailPage } from './service-detail';

@Component({ template: '' })
class RouteStub {}

type ServicesApi = Pick<ServicesService, 'get'>;
type ProjectsApi = Pick<ProjectsService, 'list'>;

function seed(id: string): Service {
  const found = SERVICES_SEED.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Seed ${id} is missing`);
  }
  return structuredClone(found);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

describe('ServiceDetailPage', () => {
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.inject(LanguageService).set('ar');
  });

  /** Mounts the page through the router so route-input binding and links behave as in the app. */
  async function open(
    url: string,
    overrides: { services?: ServicesApi; projects?: ProjectsApi } = {},
  ) {
    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        provideRouter(
          [
            { path: 'services', component: RouteStub },
            { path: 'services/new', component: RouteStub },
            { path: 'services/:id/edit', component: RouteStub },
            {
              path: 'services/:id',
              component: ServiceDetailPage,
              data: { breadcrumb: ':id' },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    if (overrides.services) {
      TestBed.overrideProvider(ServicesService, { useValue: overrides.services });
    }
    if (overrides.projects) {
      TestBed.overrideProvider(ProjectsService, { useValue: overrides.projects });
    }
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(url, ServiceDetailPage as Type<ServiceDetailPage>);
    await settle(harness);
    return { harness, page, root: harness.routeNativeElement as HTMLElement };
  }

  async function showTab(
    harness: RouterTestingHarness,
    root: HTMLElement,
    label: string,
  ): Promise<void> {
    const tab = [...root.querySelectorAll<HTMLElement>('app-page-tabs [role="tab"]')].find((item) =>
      item.textContent?.includes(label),
    );
    if (!tab) {
      throw new Error(`Tab "${label}" is missing`);
    }
    tab.click();
    await settle(harness);
  }

  const text = (root: HTMLElement) => root.textContent ?? '';

  describe('header and states', () => {
    it('loads the requested service and shows its name, description, icon, and status', async () => {
      const { root } = await open('/services/web-development');
      const service = seed('web-development');
      expect(root.querySelector('h1')?.textContent).toBe(service.name.ar);
      expect(root.querySelector('.page-header p')?.textContent).toContain(service.description.ar);
      const icon = root.querySelector('.service-detail__icon i');
      expect(icon?.className).toContain('pi-globe');
      expect(icon?.closest('img')).toBeNull();
      expect(root.querySelector('img[src*="pi-globe"]')).toBeNull();
      const status = root.querySelector('.detail-status');
      expect(status?.textContent?.trim()).toBe('منشورة');
      expect(status?.classList.contains('is-draft')).toBe(false);
    });

    it('marks an unpublished service as a draft', async () => {
      const { root } = await open('/services/cyber-security');
      const status = root.querySelector('.detail-status');
      expect(status?.textContent?.trim()).toBe('مسودة');
      expect(status?.classList.contains('is-draft')).toBe(true);
    });

    it('draws only a PrimeIcons class for the icon, never an image URL', async () => {
      const service: Service = { ...seed('web-development'), icon: 'https://example.com/a.png' };
      const { root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      const icon = root.querySelector('.service-detail__icon i');
      expect(icon?.className).toContain('pi-cog');
      expect(root.querySelector('.service-detail__icon img')).toBeNull();
      expect(text(root)).not.toContain('example.com');
    });

    it('links Edit to the editor route and Back to the list', async () => {
      const { harness, root } = await open('/services/web-development');
      const edit = root.querySelector<HTMLAnchorElement>('.service-detail__edit');
      const back = root.querySelector<HTMLAnchorElement>('.service-detail__back');
      expect(edit?.getAttribute('href')).toBe('/services/web-development/edit');
      expect(back?.getAttribute('href')).toBe('/services');

      edit?.click();
      await settle(harness);
      expect(TestBed.inject(Router).url).toBe('/services/web-development/edit');
    });

    it('navigates back to the list with the Back action', async () => {
      const { harness, root } = await open('/services/web-development');
      root.querySelector<HTMLAnchorElement>('.service-detail__back')?.click();
      await settle(harness);
      expect(TestBed.inject(Router).url).toBe('/services');
    });

    it('shows a loading state and no actions while the service is loading', async () => {
      const { root } = await open('/services/web-development', {
        services: { get: () => NEVER },
      });
      expect(root.querySelector('app-state-view')?.textContent).toContain('جار التحميل');
      expect(root.querySelector('h1')).toBeNull();
      expect(root.querySelector('.service-detail__edit')).toBeNull();
      expect(root.querySelector('app-page-tabs')).toBeNull();
    });

    it('shows not found for an unknown id, without a blank service or an Edit action', async () => {
      const { root } = await open('/services/does-not-exist');
      expect(text(root)).toContain('تعذر العثور على هذه الخدمة.');
      expect(root.querySelector('h1')).toBeNull();
      expect(root.querySelector('app-page-tabs')).toBeNull();
      expect(root.querySelector('.service-detail__edit')).toBeNull();
      expect(root.querySelector('.service-detail__back')?.getAttribute('href')).toBe('/services');
    });

    it('shows an error with retry when loading fails, and retry reloads the same service', async () => {
      const get = vi.fn<(id: string) => Observable<Service | null>>();
      get.mockReturnValueOnce(throwError(() => new Error('offline')));
      get.mockReturnValue(of(seed('mobile-apps')));
      const { harness, root } = await open('/services/mobile-apps', { services: { get } });
      expect(text(root)).toContain('حدث خطأ');
      expect(root.querySelector('.service-detail__edit')).toBeNull();
      expect(root.querySelector('h1')).toBeNull();

      const retry = [...root.querySelectorAll('app-state-view button')].find((button) =>
        button.textContent?.includes('إعادة المحاولة'),
      ) as HTMLButtonElement | undefined;
      expect(retry).toBeDefined();
      retry?.click();
      await settle(harness);

      expect(get).toHaveBeenCalledTimes(2);
      expect(get.mock.calls.map((call) => call[0])).toEqual(['mobile-apps', 'mobile-apps']);
      expect(root.querySelector('h1')?.textContent).toBe(seed('mobile-apps').name.ar);
      expect(TestBed.inject(Router).url).toBe('/services/mobile-apps');
    });

    it('loads the new service, with no stale content, when the route id changes', async () => {
      const { harness, root } = await open('/services/web-development');
      expect(root.querySelector('h1')?.textContent).toBe(seed('web-development').name.ar);
      await harness.navigateByUrl('/services/mobile-apps');
      await settle(harness);
      expect(root.querySelector('h1')?.textContent).toBe(seed('mobile-apps').name.ar);
      expect(text(root)).not.toContain(seed('web-development').name.ar);
    });

    it('never writes to the service when it is viewed', async () => {
      const save = vi.spyOn(ServicesService.prototype, 'save');
      const setPublished = vi.spyOn(ServicesService.prototype, 'setPublished');
      const { harness, root } = await open('/services/web-development');
      for (const label of ['حلول الخدمة', 'مشاريع الخدمة', 'القطاعات والأسئلة الشائعة']) {
        await showTab(harness, root, label);
      }
      expect(save).not.toHaveBeenCalled();
      expect(setPublished).not.toHaveBeenCalled();
    });
  });

  describe('sections', () => {
    it('lists six detail tabs with sectors and FAQ combined', async () => {
      const { root } = await open('/services/web-development');
      const labels = [...root.querySelectorAll('app-page-tabs [role="tab"]')].map((tab) =>
        tab.textContent?.trim(),
      );
      expect(labels).toEqual([
        'لماذا نحتاج للخدمة',
        'حلول الخدمة',
        'مراحل الخدمة',
        'مميزات الخدمة',
        'مشاريع الخدمة',
        'القطاعات والأسئلة الشائعة',
      ]);
    });

    it('shows every why item and the why image', async () => {
      const { root } = await open('/services/web-development');
      const service = seed('web-development');
      const items = [...root.querySelectorAll('.service-detail__list li')];
      expect(items).toHaveLength(service.whyItems.length);
      service.whyItems.forEach((item, index) => {
        expect(items[index]?.textContent).toContain(item.title.ar);
        expect(items[index]?.querySelector('i')?.className).toContain(
          item.imageUrl.slice('icon:'.length),
        );
      });
      const photo = root.querySelector<HTMLImageElement>('.service-detail__photo');
      expect(photo?.getAttribute('src')).toBe(service.whyImage.imageUrl);
      expect(text(root)).toContain(service.whyImage.title.ar);
    });

    it('shows the service data fields on the why tab', async () => {
      const { root } = await open('/services/web-development');
      const service = seed('web-development');
      expect(text(root)).toContain('بيانات الخدمة');
      expect(root.querySelector('.service-detail__id')?.textContent).toContain(service.id);
      const fields = [...root.querySelectorAll('app-info-field')].map((field) =>
        field.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(fields.some((value) => value?.includes(service.name.ar))).toBe(true);
      expect(fields.some((value) => value?.includes(service.description.ar))).toBe(true);
    });

    it('asks before deleting and returns to the list when confirmed', async () => {
      const remove = vi.spyOn(ServicesService.prototype, 'remove').mockReturnValue(of(undefined));
      const { harness, root } = await open('/services/web-development');
      root.querySelector<HTMLButtonElement>('.service-detail__delete')?.click();
      await settle(harness);
      expect(text(root)).toContain('هل تريد حذف هذه الخدمة؟');
      const cancel = [...root.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('إلغاء'),
      );
      cancel?.click();
      await settle(harness);
      expect(remove).not.toHaveBeenCalled();

      root.querySelector<HTMLButtonElement>('.service-detail__delete')?.click();
      await settle(harness);
      const confirm = [...root.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === 'حذف',
      );
      confirm?.click();
      await settle(harness);
      expect(remove).toHaveBeenCalledWith('web-development');
      expect(TestBed.inject(Router).url).toBe('/services');
    });

    it('shows every solution with its text and icon', async () => {
      const { harness, root } = await open('/services/web-development');
      await showTab(harness, root, 'حلول الخدمة');
      const service = seed('web-development');
      const cards = [...root.querySelectorAll('.service-detail__card')];
      expect(cards).toHaveLength(service.solutions.length);
      service.solutions.forEach((item, index) => {
        expect(cards[index]?.textContent).toContain(item.title.ar);
        expect(cards[index]?.textContent).toContain(item.body.ar);
        expect(cards[index]?.querySelector('i')?.className).toContain(
          item.imageUrl.slice('icon:'.length),
        );
      });
    });

    it('shows every stage in its stored order with numbering and image', async () => {
      const { harness, root } = await open('/services/web-development');
      await showTab(harness, root, 'مراحل الخدمة');
      const service = seed('web-development');
      const cards = [...root.querySelectorAll('.service-detail__stages > li')];
      expect(cards).toHaveLength(service.stages.length);
      service.stages.forEach((item, index) => {
        expect(cards[index]?.textContent).toContain(item.title.ar);
        expect(cards[index]?.textContent).toContain(item.body.ar);
        expect(cards[index]?.querySelector('.service-detail__number')?.textContent?.trim()).toBe(
          `0${index + 1}`,
        );
        expect(cards[index]?.querySelector('img')?.getAttribute('src')).toBe(item.imageUrl);
      });
    });

    it('keeps stage order exactly as stored, even when titles are not alphabetical', async () => {
      const stages = [
        { ...servicePoint(localeText('ج', 'C'), localeText('ثالثا', 'third')) },
        { ...servicePoint(localeText('أ', 'A'), localeText('أولا', 'first')) },
        { ...servicePoint(localeText('ب', 'B'), localeText('ثانيا', 'second')) },
      ];
      const service: Service = { ...seed('web-development'), stages };
      const { harness, root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      await showTab(harness, root, 'مراحل الخدمة');
      const titles = [...root.querySelectorAll('.service-detail__stages strong')].map((item) =>
        item.textContent?.trim(),
      );
      expect(titles).toEqual(['ج', 'أ', 'ب']);
    });

    it('shows every feature as a text-only tile', async () => {
      const { harness, root } = await open('/services/web-development');
      await showTab(harness, root, 'مميزات الخدمة');
      const service = seed('web-development');
      const cards = [...root.querySelectorAll('.service-detail__feature')];
      expect(cards).toHaveLength(service.features.length);
      service.features.forEach((item, index) => {
        expect(cards[index]?.textContent).toContain(item.title.ar);
        expect(cards[index]?.textContent).toContain(item.body.ar);
        expect(cards[index]?.querySelector('img')).toBeNull();
        expect(cards[index]?.querySelector('i')).toBeNull();
      });
    });

    it('shows every sector and FAQ together under the combined tab', async () => {
      const { harness, root } = await open('/services/web-development');
      await showTab(harness, root, 'القطاعات والأسئلة الشائعة');
      const service = seed('web-development');
      expect(text(root)).toContain('القطاعات المستهدفة');
      expect(text(root)).toContain('الأسئلة الشائعة');
      const cards = [...root.querySelectorAll('app-sector-card')];
      expect(cards).toHaveLength(service.sectors.length);
      service.sectors.forEach((sector, index) => {
        expect(cards[index]?.querySelector('img')?.getAttribute('src')).toBe(sector.imageUrl);
        expect(cards[index]?.textContent).toContain(`قطاع ${index + 1}`);
      });
      const tools = [...root.querySelectorAll<HTMLButtonElement>('app-sector-card button')];
      expect(tools.length).toBe(service.sectors.length * 2);
      expect(tools.every((button) => button.disabled || button.className.includes('edit'))).toBe(
        true,
      );
      const items = [...root.querySelectorAll('.faq-item')];
      expect(items).toHaveLength(service.faqs.length);
      service.faqs.forEach((item, index) => {
        expect(items[index]?.textContent).toContain(item.question.ar);
        expect(items[index]?.textContent).toContain(item.answer.ar);
        expect(items[index]?.querySelector('header span')?.textContent).toBe(`0${index + 1}`);
      });
    });

    it('leaves out a sector that has no drawable picture instead of an unreadable tile', async () => {
      const sectors = [
        { ...serviceSector(), imageName: 'a.png', imageUrl: '/images/a.png' },
        { ...serviceSector(), imageName: 'pi-star', imageUrl: 'icon:pi-star' },
        serviceSector(),
      ];
      const service: Service = { ...seed('web-development'), sectors };
      const { harness, root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      await showTab(harness, root, 'القطاعات والأسئلة الشائعة');
      const cards = [...root.querySelectorAll('app-sector-card')];
      expect(cards).toHaveLength(1);
      expect(cards[0]?.querySelector('img')?.getAttribute('src')).toBe('/images/a.png');
      expect(cards[0]?.querySelector('img')?.getAttribute('alt')).toBe('');
      expect(cards[0]?.textContent).toContain('قطاع 1');
    });

    it('shows a subtle localized empty message in a section with no content', async () => {
      const blank: Service = {
        ...blankService(),
        id: 'blank',
        name: localeText('خدمة', 'Service'),
        published: false,
      };
      const { harness, root } = await open('/services/blank', {
        services: { get: () => of(blank) },
      });
      const empty = 'لم تتم إضافة أي محتوى إلى هذا القسم بعد.';
      for (const label of [
        'لماذا نحتاج للخدمة',
        'حلول الخدمة',
        'مراحل الخدمة',
        'مميزات الخدمة',
        'مشاريع الخدمة',
        'القطاعات والأسئلة الشائعة',
      ]) {
        await showTab(harness, root, label);
        expect(text(root), label).toContain(empty);
        expect(root.querySelector('.service-detail__card'), label).toBeNull();
        expect(root.querySelector('.faq-item'), label).toBeNull();
        expect(root.querySelector('app-sector-card'), label).toBeNull();
        expect(root.querySelector('.service-detail__project'), label).toBeNull();
      }
      await showTab(harness, root, 'لماذا نحتاج للخدمة');
      expect(root.querySelector('.service-detail__photo')).toBeNull();
      expect(text(root)).toContain('لا توجد صورة');
      expect(root.querySelector('.service-detail__list')).toBeNull();
    });

    it('skips blank placeholder entries but keeps filled ones', async () => {
      const filled = servicePoint(localeText('مملوء', 'Filled'), localeText('وصف', 'Body'));
      const service: Service = {
        ...seed('web-development'),
        solutions: [servicePoint(), filled, servicePoint()],
        whyItems: [serviceWhyItem(), serviceWhyItem(localeText('سبب', 'Reason'))],
        sectors: [serviceSector()],
        faqs: [serviceFaq()],
      };
      const { harness, root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      expect(root.querySelectorAll('.service-detail__list li')).toHaveLength(1);
      await showTab(harness, root, 'حلول الخدمة');
      expect(root.querySelectorAll('.service-detail__card')).toHaveLength(1);
      expect(text(root)).toContain('مملوء');
      await showTab(harness, root, 'القطاعات والأسئلة الشائعة');
      expect(root.querySelector('app-sector-card')).toBeNull();
      expect(root.querySelector('.faq-item')).toBeNull();
    });

    it('falls back to the other language when a translation is blank', async () => {
      const service: Service = {
        ...seed('web-development'),
        name: localeText('', 'English only name'),
      };
      const { root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      expect(root.querySelector('h1')?.textContent).toBe('English only name');
    });
  });

  describe('related projects', () => {
    it('resolves project ids to the real projects, in the chosen order, with links', async () => {
      const { harness, root } = await open('/services/web-development');
      await showTab(harness, root, 'مشاريع الخدمة');
      const ids = seed('web-development').projectIds;
      const cards = [...root.querySelectorAll<HTMLAnchorElement>('.service-detail__project')];
      expect(cards).toHaveLength(ids.length);
      expect(root.querySelector('.service-detail__add-project')).not.toBeNull();
      ids.forEach((id, index) => {
        const project = PROJECTS_SEED.find((item) => item.id === id);
        expect(cards[index]?.textContent).toContain(project?.name.ar);
        expect(cards[index]?.getAttribute('href')).toBe(`/projects/${id}`);
        expect(cards[index]?.querySelector('img')?.getAttribute('src')).toBe(project?.coverUrl);
        expect(cards[index]?.querySelector('p-toggleswitch')).not.toBeNull();
      });
      expect(text(root)).not.toContain('لم تعد متوفرة');
    });

    it('skips missing project references safely without mutating the service or projects', async () => {
      const service = deepFreeze({
        ...seed('web-development'),
        projectIds: ['wasly', 'deleted-project', 'retail-pulse'],
      });
      const projects = deepFreeze(structuredClone(PROJECTS_SEED));
      const { harness, root } = await open('/services/web-development', {
        services: { get: () => of(service) },
        projects: { list: () => of(projects) },
      });
      await showTab(harness, root, 'مشاريع الخدمة');
      const names = [...root.querySelectorAll('.service-detail__project h3')].map((item) =>
        item.textContent?.trim(),
      );
      expect(names).toEqual([
        PROJECTS_SEED.find((item) => item.id === 'wasly')?.name.ar,
        PROJECTS_SEED.find((item) => item.id === 'retail-pulse')?.name.ar,
      ]);
      expect(text(root)).toContain('بعض المشاريع المرتبطة لم تعد متوفرة.');
      expect(service.projectIds).toEqual(['wasly', 'deleted-project', 'retail-pulse']);
    });

    it('shows the empty message and the note when no reference resolves', async () => {
      const service: Service = { ...seed('web-development'), projectIds: ['gone-1', 'gone-2'] };
      const { harness, root } = await open('/services/web-development', {
        services: { get: () => of(service) },
      });
      await showTab(harness, root, 'مشاريع الخدمة');
      expect(root.querySelector('.service-detail__project')).toBeNull();
      expect(text(root)).toContain('لم تتم إضافة أي محتوى إلى هذا القسم بعد.');
      expect(text(root)).toContain('بعض المشاريع المرتبطة لم تعد متوفرة.');
    });

    it('does not report references as missing when the projects could not be loaded', async () => {
      const list = vi.fn<() => Observable<(typeof PROJECTS_SEED)[number][]>>();
      list.mockReturnValueOnce(throwError(() => new Error('offline')));
      list.mockReturnValue(of(PROJECTS_SEED));
      const { harness, root } = await open('/services/web-development', {
        projects: { list },
      });
      await showTab(harness, root, 'مشاريع الخدمة');
      expect(text(root)).toContain('تعذر تحميل المشاريع المرتبطة.');
      expect(text(root)).not.toContain('لم تعد متوفرة');
      expect(root.querySelector('.service-detail__project')).toBeNull();
      expect(root.querySelector('h1')).not.toBeNull();

      const retry = [...root.querySelectorAll('.detail-panel app-state-view button')].find(
        (button) => button.textContent?.includes('إعادة المحاولة'),
      ) as HTMLButtonElement | undefined;
      retry?.click();
      await settle(harness);
      expect(list).toHaveBeenCalledTimes(2);
      expect(root.querySelectorAll('.service-detail__project')).toHaveLength(2);
    });

    it('shows a loading state while projects load, without hiding the rest of the page', async () => {
      const { harness, root } = await open('/services/web-development', {
        projects: { list: () => NEVER },
      });
      await showTab(harness, root, 'مشاريع الخدمة');
      expect(root.querySelector('.detail-panel app-state-view')?.textContent).toContain(
        'جار التحميل',
      );
      expect(root.querySelector('.service-detail__edit')).not.toBeNull();
    });
  });

  describe('breadcrumb', () => {
    const lastCrumb = () => TestBed.inject(BreadcrumbService).crumbs().at(-1)?.key;

    it('shows the localized service name instead of the id, and follows the language', async () => {
      const { harness } = await open('/services/web-development');
      const service = seed('web-development');
      expect(lastCrumb()).toBe(service.name.ar);
      TestBed.inject(LanguageService).set('en');
      await settle(harness);
      expect(lastCrumb()).toBe(service.name.en);
    });

    it('keeps the id for a missing service and never reuses a previous name', async () => {
      const { harness } = await open('/services/web-development');
      await harness.navigateByUrl('/services/does-not-exist');
      await settle(harness);
      expect(lastCrumb()).toBe('does-not-exist');
    });

    it('drops the name when the page is left, so a later load starts from the id', async () => {
      const get = vi.fn<(id: string) => Observable<Service | null>>();
      get.mockReturnValueOnce(of(seed('web-development')));
      get.mockReturnValue(NEVER);
      const { harness } = await open('/services/web-development', { services: { get } });
      expect(lastCrumb()).toBe(seed('web-development').name.ar);
      await harness.navigateByUrl('/services');
      await settle(harness);
      await harness.navigateByUrl('/services/web-development');
      await settle(harness);
      expect(lastCrumb()).toBe('web-development');
    });

    it('switches to the new name when the route id changes', async () => {
      const { harness } = await open('/services/web-development');
      await harness.navigateByUrl('/services/mobile-apps');
      await settle(harness);
      expect(lastCrumb()).toBe(seed('mobile-apps').name.ar);
    });
  });

  describe('localization', () => {
    it('renders Arabic copy in RTL with the arrow pointing the reading direction', async () => {
      const { root } = await open('/services/web-development');
      expect(document.documentElement.dir).toBe('rtl');
      expect(text(root)).toContain('تعديل الخدمة');
      expect(text(root)).toContain('العودة إلى الخدمات');
      expect(root.querySelector('.service-detail__back i')?.className).toContain('pi-arrow-right');
    });

    it('renders English copy in LTR across the header and every section', async () => {
      const { harness, root } = await open('/services/web-development');
      TestBed.inject(LanguageService).set('en');
      await settle(harness);
      const service = seed('web-development');
      expect(document.documentElement.dir).toBe('ltr');
      expect(root.querySelector('h1')?.textContent).toBe(service.name.en);
      expect(text(root)).toContain(service.description.en);
      expect(text(root)).toContain('Published');
      expect(text(root)).toContain('Edit service');
      expect(text(root)).toContain('Back to services');
      expect(root.querySelector('.service-detail__back i')?.className).toContain('pi-arrow-left');
      expect(text(root)).toContain(service.whyItems[0]?.title.en);

      const expected: [string, string][] = [
        ['Service solutions', service.solutions[0]?.title.en ?? ''],
        ['Service stages', service.stages[0]?.title.en ?? ''],
        ['Service features', service.features[0]?.title.en ?? ''],
        ['Service projects', PROJECTS_SEED[0]?.name.en ?? ''],
        ['Sectors and FAQ', 'Sector 1'],
      ];
      for (const [tab, content] of expected) {
        await showTab(harness, root, tab);
        expect(text(root), tab).toContain(content);
      }
      expect(text(root)).toContain('Targeted sectors');
      expect(text(root)).toContain(service.faqs[0]?.question.en ?? '');
    });

    it('shows the English not-found message and back link', async () => {
      const { harness, root } = await open('/services/does-not-exist');
      TestBed.inject(LanguageService).set('en');
      await settle(harness);
      expect(text(root)).toContain('This service could not be found.');
      expect(text(root)).toContain('Back to services');
    });
  });
});

async function settle(harness: { fixture: { whenStable: () => Promise<unknown> } }) {
  await new Promise((resolve) => setTimeout(resolve, 20));
  await harness.fixture.whenStable();
  (harness as RouterTestingHarness).detectChanges();
}
