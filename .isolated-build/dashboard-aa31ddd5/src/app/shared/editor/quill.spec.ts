import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  QUILL_FONT,
  applyQuillDirection,
  ensureQuillFontRegistered,
  hasVisibleHtml,
  readQuillHtml,
  resetQuillFontRegistrationForTests,
  wireQuillToolbarHandlers,
  type AppQuill,
} from './quill';

function fakeQuill(overrides: Partial<AppQuill> = {}): AppQuill {
  const handlers = new Map<string, () => void>();
  const root = document.createElement('div');
  root.innerHTML = '<p>hello</p>';
  const container = document.createElement('div');
  container.innerHTML = `
    <button type="button" class="ql-undo"></button>
    <button type="button" class="ql-redo"></button>
    <button type="button" class="ql-hr"></button>
  `;
  const attach = vi.fn();
  return {
    root,
    focus: vi.fn(),
    getSelection: () => ({ index: 2, length: 0 }),
    getLength: () => 10,
    getSemanticHTML: () => '<p>semantic</p>',
    clipboard: { dangerouslyPasteHTML: vi.fn() },
    setSelection: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn() },
    getModule: () => ({
      container,
      attach,
      addHandler: (name: string, handler: () => void) => {
        handlers.set(name, handler);
      },
    }),
    ...overrides,
    ...({ __handlers: handlers, __attach: attach, __container: container } as object),
  } as AppQuill & {
    __handlers?: Map<string, () => void>;
    __attach?: ReturnType<typeof vi.fn>;
    __container?: HTMLElement;
  };
}

