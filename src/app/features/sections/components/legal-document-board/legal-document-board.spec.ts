import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { MediaService } from '../../../../core/media/media.service';
import {
  QUILL_FONT_REGISTRAR,
  resetQuillFontRegistrationForTests,
  type AppQuill,
} from '../../../../shared/editor/quill';
import type { LegalDocument, LegalDocumentKind } from '../../models/legal-document.model';
import { LegalDocumentService } from '../../services/legal-document.service';
import { LegalDocumentBoard } from './legal-document-board';

const termsDoc: LegalDocument = {
  kind: 'terms',
  content: {
    ar: '<h3>شروط عربية</h3><p>نص عربي</p>',
    en: '<h3>English terms</h3><p>English body</p>',
  },
  updatedAt: '2026-10-09',
};

const privacyDoc: LegalDocument = {
  kind: 'privacy',
  content: {
    ar: '<p>خصوصية عربية</p>',
    en: '<p>English privacy</p>',
  },
  updatedAt: '2026-10-09',
};

interface ApiMock {
  get: (kind: LegalDocumentKind) => Observable<LegalDocument>;
  save: (
    kind: LegalDocumentKind,
    draft: { content: { ar: string; en: string } },
  ) => Observable<LegalDocument>;
}

async function settle(fixture: ComponentFixture<LegalDocumentBoard>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

describe('LegalDocumentBoard', () => {
  afterEach(() => {
    resetQuillFontRegistrationForTests();
    vi.restoreAllMocks();
  });

  let uploadEditorImage: ReturnType<typeof vi.fn>;

  async function render(
    kind: LegalDocumentKind = 'terms',
    api: Partial<ApiMock> = {},
    extras: {
      registerFont?: () => Promise<{ status: 'ready' } | { status: 'failed'; error: unknown }>;
    } = {},
  ): Promise<ComponentFixture<LegalDocumentBoard>> {
    const defaults: ApiMock = {
      get: (requested) => of(requested === 'privacy' ? privacyDoc : termsDoc),
      save: (_kind, draft) =>
        of({
          kind: _kind,
          content: draft.content,
          updatedAt: '2026-10-26',
        }),
    };

    uploadEditorImage = vi.fn(() =>
      of({
        uuid: 'img-1',
        name: 'inline',
        file_name: 'inline.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://cdn.test/inline.png',
        download_url: 'https://cdn.test/download',
        created_at: '2026-11-01T00:00:00.000000Z',
      }),
    );

    TestBed.configureTestingModule({
      imports: [LegalDocumentBoard],
      providers: [
        MessageService,
        { provide: API_LATENCY_MS, useValue: 0 },
        {
          provide: LegalDocumentService,
          useValue: { ...defaults, ...api },
        },
        {
          provide: MediaService,
          useValue: { uploadEditorImage },
        },
        ...(extras.registerFont
          ? [{ provide: QUILL_FONT_REGISTRAR, useValue: extras.registerFont }]
          : []),
      ],
    });

    const fixture = TestBed.createComponent(LegalDocumentBoard);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('titleKey', 'nav.terms');
    fixture.componentRef.setInput('subtitleKey', 'legal.terms.subtitle');
    fixture.componentRef.setInput('contentTitleKey', 'legal.terms.contentTitle');
    fixture.componentRef.setInput('emptyTitleKey', 'legal.terms.emptyTitle');
    fixture.componentRef.setInput('emptyHintKey', 'legal.terms.emptyHint');
    fixture.componentRef.setInput('writeLabelKey', 'legal.terms.write');
    fixture.componentRef.setInput('placeholderKey', 'legal.terms.placeholder');
    fixture.detectChanges();
    await settle(fixture);
    return fixture;
  }

  const root = (fixture: ComponentFixture<LegalDocumentBoard>): HTMLElement =>
    fixture.nativeElement;

  const board = (fixture: ComponentFixture<LegalDocumentBoard>): LegalDocumentBoard =>
    fixture.componentInstance;

  function enterEditWithoutQuill(fixture: ComponentFixture<LegalDocumentBoard>): void {
    const component = board(fixture);
    const doc = component.document();
    component.draftAr.set(doc?.content.ar ?? '');
    component.draftEn.set(doc?.content.en ?? '');
    component.mode.set('edit');
    fixture.detectChanges();
  }

  function fakeQuill(html = '<p>live</p>'): AppQuill {
    const rootEl = document.createElement('div');
    rootEl.innerHTML = html;
    const container = document.createElement('div');
    container.innerHTML = `
      <button type="button" class="ql-undo"></button>
      <button type="button" class="ql-redo"></button>
      <button type="button" class="ql-hr"></button>
    `;
    return {
      root: rootEl,
      focus: vi.fn(),
      getSelection: () => ({ index: 0, length: 0 }),
      getLength: () => 1,
      getSemanticHTML: () => html,
      clipboard: { dangerouslyPasteHTML: vi.fn() },
      setSelection: vi.fn(),
      history: { undo: vi.fn(), redo: vi.fn() },
      getModule: () => ({
        container,
        attach: vi.fn(),
        addHandler: vi.fn(),
      }),
    };
  }

  describe('loading', () => {
    it('starts in a loading state then shows the document', async () => {
      const pending = new Subject<LegalDocument>();
      const fixture = await render('terms', { get: () => pending.asObservable() });
      expect(board(fixture).state()).toBe('loading');
      expect(root(fixture).querySelector('app-state-view')).not.toBeNull();

      pending.next(termsDoc);
      pending.complete();
      await settle(fixture);

      expect(board(fixture).state()).toBe('ready');
      expect(root(fixture).textContent).toContain('شروط عربية');
    });

    it('shows an error state and recovers on retry', async () => {
      let fail = true;
      const fixture = await render('terms', {
        get: () => (fail ? throwError(() => new Error('boom')) : of(termsDoc)),
      });
      expect(board(fixture).state()).toBe('error');
      expect(root(fixture).textContent).toContain('تعذر تحميل المستند');

      fail = false;
      board(fixture).reload();
      await settle(fixture);

      expect(board(fixture).state()).toBe('ready');
      expect(root(fixture).textContent).toContain('شروط عربية');
    });

    it('ignores a stale response when kind changes', async () => {
      const pending: Subject<LegalDocument>[] = [];
      const fixture = await render('terms', {
        get: () => {
          const result = new Subject<LegalDocument>();
          pending.push(result);
          return result.asObservable();
        },
      });
      expect(pending).toHaveLength(1);

      fixture.componentRef.setInput('kind', 'privacy');
      fixture.detectChanges();
      await settle(fixture);
      expect(pending).toHaveLength(2);

      pending[1]?.next(privacyDoc);
      pending[1]?.complete();
      pending[0]?.next(termsDoc);
      pending[0]?.complete();
      await settle(fixture);

      expect(board(fixture).document()?.kind).toBe('privacy');
      expect(root(fixture).textContent).toContain('خصوصية عربية');
      expect(root(fixture).textContent).not.toContain('شروط عربية');
    });

    it('keeps the latest error when an older failure arrives late', async () => {
      const pending: Subject<LegalDocument>[] = [];
      const fixture = await render('terms', {
        get: () => {
          const result = new Subject<LegalDocument>();
          pending.push(result);
          return result.asObservable();
        },
      });

      fixture.componentRef.setInput('kind', 'privacy');
      fixture.detectChanges();
      await settle(fixture);

      pending[1]?.next(privacyDoc);
      pending[1]?.complete();
      pending[0]?.error(new Error('stale'));
      await settle(fixture);

      expect(board(fixture).state()).toBe('ready');
      expect(board(fixture).document()?.kind).toBe('privacy');
    });
  });

  describe('editing and locale drafts', () => {
    it('seeds independent Arabic and English drafts when entering edit mode', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      expect(board(fixture).draftAr()).toContain('شروط عربية');
      expect(board(fixture).draftEn()).toContain('English terms');
      expect(board(fixture).draftHtml()).toContain('شروط عربية');
    });

    it('preserves both drafts across repeated locale switches', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const component = board(fixture);

      component.setDraft('<p>AR-1</p>');
      component.setLocale('en');
      component.setDraft('<p>EN-1</p>');
      component.setLocale('ar');
      component.setDraft('<p>AR-2</p>');
      component.setLocale('en');
      component.setLocale('ar');

      expect(component.draftAr()).toBe('<p>AR-2</p>');
      expect(component.draftEn()).toBe('<p>EN-1</p>');
      expect(component.draftHtml()).toBe('<p>AR-2</p>');
    });

    it('ignores late editor writes while syncing locale', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const component = board(fixture);
      const quill = fakeQuill('<p>AR saved</p>');
      component.onEditorInit({ editor: quill });

      component.setDraft('<p>AR saved</p>');
      component.setLocale('en');

      component.setDraft('<p>AR leaked</p>');
      await settle(fixture);

      expect(component.draftAr()).toBe('<p>AR saved</p>');
      expect(component.draftEn()).toBe(termsDoc.content.en);
      expect(component.draftEn()).not.toContain('AR leaked');

      component.setDraft('<p>EN after sync</p>');
      expect(component.draftEn()).toBe('<p>EN after sync</p>');
      expect(component.draftAr()).toBe('<p>AR saved</p>');
    });

    it('does not mix drafts during rapid locale switching before Quill updates', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const component = board(fixture);
      const quill = fakeQuill('<p>AR-A</p>');
      component.onEditorInit({ editor: quill });

      component.setDraft('<p>AR-A</p>');
      component.setLocale('en');

      component.setLocale('ar');
      component.setLocale('en');
      await settle(fixture);

      expect(component.draftAr()).toBe('<p>AR-A</p>');
      expect(component.draftEn()).toBe(termsDoc.content.en);
      expect(component.draftEn()).not.toContain('AR-A');
      expect(component.locale()).toBe('en');
    });

    it('applies RTL/LTR on the Quill root when the locale changes', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const component = board(fixture);
      const quill = fakeQuill();
      component.onEditorInit({ editor: quill });
      expect(quill.root.getAttribute('dir')).toBe('rtl');

      component.setLocale('en');
      expect(quill.root.getAttribute('dir')).toBe('ltr');
    });

    it('cancels edit and discards unsaved changes in both languages', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const component = board(fixture);
      component.setDraft('<p>AR dirty</p>');
      component.setLocale('en');
      component.setDraft('<p>EN dirty</p>');
      component.cancelEdit();
      fixture.detectChanges();

      expect(component.mode()).toBe('view');
      expect(component.draftAr()).toBe('');
      expect(component.draftEn()).toBe('');

      expect(root(fixture).textContent).toContain('English terms');
      expect(root(fixture).textContent).not.toContain('AR dirty');
      expect(root(fixture).textContent).not.toContain('EN dirty');
    });

    it('saves both language drafts while English is selected', async () => {
      const save = vi.fn(
        (kind: LegalDocumentKind, draft: { content: { ar: string; en: string } }) =>
          of({
            kind,
            content: draft.content,
            updatedAt: '2026-10-26',
          }),
      );
      const fixture = await render('terms', { save });
      enterEditWithoutQuill(fixture);
      const component = board(fixture);

      component.setDraft('<p>AR final</p>');
      component.setLocale('en');
      component.setDraft('<p>EN final</p>');
      component.save();
      await settle(fixture);

      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0]?.[0]).toBe('terms');
      expect(save.mock.calls[0]?.[1]).toEqual({
        content: { ar: '<p>AR final</p>', en: '<p>EN final</p>' },
      });
      expect(component.mode()).toBe('view');
      expect(component.locale()).toBe('en');
      expect(root(fixture).textContent).toContain('EN final');
    });

    it('does not start a second save while saving is true', async () => {
      const pending = new Subject<LegalDocument>();
      const save = vi.fn(() => pending.asObservable());
      const fixture = await render('terms', { save });
      enterEditWithoutQuill(fixture);

      board(fixture).save();
      board(fixture).save();
      expect(save).toHaveBeenCalledTimes(1);
      expect(board(fixture).saving()).toBe(true);

      pending.next({
        kind: 'terms',
        content: { ar: '<p>a</p>', en: '<p>b</p>' },
        updatedAt: '2026-10-26',
      });
      pending.complete();
      await settle(fixture);
      expect(board(fixture).saving()).toBe(false);
    });

    it('restores saving state and shows a toast when save fails', async () => {
      const fixture = await render('terms', {
        save: () => throwError(() => new Error('save-failed')),
      });
      const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
      enterEditWithoutQuill(fixture);
      board(fixture).save();
      await settle(fixture);

      expect(board(fixture).saving()).toBe(false);
      expect(board(fixture).mode()).toBe('edit');
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('opens an empty draft when the document has no content', async () => {
      const empty: LegalDocument = {
        kind: 'terms',
        content: { ar: '', en: '' },
        updatedAt: '2026-10-09',
      };
      const fixture = await render('terms', { get: () => of(empty) });
      expect(board(fixture).hasContent()).toBe(false);
      expect(root(fixture).querySelector('.legal-doc__empty')).not.toBeNull();

      enterEditWithoutQuill(fixture);
      expect(board(fixture).draftAr()).toBe('');
      expect(board(fixture).draftEn()).toBe('');
      expect(board(fixture).mode()).toBe('edit');
    });
  });

  describe('HTML security', () => {
    it('does not render executable markup from document HTML', async () => {
      const unsafe: LegalDocument = {
        kind: 'terms',
        content: {
          ar: '<p>آمن</p><script>window.__legalXss=1</script><img src=x onerror="window.__legalXss=1">',
          en: '<p>Safe</p>',
        },
        updatedAt: '2026-10-09',
      };
      const fixture = await render('terms', { get: () => of(unsafe) });
      const html = root(fixture).querySelector('.legal-doc__text')?.innerHTML ?? '';

      expect(root(fixture).textContent).toContain('آمن');
      expect(html.toLowerCase()).not.toContain('<script');
      expect(html.toLowerCase()).not.toContain('onerror');
      expect((window as Window & { __legalXss?: number }).__legalXss).toBeUndefined();
    });

    it('preserves Quill text color in view mode', async () => {
      const colored: LegalDocument = {
        kind: 'terms',
        content: {
          ar: '<p><span style="color:rgb(240,102,102);">نص أحمر</span></p>',
          en: '<p>Safe</p>',
        },
        updatedAt: '2026-10-09',
      };
      const fixture = await render('terms', { get: () => of(colored) });
      const span = root(fixture).querySelector('.legal-doc__text span');
      expect(span?.textContent).toContain('نص أحمر');
      expect(span?.getAttribute('style') ?? '').toMatch(/color:\s*rgb\(240,\s*102,\s*102\)/i);
    });

    it('keeps legitimate legal formatting tags', async () => {
      const fixture = await render();
      const text = root(fixture).querySelector('.legal-doc__text');
      expect(text?.querySelector('h3')?.textContent).toContain('شروط عربية');
      expect(text?.querySelector('p')?.textContent).toContain('نص عربي');
    });
  });

  describe('Quill toolbar wiring', () => {
    it('wires toolbar handlers only once for the same editor instance', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const addHandler = vi.fn();
      const quill = fakeQuill();
      quill.getModule = () => ({ addHandler });

      board(fixture).onEditorInit({ editor: quill });
      board(fixture).onEditorInit({ editor: quill });

      expect(addHandler).toHaveBeenCalledTimes(4);
      expect(addHandler).toHaveBeenCalledWith('undo', expect.any(Function));
      expect(addHandler).toHaveBeenCalledWith('redo', expect.any(Function));
      expect(addHandler).toHaveBeenCalledWith('hr', expect.any(Function));
      expect(addHandler).toHaveBeenCalledWith('image', expect.any(Function));
    });

    it('still wires handlers for a newly created editor instance', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const first = fakeQuill();
      const second = fakeQuill();
      const firstAdd = vi.fn();
      const secondAdd = vi.fn();
      first.getModule = () => ({ addHandler: firstAdd });
      second.getModule = () => ({ addHandler: secondAdd });

      board(fixture).onEditorInit({ editor: first });
      board(fixture).onEditorInit({ editor: second });

      expect(firstAdd).toHaveBeenCalledTimes(4);
      expect(secondAdd).toHaveBeenCalledTimes(4);
    });

    it('uploads editor images through MediaService when the image handler runs', async () => {
      const fixture = await render();
      enterEditWithoutQuill(fixture);
      const handlers = new Map<string, () => void>();
      const insertEmbed = vi.fn();
      const quill = fakeQuill();
      quill.insertEmbed = insertEmbed;
      quill.getModule = () => ({
        addHandler: (name: string, handler: () => void) => {
          handlers.set(name, handler);
        },
      });

      const file = new File(['x'], 'inline.png', { type: 'image/png' });
      const originalCreate = document.createElement.bind(document);
      const input = originalCreate('input') as HTMLInputElement;
      vi.spyOn(input, 'click').mockImplementation(() => {
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        input.dispatchEvent(new Event('change'));
      });
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
        tag === 'input' ? input : originalCreate(tag),
      );

      board(fixture).onEditorInit({ editor: quill });
      handlers.get('image')?.();
      await settle(fixture);

      expect(uploadEditorImage).toHaveBeenCalledWith(file);
      expect(insertEmbed).toHaveBeenCalledWith(0, 'image', 'https://cdn.test/inline.png');
    });

    it('stays in view mode when font registration fails', async () => {
      const fixture = await render(
        'terms',
        {},
        {
          registerFont: async () => ({ status: 'failed', error: new Error('no-quill') }),
        },
      );
      const toast = vi.spyOn(TestBed.inject(MessageService), 'add');

      board(fixture).startEdit();
      await settle(fixture);

      expect(board(fixture).mode()).toBe('view');
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('enters edit mode after successful font registration', async () => {
      const fixture = await render(
        'terms',
        {},
        { registerFont: async () => ({ status: 'ready' }) },
      );

      board(fixture).startEdit();
      await settle(fixture);

      expect(board(fixture).mode()).toBe('edit');
      expect(board(fixture).draftAr()).toContain('شروط عربية');
      expect(board(fixture).draftEn()).toContain('English terms');
    });
  });
});
