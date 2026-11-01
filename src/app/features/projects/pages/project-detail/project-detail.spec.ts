import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { API_LATENCY_MS } from '../../../../core/config/latency';
import { LanguageService } from '../../../../core/services/language.service';
import { blankProject, localeText, projectMedia, projectPoint } from '../../models/project.model';
import { ProjectsService } from '../../services/projects.service';
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
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
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

  it('renders project data and edit navigation', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('وصلني');
    expect(root.querySelector('a[href="/projects/wasly/edit"]')).not.toBeNull();
    expect(root.textContent).toContain('بيانات المشروع');
  });

  it('renders about cards, challenges, tools, solutions, and the solutions image', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('نبذة عن المشروع');
    expect(root.textContent).toContain('لماذا هذا المشروع');
    expect(root.textContent).toContain('أبرز تحديات المشروع');
    expect(root.textContent).toContain('تعقيد التكامل');
    expect(root.querySelector('.project-detail__list .pi-share-alt')).not.toBeNull();

    expect(root.textContent).toContain('التكامل الرقمي');
    const tool = root.querySelector('.project-detail__tool img') as HTMLImageElement | null;
    expect(tool?.getAttribute('src')).toBeTruthy();
    expect(tool?.getAttribute('src')).not.toBe('');

    expect(root.textContent).toContain('الحلول المقدمة');
    expect(root.textContent).toContain('منصة موحدة');
    const solutionsImage = root.querySelector(
      '.project-detail__solutions-image',
    ) as HTMLImageElement | null;
    expect(solutionsImage?.getAttribute('src')).toBeTruthy();
    expect(solutionsImage?.getAttribute('src')).not.toBe('');
  });

  it('renders uploaded aboutCards, features, and results images and icons', async () => {
    const aboutImage = {
      ...projectPoint(localeText('بطاقة بصورة', 'Card with image'), localeText()),
      imageName: 'about.png',
      imageUrl: '/images/about-card.png',
    };
    const featureIcon = {
      ...projectPoint(localeText('ميزة بأيقونة', 'Feature with icon'), localeText()),
      imageName: 'icon',
      imageUrl: 'icon:pi-bolt',
    };
    const resultImage = {
      ...projectPoint(localeText(), localeText()),
      imageName: 'result.png',
      imageUrl: '/images/result.png',
    };
    const project = {
      ...blankProject(),
      id: 'visuals',
      name: localeText('مشروع بصري', 'Visual project'),
      aboutCards: [aboutImage],
      challenges: [
        {
          ...projectPoint(localeText('تحدي محفوظ', 'Kept challenge'), localeText()),
          imageName: 'icon',
          imageUrl: 'icon:pi-exclamation-triangle',
        },
      ],
      solutions: [
        {
          ...projectPoint(localeText('حل محفوظ', 'Kept solution'), localeText()),
          imageName: 'solution.png',
          imageUrl: '/images/solution.png',
        },
      ],
      features: [featureIcon],
      results: [resultImage],
    };
    const fixture = await render('visuals', { get: () => of(project) });
    const root: HTMLElement = fixture.nativeElement;

    const aboutThumb = [...root.querySelectorAll('.project-detail__list img')].find(
      (image) => image.getAttribute('src') === '/images/about-card.png',
    );
    expect(aboutThumb).toBeTruthy();
    expect(root.textContent).toContain('بطاقة بصورة');

    expect(root.querySelector('.project-detail__list .pi-bolt')).not.toBeNull();
    expect(root.textContent).toContain('ميزة بأيقونة');

    const resultThumb = [...root.querySelectorAll('.project-detail__list img')].find(
      (image) => image.getAttribute('src') === '/images/result.png',
    );
    expect(resultThumb).toBeTruthy();

    expect(root.querySelector('.project-detail__list .pi-exclamation-triangle')).not.toBeNull();
    const solutionThumb = [...root.querySelectorAll('.project-detail__list img')].find(
      (image) => image.getAttribute('src') === '/images/solution.png',
    );
    expect(solutionThumb).toBeTruthy();
    expect(root.textContent).toContain('تحدي محفوظ');
    expect(root.textContent).toContain('حل محفوظ');
  });

  it('omits image-only points with empty or invalid image values', async () => {
    const project = {
      ...blankProject(),
      id: 'invalid-visuals',
      name: localeText('نقاط فارغة', 'Empty points'),
      aboutCards: [
        { ...projectPoint(), imageName: '', imageUrl: '' },
        { ...projectPoint(), imageName: 'bad', imageUrl: 'icon:not valid' },
      ],
      features: [{ ...projectPoint(), imageName: '', imageUrl: '' }],
      results: [{ ...projectPoint(), imageName: 'bad', imageUrl: 'icon:' }],
      challenges: [projectPoint()],
      solutions: [projectPoint()],
    };
    const fixture = await render('invalid-visuals', { get: () => of(project) });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).not.toContain('نبذة عن المشروع');
    expect(root.textContent).not.toContain('خصائص المشروع');
    expect(root.textContent).not.toContain('النتائج المحققة');
    expect(root.textContent).not.toContain('أبرز تحديات المشروع');
    expect(root.textContent).not.toContain('الحلول المقدمة');
    expect(root.querySelectorAll('.project-detail__list li')).toHaveLength(0);
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
    expect(root.textContent).toContain('Key project challenges');
    expect(root.textContent).toContain('Integration complexity');
    expect(root.textContent).toContain('Digital integration');
    expect(root.textContent).toContain('Integration tool');
    expect(root.textContent).toContain('Provided solutions');
    expect(root.textContent).toContain('Unified platform');
  });

  it('omits empty optional sections and never renders empty image sources', async () => {
    const empty = {
      ...blankProject(),
      id: 'sparse',
      name: localeText('مشروع فارغ', 'Sparse project'),
      summary: localeText(),
      coverUrl: '',
      aboutCards: [projectPoint()],
      challenges: [projectPoint()],
      tools: [projectMedia()],
      solutions: [projectPoint()],
      solutionsImage: projectMedia(),
      features: [projectPoint(localeText('ميزة', 'Feature'), localeText())],
      results: [projectPoint()],
      gallery: [{ id: 'g1', imageName: '', imageUrl: '' }],
      identityButtons: [
        {
          id: 'id1',
          title: localeText(),
          body: localeText(),
          images: [
            { id: 'i1', imageName: '', imageUrl: '' },
            { id: 'i2', imageName: 'icon', imageUrl: 'icon:pi-star' },
          ],
        },
      ],
    };
    const fixture = await render('sparse', { get: () => of(empty) });
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('.project-detail__cover')).toBeNull();
    expect(root.textContent).not.toContain('نبذة عن المشروع');
    expect(root.textContent).not.toContain('أبرز تحديات المشروع');
    expect(root.textContent).not.toContain('التكامل الرقمي');
    expect(root.textContent).not.toContain('الحلول المقدمة');
    expect(root.textContent).toContain('خصائص المشروع');
    expect(root.textContent).toContain('ميزة');
    expect(root.textContent).not.toContain('النتائج المحققة');

    expect(
      [...root.querySelectorAll('img')].every((image) => (image.getAttribute('src') ?? '') !== ''),
    ).toBe(true);
  });

  it('renders identity button title, body, and non-empty images', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    const identityTab = [...root.querySelectorAll('button, a, [role="tab"]')].find((item) =>
      item.textContent?.includes('الهوية الرقمية'),
    );
    expect(identityTab).toBeTruthy();
    (identityTab as HTMLElement).click();
    fixture.detectChanges();

    expect(root.textContent).toContain('الهوية البصرية');
    expect(root.textContent).toContain('ألوان وصور تعكس شخصية العلامة للمشروع.');
    const images = root.querySelectorAll('.project-detail__identity img');
    expect(images.length).toBe(4);
    expect([...images].every((image) => (image as HTMLImageElement).src.length > 0)).toBe(true);
  });

  it('keeps existing tabs and edit navigation', async () => {
    const fixture = await render('wasly');
    const root: HTMLElement = fixture.nativeElement;
    const labels = [...root.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent?.trim());
    expect(labels).toEqual(['بيانات المشروع', 'المعرض', 'الهوية الرقمية', 'SEO']);
    expect(root.querySelector('a[href="/projects/wasly/edit"]')).not.toBeNull();
  });

  it('shows an empty state for a missing project id', async () => {
    const fixture = await render('missing-project');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('لم يتم العثور على هذا المشروع');
  });
});
