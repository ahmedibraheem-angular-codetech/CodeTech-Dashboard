import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { Subject, of } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { type ContentBlock } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';
import { ContentBlockCard } from './content-block-card';

const HOME_GRANTS = ['home.view', 'home.create', 'home.update', 'home.delete'] as const;

const block: ContentBlock = {
  texts: {
    ar: { title: 'عن كود التقنية', body: 'نبذة', points: ['نقطة ١', 'نقطة ٢'] },
    en: { title: 'About', body: 'Summary', points: ['Point 1'] },
  },
  image: { name: 'about.png', size: 320512, uploadedAt: '2026-08-31', uuid: 'about-image' },
};

const emptyText = { title: '', body: '', points: [] };

describe('ContentBlockCard', () => {
  async function setup(value: ContentBlock = block): Promise<ComponentFixture<ContentBlockCard>> {
    TestBed.configureTestingModule({
      imports: [ContentBlockCard],
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
        permissions: [...HOME_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(ContentBlockCard);
    fixture.componentRef.setInput('kind', 'about');
    fixture.componentRef.setInput('block', value);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const root = (fixture: ComponentFixture<ContentBlockCard>): HTMLElement => fixture.nativeElement;

  const dialogRoot = (): HTMLElement => document.body;

  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask, .p-dialog').forEach((node) => node.remove());
  });

  function file(name: string, type: string, size = 1024): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it('shows the text of the application language', async () => {
    const fixture = await setup();
    expect(root(fixture).querySelector('.story h3')?.textContent).toBe('عن كود التقنية');
    expect(root(fixture).querySelectorAll('.check-list li')).toHaveLength(2);
  });

  it('falls back to the other language while the current one is empty', async () => {
    const fixture = await setup({ ...block, texts: { ar: emptyText, en: block.texts.en } });
    expect(root(fixture).querySelector('.story h3')?.textContent).toBe('About');
  });

  it('shows the empty state when neither language has a body', async () => {
    const fixture = await setup({ ...block, texts: { ar: emptyText, en: emptyText } });
    expect(root(fixture).querySelector('app-section-empty')).not.toBeNull();
    expect(root(fixture).querySelector('.story')).toBeNull();
  });

  it('opens the modal filled with both languages, the points and the image', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.open();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.form.controls.ar.controls.points.length).toBe(2);
    expect(component.form.controls.en.controls.points.length).toBe(1);
    expect(component.form.controls.en.controls.title.value).toBe('About');
    expect(component.image()?.name).toBe('about.png');
    expect(dialogRoot().querySelector('.p-dialog.app-modal')).not.toBeNull();
    expect(dialogRoot().querySelectorAll('.point-row')).toHaveLength(2);
    expect(dialogRoot().querySelector('.image-file strong')?.textContent).toBe('about.png');
  });

  it('shows the fields of the picked language tab', async () => {
    const fixture = await setup();
    fixture.componentInstance.open();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    dialogRoot().querySelectorAll<HTMLButtonElement>('.locale-switch__option')[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.locale()).toBe('en');
    expect(dialogRoot().querySelector('.block-form__lang')?.getAttribute('dir')).toBe('ltr');
    expect(dialogRoot().querySelectorAll('.point-row')).toHaveLength(1);
  });

  it('adds and removes points independently per language', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.open();
    component.addPoint('en');
    component.removePoint('ar', 0);
    expect(component.form.controls.en.controls.points.length).toBe(2);
    expect(component.form.controls.ar.controls.points.value).toEqual(['نقطة ٢']);
  });

  it('starts an empty block with one empty point row', async () => {
    const fixture = await setup({ ...block, texts: { ar: emptyText, en: emptyText }, image: null });
    fixture.componentInstance.open();
    expect(fixture.componentInstance.form.controls.ar.controls.points.length).toBe(1);
    expect(fixture.componentInstance.image()).toBeNull();
  });

  it('allows saving with no required fields in either language', async () => {
    const fixture = await setup({ ...block, texts: { ar: emptyText, en: emptyText }, image: null });
    const component = fixture.componentInstance;
    component.open();
    expect(component.form.controls.ar.valid).toBe(true);
    expect(component.form.controls.en.valid).toBe(true);

    const save = vi
      .spyOn(TestBed.inject(HomepageService), 'saveBlock')
      .mockReturnValue(of({ texts: { ar: emptyText, en: emptyText }, image: null }));
    component.save();
    expect(save).toHaveBeenCalled();
  });

  it('saves trimmed text, drops blank points and tells the parent', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    const saved = vi.fn();
    component.blockSaved.subscribe(saved);
    vi.spyOn(TestBed.inject(HomepageService), 'saveBlock').mockImplementation((_kind, next) =>
      of(next),
    );

    component.open();
    component.form.controls.ar.controls.title.setValue('  عنوان  ');
    component.addPoint('en');
    component.form.controls.en.controls.points.at(1).setValue('   ');
    component.save();
    await fixture.whenStable();
    expect(component.saving()).toBe(false);
    expect(component.editorOpen()).toBe(false);
    const result: ContentBlock = saved.mock.calls[0][0];
    expect(result.texts.ar.title).toBe('عنوان');
    expect(result.texts.en.points).toEqual(['Point 1']);
    expect(result.image?.name).toBe('about.png');
  });

  it('ignores a second save while the first one is in flight', async () => {
    const fixture = await setup();
    const pending = new Subject<ContentBlock>();
    const save = vi
      .spyOn(TestBed.inject(HomepageService), 'saveBlock')
      .mockReturnValue(pending.asObservable());
    fixture.componentInstance.open();
    fixture.componentInstance.save();
    fixture.componentInstance.save();
    expect(save).toHaveBeenCalledTimes(1);
    pending.next(block);
    pending.complete();
  });

  it('rejects an unsupported or oversized image and keeps the current one', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.open();

    component.onDrop(dropOf(file('doc.pdf', 'application/pdf')));
    expect(component.imageError()).toBe('home.imageType');

    component.onDrop(dropOf(file('big.png', 'image/png', 5 * 1024 * 1024 + 1)));
    expect(component.imageError()).toBe('home.imageSize');
    expect(component.image()?.name).toBe('about.png');
  });

  it('replaces and removes the image', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;
    component.open();

    component.onDrop(dropOf(file('new.jpg', 'image/jpeg', 2048)));
    expect(component.image()).toMatchObject({ name: 'new.jpg', size: 2048 });
    expect(component.image()?.file).toBeInstanceOf(File);
    expect(component.imageError()).toBe('');

    component.removeImage();
    expect(component.image()).toBeNull();
  });
});

function dropOf(value: File): DragEvent {
  const event = new Event('drop') as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files: [value] } });
  return event;
}