describe('shared quill helpers', () => {
  afterEach(() => {
    resetQuillFontRegistrationForTests();
    vi.restoreAllMocks();
  });

  it('detects visible text and ignores formatting-only markup', () => {
    expect(hasVisibleHtml('<p>نص</p>')).toBe(true);
    expect(hasVisibleHtml('<p><br></p>')).toBe(false);
    expect(hasVisibleHtml('   ')).toBe(false);
  });

  it('prefers getSemanticHTML when reading editor content', () => {
    const quill = fakeQuill();
    expect(readQuillHtml(quill)).toBe('<p>semantic</p>');
  });

  it('falls back to root.innerHTML when getSemanticHTML is missing', () => {
    const quill = fakeQuill({ getSemanticHTML: undefined });
    quill.root.innerHTML = '<h3>Fallback</h3>';
    expect(readQuillHtml(quill)).toBe('<h3>Fallback</h3>');
  });

  it('applies RTL or LTR on the editable root', () => {
    const quill = fakeQuill();
    applyQuillDirection(quill, 'ar');
    expect(quill.root.getAttribute('dir')).toBe('rtl');
    expect(quill.root.style.direction).toBe('rtl');

    applyQuillDirection(quill, 'en');
    expect(quill.root.getAttribute('dir')).toBe('ltr');
    expect(quill.root.style.direction).toBe('ltr');
  });

  it('registers undo, redo, and hr once per Quill instance', () => {
    const quill = fakeQuill() as AppQuill & {
      __handlers: Map<string, () => void>;
      __attach: ReturnType<typeof vi.fn>;
      __container: HTMLElement;
    };
    expect(wireQuillToolbarHandlers(quill)).toBe(true);
    expect(wireQuillToolbarHandlers(quill)).toBe(false);

    expect(quill.__handlers.has('undo')).toBe(true);
    expect(quill.__handlers.has('redo')).toBe(true);
    expect(quill.__handlers.has('hr')).toBe(true);
    expect(quill.__attach).toHaveBeenCalledTimes(3);
    expect(quill.__attach).toHaveBeenCalledWith(quill.__container.querySelector('.ql-undo'));
    expect(quill.__attach).toHaveBeenCalledWith(quill.__container.querySelector('.ql-redo'));
    expect(quill.__attach).toHaveBeenCalledWith(quill.__container.querySelector('.ql-hr'));

    quill.__handlers.get('undo')?.();
    quill.__handlers.get('redo')?.();
    expect(quill.history.undo).toHaveBeenCalledTimes(1);
    expect(quill.history.redo).toHaveBeenCalledTimes(1);

    quill.__handlers.get('hr')?.();
    expect(quill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(2, '<hr>');
    expect(quill.setSelection).toHaveBeenCalledWith(3);
  });

  it('falls back to click listeners when toolbar.attach is unavailable', () => {
    const handlers = new Map<string, () => void>();
    const container = document.createElement('div');
    container.innerHTML = `
      <button type="button" class="ql-undo"></button>
      <button type="button" class="ql-redo"></button>
      <button type="button" class="ql-hr"></button>
    `;
    const quill = fakeQuill({
      getModule: () => ({
        container,
        addHandler: (name: string, handler: () => void) => {
          handlers.set(name, handler);
        },
      }),
    });

    expect(wireQuillToolbarHandlers(quill)).toBe(true);
    container.querySelector<HTMLButtonElement>('.ql-undo')?.click();
    container.querySelector<HTMLButtonElement>('.ql-redo')?.click();
    expect(quill.history.undo).toHaveBeenCalledTimes(1);
    expect(quill.history.redo).toHaveBeenCalledTimes(1);
  });

  it('wires a second Quill instance independently of the first', () => {
    const first = fakeQuill();
    const second = fakeQuill();
    expect(wireQuillToolbarHandlers(first)).toBe(true);
    expect(wireQuillToolbarHandlers(second)).toBe(true);
    expect(wireQuillToolbarHandlers(first)).toBe(false);
    expect(wireQuillToolbarHandlers(second)).toBe(false);
  });

  it('inserts hr at the end when there is no selection', () => {
    const quill = fakeQuill({
      getSelection: () => null,
      getLength: () => 5,
    }) as AppQuill & { __handlers: Map<string, () => void> };

    wireQuillToolbarHandlers(quill);
    quill.__handlers.get('hr')?.();
    expect(quill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(4, '<hr>');
  });

  it('wires an image upload handler that embeds the returned URL', async () => {
    const insertEmbed = vi.fn();
    const quill = fakeQuill({ insertEmbed }) as AppQuill & {
      __handlers: Map<string, () => void>;
    };
    const uploadImage = vi.fn(async () => 'https://cdn.test/photo.png');
    const file = new File(['x'], 'photo.png', { type: 'image/png' });

    const originalCreate = document.createElement.bind(document);
    const input = originalCreate('input') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'input' ? input : originalCreate(tag),
    );

    wireQuillToolbarHandlers(quill, { uploadImage });
    quill.__handlers.get('image')?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(click).toHaveBeenCalled();
    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://cdn.test/photo.png');
    expect(quill.setSelection).toHaveBeenCalledWith(3);
  });

  it('reports image upload failures without inserting markup', async () => {
    const insertEmbed = vi.fn();
    const onImageUploadError = vi.fn();
    const quill = fakeQuill({ insertEmbed }) as AppQuill & {
      __handlers: Map<string, () => void>;
    };
    const file = new File(['x'], 'bad.png', { type: 'image/png' });
    const originalCreate = document.createElement.bind(document);
    const input = originalCreate('input') as HTMLInputElement;
    vi.spyOn(input, 'click').mockImplementation(() => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
    });
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'input' ? input : originalCreate(tag),
    );

    wireQuillToolbarHandlers(quill, {
      uploadImage: async () => {
        throw new Error('upload-failed');
      },
      onImageUploadError,
    });
    quill.__handlers.get('image')?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(onImageUploadError).toHaveBeenCalled();
    expect(insertEmbed).not.toHaveBeenCalled();
  });

  it('caches Quill font registration and exposes the whitelist token', async () => {
    expect(QUILL_FONT).toBe('thmanyah-sans');
    const first = ensureQuillFontRegistered();
    const second = ensureQuillFontRegistered();
    expect(first).toBe(second);
    const result = await first;
    expect(['ready', 'failed']).toContain(result.status);
  });
});
