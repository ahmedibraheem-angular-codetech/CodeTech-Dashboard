import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { blankProject, localeText, projectMedia, projectPoint } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
import { ProjectsMemoryService } from '../../testing/projects.memory';
import { ProjectDetailPage } from './project-detail';

const PROJECT_GRANTS = [
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.delete',
] as const;

describe('ProjectDetailPage', () => {
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
    TestBed.inject(LanguageService).set('ar');
  });

  async function settle(fixture: {
    detectChanges(): void;
    whenStable(): Promise<unknown>;
  }): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(id: string, api?: Pick<ProjectsService, 'get'>) {
    TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        MessageService,
        { provide: ProjectsService, useClass: ProjectsMemoryService },
        provideRouter([]),
      ],
    });
    if (api) {
      TestBed.overrideProvider(ProjectsService, { useValue: api });
    }
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService).set('ar');
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...PROJECT_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  function openTab(
    fixture: { detectChanges(): void; nativeElement: HTMLElement },
    label: string,
  ): void {
    const root: HTMLElement = fixture.nativeElement;
    const tab = [...root.querySelectorAll('button, a, [role="tab"]')].find((item) =>
      item.textContent?.includes(label),
    );
    expect(tab).toBeTruthy();
    (tab as HTMLElement).click();
    fixture.detectChanges();
  }

  it('renders project data and edit navigation', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('وصلني');
    expect(root.querySelector('.detail-status')).not.toBeNull();
    expect(root.querySelector('a.detail-edit[href="/projects/wasly/edit"]')).not.toBeNull();
    expect(root.querySelector('a.detail-edit .pi-pen-to-square')).not.toBeNull();
    expect(root.querySelector('app-page-tabs')).not.toBeNull();
    expect(root.textContent).toContain('عن المشروع');
  });

  it('renders about cards, challenges, tools, solutions, and the solutions image', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('نبذة عن المشروع');
    expect(root.textContent).toContain('لماذا هذا المشروع');
    expect(root.querySelector('.detail-photo')).not.toBeNull();

    openTab(fixture, 'أبرز التحديات');
    expect(root.textContent).toContain('أبرز تحديات المشروع');
    expect(root.textContent).toContain('تعقيد التكامل');
    expect(root.querySelector('.challenge-grid .pi-share-alt')).not.toBeNull();
    expect(root.textContent).toContain('التكامل الرقمي');
    const tool = root.querySelector('.project-detail__tool img') as HTMLImageElement | null;
    expect(tool?.getAttribute('src')).toBeTruthy();
    expect(tool?.getAttribute('src')).not.toBe('');

    openTab(fixture, 'الحلول المقدمة');
    expect(root.textContent).toContain('الحلول المقدمة');
    expect(root.textContent).toContain('منصة موحدة');
    const solutionsImage = root.querySelector('.detail-photo') as HTMLImageElement | null;
    expect(solutionsImage?.getAttribute('src')).toBeTruthy();
    expect(solutionsImage?.getAttribute('src')).not.toBe('');
  });

  it('renders uploaded aboutCards, features, and results images and icons', async () => {
    const aboutImage = {
      ...projectPoint(localeText('بطاقة بصورة', 'Card with image'), localeText()),
      image: {
        ar: { imageName: 'about.png', imageUrl: '/images/about-card.png', imageUuid: null },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
    };
    const featureIcon = {
      ...projectPoint(localeText('ميزة بأيقونة', 'Feature with icon'), localeText()),
      image: {
        ar: { imageName: 'icon', imageUrl: 'icon:pi-bolt', imageUuid: null },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
    };
    const resultImage = {
      ...projectPoint(localeText(), localeText()),
      image: {
        ar: { imageName: 'result.png', imageUrl: '/images/result.png', imageUuid: null },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
    };
    const project = {
      ...blankProject(),
      id: 'visuals',
      name: localeText('مشروع بصري', 'Visual project'),
      aboutCards: [aboutImage],
      challenges: [
        {
          ...projectPoint(localeText('تحدي محفوظ', 'Kept challenge'), localeText()),
          image: {
            ar: { imageName: 'icon', imageUrl: 'icon:pi-exclamation-triangle', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      solutions: [
        {
          ...projectPoint(localeText('حل محفوظ', 'Kept solution'), localeText()),
          image: {
            ar: { imageName: 'solution.png', imageUrl: '/images/solution.png', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      features: [featureIcon],
      results: [resultImage],
    };
    const fixture = await render('visuals', { get: () => of(project) });
    const root: HTMLElement = fixture.nativeElement;

    const aboutThumb = [...root.querySelectorAll('.challenge-grid img')].find(
      (image) => image.getAttribute('src') === '/images/about-card.png',
    );
    expect(aboutThumb).toBeTruthy();
    expect(root.textContent).toContain('بطاقة بصورة');

    openTab(fixture, 'خصائص المشروع');
    expect(root.querySelector('.challenge-grid .pi-bolt')).not.toBeNull();
    expect(root.textContent).toContain('ميزة بأيقونة');

    openTab(fixture, 'النتائج المحققة');
    const resultThumb = [...root.querySelectorAll('.challenge-grid img')].find(
      (image) => image.getAttribute('src') === '/images/result.png',
    );
    expect(resultThumb).toBeTruthy();

    openTab(fixture, 'أبرز التحديات');
    expect(root.querySelector('.challenge-grid .pi-exclamation-triangle')).not.toBeNull();
    expect(root.textContent).toContain('تحدي محفوظ');

    openTab(fixture, 'الحلول المقدمة');
    const solutionThumb = [...root.querySelectorAll('.challenge-grid img')].find(
      (image) => image.getAttribute('src') === '/images/solution.png',
    );
    expect(solutionThumb).toBeTruthy();
    expect(root.textContent).toContain('حل محفوظ');
  });

  it('omits image-only points with empty or invalid image values', async () => {
    const project = {
      ...blankProject(),
      id: 'invalid-visuals',
      name: localeText('نقاط فارغة', 'Empty points'),
      aboutCards: [
        { ...projectPoint(), image: { ar: { imageName: '', imageUrl: '', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } },
        { ...projectPoint(), image: { ar: { imageName: 'bad', imageUrl: 'icon:not valid', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } },
      ],
      features: [{ ...projectPoint(), image: { ar: { imageName: '', imageUrl: '', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } }],
      results: [{ ...projectPoint(), image: { ar: { imageName: 'bad', imageUrl: 'icon:', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } }],
      challenges: [projectPoint()],
      solutions: [projectPoint()],
    };
    const fixture = await render('invalid-visuals', { get: () => of(project) });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).not.toContain('نبذة عن المشروع');
    expect(root.querySelectorAll('.challenge-grid li')).toHaveLength(0);

    openTab(fixture, 'خصائص المشروع');
    expect(root.querySelector('.detail-panel')).toBeNull();
    expect(root.querySelectorAll('.challenge-grid li')).toHaveLength(0);

    openTab(fixture, 'النتائج المحققة');
    expect(root.querySelector('.detail-panel')).toBeNull();
    expect(root.querySelectorAll('.challenge-grid li')).toHaveLength(0);

    openTab(fixture, 'أبرز التحديات');
    expect(root.textContent).not.toContain('أبرز تحديات المشروع');
    expect(root.querySelectorAll('.challenge-grid li')).toHaveLength(0);

    openTab(fixture, 'الحلول المقدمة');
    expect(root.querySelector('.detail-panel')).toBeNull();
    expect(root.querySelectorAll('.challenge-grid li')).toHaveLength(0);
    expect(
      [...root.querySelectorAll('img')].every((image) => (image.getAttribute('src') ?? '') !== ''),
    ).toBe(true);
  });

  it('renders locale-specific content for the omitted fields in English', async () => {
    const fixture = await render('wasly');
    TestBed.inject(LanguageService).set('en');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('About the project');
    expect(root.textContent).toContain('Why this project');

    openTab(fixture, 'Key challenges');
    expect(root.textContent).toContain('Key project challenges');
    expect(root.textContent).toContain('Integration complexity');
    expect(root.textContent).toContain('Digital integration');
    expect(root.textContent).toContain('Integration tool');

    openTab(fixture, 'Solutions and gallery');
    expect(root.textContent).toContain('Provided solutions');
    expect(root.textContent).toContain('Unified platform');
  });

  it('omits empty optional sections and never renders empty image sources', async () => {
    const empty = {
      ...blankProject(),
      id: 'sparse',
      name: localeText('مشروع فارغ', 'Sparse project'),
      summary: localeText(),
      cover: {
        ar: { imageName: '', imageUrl: '', imageUuid: null },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
      aboutCards: [projectPoint()],
      challenges: [projectPoint()],
      tools: [projectMedia()],
      solutions: [projectPoint()],
      solutionsImage: projectMedia(),
      features: [projectPoint(localeText('ميزة', 'Feature'), localeText())],
      results: [projectPoint()],
      gallery: [{ id: 'g1', image: { ar: { imageName: '', imageUrl: '', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } }],
      identityButtons: [
        {
          id: 'id1',
          title: localeText(),
          body: localeText(),
          images: [
            { id: 'i1', image: { ar: { imageName: '', imageUrl: '', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } },
            { id: 'i2', image: { ar: { imageName: 'icon', imageUrl: 'icon:pi-star', imageUuid: null }, en: { imageName: '', imageUrl: '', imageUuid: null } } },
          ],
        },
      ],
    };
    const fixture = await render('sparse', { get: () => of(empty) });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.detail-photo')).toBeNull();
    expect(root.textContent).not.toContain('نبذة عن المشروع');

    openTab(fixture, 'أبرز التحديات');
    expect(root.textContent).not.toContain('أبرز تحديات المشروع');
    expect(root.textContent).not.toContain('التكامل الرقمي');
    expect(root.querySelector('.detail-panel')).toBeNull();

    openTab(fixture, 'الحلول المقدمة');
    expect(root.querySelector('.detail-photo')).toBeNull();

    openTab(fixture, 'خصائص المشروع');
    expect(root.querySelector('.detail-panel h2')?.textContent).toContain('خصائص المشروع');
    expect(root.textContent).toContain('ميزة');

    openTab(fixture, 'النتائج المحققة');
    expect(root.querySelector('.detail-panel')).toBeNull();

    expect(
      [...root.querySelectorAll('img')].every((image) => (image.getAttribute('src') ?? '') !== ''),
    ).toBe(true);
  });

  it('renders identity with tube tabs and non-empty images', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    openTab(fixture, 'الهوية الرقمية');

    expect(root.querySelector('.stat-tabs')).not.toBeNull();
    expect(root.querySelector('.stat-tab.is-active')).not.toBeNull();
    expect(root.textContent).toContain('الهوية البصرية');
    expect(root.textContent).toContain('ألوان وصور تعكس شخصية العلامة للمشروع.');
    const images = root.querySelectorAll('.project-detail__identity img');
    expect(images.length).toBe(4);
    expect([...images].every((image) => (image as HTMLImageElement).src.length > 0)).toBe(true);
  });

  it('uses page tabs and products-style edit navigation', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    const labels = [...root.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent?.trim());
    expect(labels).toEqual([
      'عن المشروع',
      'أبرز التحديات والأدوات',
      'الحلول المقدمة ومعرض المشروع',
      'خصائص المشروع',
      'النتائج المحققة',
      'الهوية الرقمية',
      'SEO',
    ]);
    expect(root.querySelector('a.detail-edit[href="/projects/wasly/edit"]')).not.toBeNull();
    expect(root.querySelector('button.detail-delete')).not.toBeNull();
  });

  it('shows an empty state for a missing project id', async () => {
    const fixture = await render('missing-project');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('لم يتم العثور على هذا المشروع');
  });
});
