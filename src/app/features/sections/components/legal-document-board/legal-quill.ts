import { InjectionToken } from '@angular/core';

/**
 * Quill helpers for the legal document editor. Kept outside the component so
 * font registration and toolbar wiring can be unit-tested without the board.
 */

export const LEGAL_QUILL_FONT = 'thmanyah-sans';

export type QuillFontRegistration =
  | { readonly status: 'ready' }
  | { readonly status: 'failed'; readonly error: unknown };

/** Injectable hook so tests can simulate font-registration failure without mocking Quill. */
export const LEGAL_QUILL_FONT_REGISTRAR = new InjectionToken<() => Promise<QuillFontRegistration>>(
  'LEGAL_QUILL_FONT_REGISTRAR',
  { factory: () => ensureQuillFontRegistered },
);

/** Minimal Quill surface used by the legal toolbar and draft sync. */
export interface LegalQuill {
  root: HTMLElement;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  getLength: () => number;
  getSemanticHTML?: () => string;
  clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
  setSelection: (index: number, length?: number) => void;
  history: { undo: () => void; redo: () => void };
  getModule: (name: string) => { addHandler: (name: string, handler: () => void) => void };
}

type QuillConstructor = {
  import: (path: string) => { whitelist?: string[] };
  register: (target: unknown, overwrite?: boolean) => void;
};

let fontRegistration: Promise<QuillFontRegistration> | null = null;
const wiredEditors = new WeakSet<object>();

/** Register the Thmanyah Sans class font once for all editor instances. */
export function ensureQuillFontRegistered(): Promise<QuillFontRegistration> {
  if (!fontRegistration) {
    fontRegistration = import('quill')
      .then((mod) => {
        const Quill = mod.default as QuillConstructor;
        const Font = Quill.import('attributors/class/font');
        Font.whitelist = [LEGAL_QUILL_FONT];
        Quill.register(Font, true);
        return { status: 'ready' as const };
      })
      .catch((error: unknown): QuillFontRegistration => ({ status: 'failed', error }));
  }
  return fontRegistration;
}

/** Test-only: clear the module-level font registration promise. */
export function resetQuillFontRegistrationForTests(): void {
  fontRegistration = null;
}

/** Read the current HTML from a Quill instance without inventing a sanitizer. */
export function readQuillHtml(quill: LegalQuill): string {
  if (typeof quill.getSemanticHTML === 'function') {
    return quill.getSemanticHTML();
  }
  return quill.root.innerHTML;
}

/**
 * Wire undo / redo / hr once per Quill instance. Returns false when the
 * instance was already wired so callers can skip duplicate work.
 */
export function wireLegalToolbarHandlers(quill: LegalQuill): boolean {
  if (wiredEditors.has(quill)) {
    return false;
  }
  wiredEditors.add(quill);

  const toolbar = quill.getModule('toolbar');
  toolbar.addHandler('undo', () => quill.history.undo());
  toolbar.addHandler('redo', () => quill.history.redo());
  toolbar.addHandler('hr', () => {
    const range = quill.getSelection(true) ?? { index: Math.max(quill.getLength() - 1, 0), length: 0 };
    // Quill 2 defaults this helper to sources.API. With History.userOnly=false
    // (Quill default), API edits are still recorded, so undo/redo remain valid.
    quill.clipboard.dangerouslyPasteHTML(range.index, '<hr>');
    quill.setSelection(range.index + 1);
  });
  return true;
}

/** Apply RTL/LTR on the editable root (not only the surrounding shell). */
export function applyQuillDirection(quill: LegalQuill, locale: 'ar' | 'en'): void {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  quill.root.setAttribute('dir', dir);
  quill.root.style.direction = dir;
}

/** True when HTML contains visible text after stripping tags. */
export function hasVisibleHtml(value: string): boolean {
  return value.replace(/<[^>]*>/g, '').trim().length > 0;
}
