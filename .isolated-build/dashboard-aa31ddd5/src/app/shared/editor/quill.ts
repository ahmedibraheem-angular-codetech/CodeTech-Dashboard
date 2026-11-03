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
}

export type QuillImageUploader = (file: File) => Promise<string>;

export interface QuillToolbarModule {
  container?: HTMLElement | null;
  addHandler: (name: string, handler: () => void) => void;
  attach?: (input: HTMLElement) => void;
}

interface QuillConstructor {
  import: (path: string) => { whitelist?: string[] };
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
        return { status: 'ready' as const };
      })
      .catch((error: unknown): QuillFontRegistration => ({ status: 'failed', error }));
  }
  return fontRegistration;
}

export function resetQuillFontRegistrationForTests(): void {
  fontRegistration = null;
}

export function readQuillHtml(quill: AppQuill): string {
  if (typeof quill.getSemanticHTML === 'function') {
    return quill.getSemanticHTML();
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

  if (options.uploadImage) {
    toolbar.addHandler('image', () => {
      pickAndUploadImage(quill, options.uploadImage!, options.onImageUploadError);
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

  // Prefer Quill's attach now that the handler exists in toolbar.handlers.
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

/** Apply RTL/LTR on the editable root (not only the surrounding shell). */
export function applyQuillDirection(quill: AppQuill, locale: 'ar' | 'en'): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  quill.root.setAttribute('dir', dir);
  quill.root.style.direction = dir;
}

/** True when HTML contains visible text after stripping tags. */
export function hasVisibleHtml(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').trim().length > 0;
}
