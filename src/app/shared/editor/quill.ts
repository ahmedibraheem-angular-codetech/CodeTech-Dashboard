import { InjectionToken } from '@angular/core';

export const QUILL_FONT = 'thmanyah-sans';

export type QuillFontRegistration =
  { readonly status: 'ready' } | { readonly status: 'failed'; readonly error: unknown };

export const QUILL_FONT_REGISTRAR = new InjectionToken<() => Promise<QuillFontRegistration>>(
  'QUILL_FONT_REGISTRAR',
  { factory: () => ensureQuillFontRegistered },
);

export interface AppQuill {
  root: HTMLElement;
  focus?: () => void;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  getLength: () => number;
  getSemanticHTML?: () => string;
  insertEmbed?: (index: number, type: string, value: unknown) => void;
  clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
  setSelection: (index: number, length?: number) => void;
  history: { undo: () => void; redo: () => void };
  getModule: (name: string) => QuillToolbarModule;
  on?: (
    event: 'text-change',
    handler: (delta: unknown, old: unknown, source: string) => void,
  ) => void;
}

export type QuillImageUploader = (file: File) => Promise<string>;

export interface QuillToolbarModule {
  container?: HTMLElement | null;
  addHandler: (name: string, handler: () => void) => void;
  attach?: (input: HTMLElement) => void;
}

interface QuillConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Quill blots are untyped classes
  import: (path: string) => any;
  register: (target: unknown, overwrite?: boolean) => void;
}

let fontRegistration: Promise<QuillFontRegistration> | null = null;
const wiredEditors = new WeakSet<object>();

export function ensureQuillFontRegistered(): Promise<QuillFontRegistration> {
  if (!fontRegistration) {
    fontRegistration = import('quill')
      .then((mod) => {
        const Quill = mod.default as QuillConstructor;
        const Font = Quill.import('attributors/class/font');
        Font.whitelist = [QUILL_FONT];
        Quill.register(Font, true);
        registerStyleAlign(Quill);
        registerDividerBlot(Quill);
        registerPlainLinkBlot(Quill);
        return { status: 'ready' as const };
      })
      .catch((error: unknown): QuillFontRegistration => ({ status: 'failed', error }));
  }
  return fontRegistration;
}

/**
 * The API keeps style="text-align:..." on paragraphs but strips class attributes,
 * so alignment must be stored as an inline style instead of Quill's ql-align-* class.
 */
function registerStyleAlign(Quill: QuillConstructor): void {
  Quill.register(Quill.import('attributors/style/align'), true);
}

/**
 * Quill drops unknown block elements on load. Without a blot for <hr> every
 * stored divider disappeared the first time a document was edited and saved.
 */
function registerDividerBlot(Quill: QuillConstructor): void {
  const BlockEmbed = Quill.import('blots/block/embed');
  class Divider extends BlockEmbed {
    static blotName = 'divider';
    static tagName = 'hr';
  }
  Quill.register(Divider, true);
}

/**
 * Quill adds target="_blank" and rel to every link. For mailto: and tel:
 * links that rewrites the stored content on save, so keep them untouched.
 */
function registerPlainLinkBlot(Quill: QuillConstructor): void {
  const Link = Quill.import('formats/link');
  class AppLink extends Link {
    static create(value: string): HTMLElement {
      const node = super.create(value) as HTMLElement;
      if (/^(mailto|tel):/i.test(String(value).trim())) {
        node.removeAttribute('target');
        node.removeAttribute('rel');
      }
      return node;
    }
  }
  Quill.register(AppLink, true);
}

export function resetQuillFontRegistrationForTests(): void {
  fontRegistration = null;
}

export function readQuillHtml(quill: AppQuill): string {
  if (typeof quill.getSemanticHTML === 'function') {
    return restoreBreakableSpaces(quill.getSemanticHTML());
  }
  return quill.root.innerHTML;
}

export interface WireQuillToolbarOptions {
  uploadImage?: QuillImageUploader;

  onImageUploadError?: (error: unknown) => void;
}

export function wireQuillToolbarHandlers(
  quill: AppQuill,
  options: WireQuillToolbarOptions = {},
): boolean {
  if (wiredEditors.has(quill)) {
    return false;
  }
  wiredEditors.add(quill);

  const toolbar = quill.getModule('toolbar');
  const undo = (): void => {
    quill.focus?.();
    quill.history.undo();
  };
  const redo = (): void => {
    quill.focus?.();
    quill.history.redo();
  };
  const insertHr = (): void => {
    quill.focus?.();
    const range = quill.getSelection(true) ?? {
      index: Math.max(quill.getLength() - 1, 0),
      length: 0,
    };

    quill.clipboard.dangerouslyPasteHTML(range.index, '<hr>');
    quill.setSelection(range.index + 1);
  };

  toolbar.addHandler('undo', undo);
  toolbar.addHandler('redo', redo);
  toolbar.addHandler('hr', insertHr);

  const uploadImage = options.uploadImage;
  if (uploadImage) {
    toolbar.addHandler('image', () => {
      pickAndUploadImage(quill, uploadImage, options.onImageUploadError);
    });
  }

  bindCustomToolbarControl(toolbar, 'undo', undo);
  bindCustomToolbarControl(toolbar, 'redo', redo);
  bindCustomToolbarControl(toolbar, 'hr', insertHr);
  return true;
}

function pickAndUploadImage(
  quill: AppQuill,
  upload: QuillImageUploader,
  onError?: (error: unknown) => void,
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    void upload(file)
      .then((url) => {
        quill.focus?.();
        const range = quill.getSelection(true) ?? {
          index: Math.max(quill.getLength() - 1, 0),
          length: 0,
        };
        if (typeof quill.insertEmbed === 'function') {
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
          return;
        }
        quill.clipboard.dangerouslyPasteHTML(
          range.index,
          `<img src="${url.replace(/"/g, '&quot;')}">`,
        );
        quill.setSelection(range.index + 1);
      })
      .catch((error: unknown) => {
        onError?.(error);
      });
  });
  input.click();
}

function bindCustomToolbarControl(
  toolbar: QuillToolbarModule,
  format: 'undo' | 'redo' | 'hr',
  action: () => void,
): void {
  const button = toolbar.container?.querySelector<HTMLElement>(`.ql-${format}`);
  if (!button) {
    return;
  }

  if (typeof toolbar.attach === 'function') {
    toolbar.attach(button);
    return;
  }

  if (button.dataset['quillBound'] === '1') {
    return;
  }
  button.dataset['quillBound'] = '1';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    action();
  });
}

export function applyQuillDirection(quill: AppQuill, locale: 'ar' | 'en'): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  quill.root.setAttribute('dir', dir);
  quill.root.style.direction = dir;
}

export function hasVisibleHtml(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').trim().length > 0;
}

export function restoreBreakableSpaces(html: string): string {
  const blockStart = /(?:^|<(?:p|h[1-6]|li|blockquote|pre|div)(?:\s[^>]*)?>|<br\s*\/?>)$/i;
  const blockEnd = /^(?:$|<\/(?:p|h[1-6]|li|blockquote|pre|div)>|<br\s*\/?>)/i;
  return html.replace(/(?:&nbsp;)+/g, (run, offset: number) => {
    const before = html.slice(0, offset);
    const after = html.slice(offset + run.length);
    if (blockStart.test(before) || blockEnd.test(after)) {
      return run;
    }
    const count = run.length / '&nbsp;'.length;
    let out = '';
    for (let i = 0; i < count; i += 1) {
      out += i % 2 === 0 ? ' ' : '&nbsp;';
    }
    return out;
  });
}
