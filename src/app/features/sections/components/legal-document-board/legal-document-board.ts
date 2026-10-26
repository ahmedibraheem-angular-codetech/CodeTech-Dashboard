import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { MessageService, SharedModule } from 'primeng/api';
import { Editor } from 'primeng/editor';
import type { EditorInitEvent } from 'primeng/types/editor';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import type { LegalDocument, LegalDocumentKind } from '../../models/legal-document.model';
import { LegalDocumentService } from '../../services/legal-document.service';

type LoadState = 'loading' | 'ready' | 'error';
type Mode = 'view' | 'edit';

/**
 * Shared board for Terms and Privacy. Same layout for both; copy and document
 * kind come from the parent route via inputs.
 */
@Component({
  selector: 'app-legal-document-board',
  imports: [FormsModule, AppButton, Editor, LocaleSwitch, PageHeader, SharedModule, StateView],
  templateUrl: './legal-document-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDocumentBoard {
  private readonly api = inject(LegalDocumentService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  readonly lang = inject(LanguageService);

  readonly kind = input.required<LegalDocumentKind>();
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input.required<string>();
  readonly contentTitleKey = input.required<string>();
  readonly emptyTitleKey = input.required<string>();
  readonly emptyHintKey = input.required<string>();
  readonly writeLabelKey = input.required<string>();
  readonly placeholderKey = input.required<string>();

  readonly state = signal<LoadState>('loading');
  readonly mode = signal<Mode>('view');
  readonly saving = signal(false);
  readonly document = signal<LegalDocument | null>(null);
  readonly locale = signal<AppLanguage>('ar');
  readonly draftAr = signal('');
  readonly draftEn = signal('');

  readonly pageTitle = computed(() => {
    this.lang.language();
    return this.lang.t(this.titleKey());
  });

  readonly pageSubtitle = computed(() => {
    this.lang.language();
    return this.lang.t(this.subtitleKey());
  });

  readonly contentTitle = computed(() => {
    this.lang.language();
    return this.lang.t(this.contentTitleKey());
  });

  readonly emptyTitle = computed(() => {
    this.lang.language();
    return this.lang.t(this.emptyTitleKey());
  });

  readonly emptyHint = computed(() => {
    this.lang.language();
    return this.lang.t(this.emptyHintKey());
  });

  readonly writeLabel = computed(() => {
    this.lang.language();
    return this.lang.t(this.writeLabelKey());
  });

  readonly placeholder = computed(() => {
    this.lang.language();
    return this.lang.t(this.placeholderKey());
  });

  readonly hasContent = computed(() => {
    const doc = this.document();
    if (!doc) {
      return false;
    }
    return this.hasHtml(doc.content.ar) || this.hasHtml(doc.content.en);
  });

  readonly viewingHtml = computed<SafeHtml | null>(() => {
    const doc = this.document();
    if (!doc) {
      return null;
    }
    const html = doc.content[this.locale()] || doc.content.ar || doc.content.en;
    if (!this.hasHtml(html)) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly draftHtml = computed(() => (this.locale() === 'ar' ? this.draftAr() : this.draftEn()));

  constructor() {
    this.locale.set(this.lang.language());
    effect(() => {
      const kind = this.kind();
      untracked(() => this.load(kind));
    });
  }

  protected setLocale(value: AppLanguage): void {
    this.locale.set(value);
  }

  protected setDraft(value: string | undefined): void {
    const next = value ?? '';
    if (this.locale() === 'ar') {
      this.draftAr.set(next);
    } else {
      this.draftEn.set(next);
    }
  }

  protected startEdit(): void {
    void this.registerQuillFont().then(() => {
      const doc = this.document();
      this.draftAr.set(doc?.content.ar ?? '');
      this.draftEn.set(doc?.content.en ?? '');
      this.mode.set('edit');
    });
  }

  protected onEditorInit(event: EditorInitEvent): void {
    const quill = event.editor as {
      getSelection: (focus?: boolean) => { index: number } | null;
      clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
      setSelection: (index: number) => void;
      history: { undo: () => void; redo: () => void };
      getModule: (name: string) => { addHandler: (name: string, handler: () => void) => void };
    };
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('undo', () => quill.history.undo());
    toolbar.addHandler('redo', () => quill.history.redo());
    toolbar.addHandler('hr', () => {
      const range = quill.getSelection(true);
      if (!range) {
        return;
      }
      quill.clipboard.dangerouslyPasteHTML(range.index, '<hr>');
      quill.setSelection(range.index + 1);
    });
  }

  protected cancelEdit(): void {
    this.mode.set('view');
    this.draftAr.set('');
    this.draftEn.set('');
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.api
      .save(this.kind(), {
        content: {
          ar: this.draftAr().trim(),
          en: this.draftEn().trim(),
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.saving.set(false);
          this.document.set(doc);
          this.mode.set('view');
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('legal.saved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected reload(): void {
    this.load(this.kind());
  }

  private load(kind: LegalDocumentKind): void {
    this.state.set('loading');
    this.api
      .get(kind)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.document.set(doc);
          this.state.set('ready');
          this.mode.set('view');
        },
        error: () => this.state.set('error'),
      });
  }

  private hasHtml(value: string): boolean {
    return value.replace(/<[^>]*>/g, '').trim().length > 0;
  }

  private registerQuillFont(): Promise<void> {
    if (quillFontReady) {
      return quillFontReady;
    }
    quillFontReady = import('quill')
      .then((mod) => {
        const Quill = mod.default as {
          import: (path: string) => { whitelist?: string[] };
          register: (target: unknown, overwrite?: boolean) => void;
        };
        const Font = Quill.import('attributors/class/font');
        Font.whitelist = ['thmanyah-sans'];
        Quill.register(Font, true);
      })
      .catch(() => undefined)
      .then(() => undefined);
    return quillFontReady;
  }
}

let quillFontReady: Promise<void> | null = null;
