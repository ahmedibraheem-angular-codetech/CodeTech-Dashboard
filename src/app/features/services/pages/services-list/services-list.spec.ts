import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { SERVICES_SEED } from '../../services/services.mock';
import { ServicesService } from '../../services/services.service';
import { ServicesPage } from './services-list';

describe('ServicesPage', () => {
  async function settle<T>(fixture: { detectChanges(): void; whenStable(): Promise<void> } & T) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(prepare?: (api: ServicesService) => Promise<void>) {
    TestBed.configureTestingModule({
      imports: [ServicesPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    const api = TestBed.inject(ServicesService);
    await prepare?.(api);
    const fixture = TestBed.createComponent(ServicesPage);
    fixture.detectChanges();
    return { fixture, api, root: fixture.nativeElement as HTMLElement };
  }

  const cards = (root: HTMLElement) => root.querySelectorAll('app-service-card');
  const confirmOf = (fixture: { componentRef: { instance: ServicesPage } }) =>
    fixture.componentRef.instance['confirm']();

  afterEach(() => {
    TestBed.inject(LanguageService).set('ar');
  });

  it('shows the loading state until the services arrive', async () => {
    const { fixture, root } = await render();
    expect(root.querySelector('app-state-view .pi-inbox')).toBeNull();
    expect(root.querySelector('app-state-view p-progress-spinner')).not.toBeNull();
    expect(cards(root)).toHaveLength(0);
    await settle(fixture);
    expect(root.querySelector('app-state-view')).toBeNull();
    expect(cards(root)).toHaveLength(6);
  });

  it('renders the page header, the add button, and all six services including drafts', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    expect(root.querySelector('h1')?.textContent).toBe('إدارة الخدمات');
    expect(root.querySelector('.services-board__title')?.textContent).toBe('الخدمات');
    expect(root.textContent).toContain('إضافة خدمة جديدة');
    expect(cards(root)).toHaveLength(6);
    const switches = root.querySelectorAll<HTMLInputElement>('p-toggleswitch input');
    expect([...switches].map((input) => input.checked)).toEqual(
      SERVICES_SEED.map((service) => service.published),
    );
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).not.toContain('الكتالوج');
  });

  it('renders each service icon from its independent `icon` field', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    const icons = [...root.querySelectorAll('.service-card__icon i')].map((icon) =>
      [...icon.classList].find((name) => name.startsWith('pi-')),
    );
    expect(icons).toEqual(SERVICES_SEED.map((service) => service.icon));
  });

  it('shows Arabic copy in Arabic and English copy in English', async () => {
    const { fixture, root } = await render();
    await settle(fixture);
    const first = SERVICES_SEED[0]!;
    expect(root.querySelector('app-service-card h2')?.textContent?.trim()).toBe(first.name.ar);
    expect(root.querySelector('.service-card__description')?.textContent).toBe(
      first.description.ar,
    );
    expect(document.documentElement.dir).toBe('rtl');

    TestBed.inject(LanguageService).set('en');
    fixture.detectChanges();
    expect(document.documentElement.dir).toBe('ltr');
    expect(root.querySelector('h1')?.textContent).toBe('Manage services');
    expect(root.querySelector('.services-board__title')?.textContent).toBe('Services');
    expect(root.textContent).toContain('Add a new service');
    expect(root.querySelector('app-service-card h2')?.textContent?.trim()).toBe(first.name.en);
    expect(root.querySelector('.service-card__description')?.textContent).toBe(
      first.description.en,
    );
  });

  it('publishes and unpublishes through ServicesService and keeps the list in sync', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    const switches = () => root.querySelectorAll<HTMLInputElement>('p-toggleswitch input');
    const target = SERVICES_SEED.findIndex((service) => !service.published);
    expect(target).toBeGreaterThan(-1);
    const id = SERVICES_SEED[target]!.id;

    switches()[target]!.click();
    fixture.detectChanges();
    expect((await firstValueFrom(api.get(id)))?.published).toBe(true);
    expect(switches()[target]!.checked).toBe(true);

    switches()[target]!.click();
    fixture.detectChanges();
    expect((await firstValueFrom(api.get(id)))?.published).toBe(false);
    expect(switches()[target]!.checked).toBe(false);
  });

  it('navigates to /services/new from the add button', async () => {
    const { fixture, root } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await settle(fixture);
    const add = [...root.querySelectorAll<HTMLButtonElement>('app-page-header button')].find(
      (button) => button.textContent?.includes('إضافة خدمة جديدة'),
    );
    expect(add).toBeDefined();
    add!.click();
    expect(navigate).toHaveBeenCalledWith(['/services', 'new']);
  });

  it('navigates to /services/:id/edit from a card edit action', async () => {
    const { fixture, root } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await settle(fixture);
    const edits = root.querySelectorAll<HTMLButtonElement>('button[aria-label="تعديل الخدمة"]');
    expect(edits).toHaveLength(6);
    edits[1]!.click();
    expect(navigate).toHaveBeenCalledWith(['/services', SERVICES_SEED[1]!.id, 'edit']);
  });

  it('navigates to /services/:id when a service card is clicked', async () => {
    const { fixture, root } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await settle(fixture);
    const cards = root.querySelectorAll<HTMLElement>('.service-card__description');
    cards[2]!.click();
    expect(navigate).toHaveBeenCalledWith(['/services', SERVICES_SEED[2]!.id]);
    root.querySelectorAll<HTMLButtonElement>('.service-card h2 button')[0]!.click();
    expect(navigate).toHaveBeenLastCalledWith(['/services', SERVICES_SEED[0]!.id]);
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('keeps the service when the delete confirmation is cancelled', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    const ask = vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(false);
    root.querySelector<HTMLButtonElement>('button[aria-label="حذف الخدمة"]')!.click();
    await settle(fixture);
    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask.mock.calls[0]![0]).toMatchObject({
      title: 'حذف الخدمة',
      message: 'هل تريد حذف هذه الخدمة؟',
      danger: true,
    });
    expect(cards(root)).toHaveLength(6);
    expect(await firstValueFrom(api.list())).toHaveLength(6);
  });

  it('removes the service and updates the list when deletion is confirmed', async () => {
    const { fixture, api, root } = await render();
    await settle(fixture);
    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    const removed = SERVICES_SEED[0]!;
    root.querySelector<HTMLButtonElement>('button[aria-label="حذف الخدمة"]')!.click();
    await settle(fixture);
    expect(cards(root)).toHaveLength(5);
    expect(root.textContent).not.toContain(removed.name.ar);
    expect(await firstValueFrom(api.get(removed.id))).toBeNull();
    expect(await firstValueFrom(api.list())).toHaveLength(5);
  });

  it('shows the empty state when there are no services', async () => {
    const { fixture, root } = await render(async (api) => {
      for (const service of SERVICES_SEED) {
        await firstValueFrom(api.remove(service.id));
      }
    });
    await settle(fixture);
    expect(cards(root)).toHaveLength(0);
    expect(root.querySelector('app-state-view')?.textContent).toContain('لا توجد خدمات بعد');
    expect(root.querySelector('app-paginator')).toBeNull();
    expect(root.textContent).toContain('إضافة خدمة جديدة');
  });

  it('paginates long lists and steps back when the last card of a page is removed', async () => {
    const { fixture, root } = await render(async (api) => {
      const base = SERVICES_SEED[0]!;
      for (let index = 0; index < 5; index += 1) {
        await firstValueFrom(api.save({ ...structuredClone(base), id: `extra-${index}` }));
      }
    });
    await settle(fixture);
    expect(cards(root)).toHaveLength(10);
    expect(root.querySelector('app-paginator')).not.toBeNull();

    const page = fixture.componentInstance;
    page['page']({ first: 10, rows: 10 });
    fixture.detectChanges();
    expect(cards(root)).toHaveLength(1);

    vi.spyOn(confirmOf(fixture), 'ask').mockResolvedValue(true);
    root.querySelector<HTMLButtonElement>('button[aria-label="حذف الخدمة"]')!.click();
    await settle(fixture);
    expect(page.first()).toBe(0);
    expect(cards(root)).toHaveLength(10);
  });
});
