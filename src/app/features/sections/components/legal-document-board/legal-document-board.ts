import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { MessageService, SharedModule } from 'primeng/api';
import { Editor } from 'primeng/editor';
import type { EditorInitEvent } from 'primeng/types/editor';
import { Subject, catchError, firstValueFrom, map, merge, of, switchMap } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/language';
import { MediaService } from '../../../../core/media/media.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import {
  QUILL_FONT_REGISTRAR,
  applyQuillDirection,
  hasVisibleHtml,
  readQuillHtml,
  wireQuillToolbarHandlers,
  type AppQuill,
} from '../../../../shared/editor/quill';
import { sanitizeRichTextHtml } from '../../../../shared/editor/sanitize-html';
import type { LegalDocument, LegalDocumentKind } from '../../models/legal-document.model';
import { LegalDocumentService } from '../../services/legal-document.service';

type LoadState = 'loading' | 'ready' | 'error';
type Mode = 'view' | 'edit';

@Component({
  selector: 'app-legal-document-board',
  imports: [
    FormsModule,
    AppButton,
    Editor,
    LocaleSwitch,
    PageHeader,
    SharedModule,
    StateView,
    HasPermissionDirective,
  ],
  templateUrl: './legal-document-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDocumentBoard {
  private readonly api = inject(LegalDocumentService);
  private readonly media = inject(MediaService);
  private readonly messages = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly registerQuillFont = inject(QUILL_FONT_REGISTRAR);
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

  private syncingEditor = false;
  private quill: AppQuill | null = null;
  private readonly reload$ = new Subject<void>();

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
    return hasVisibleHtml(doc.content.ar) || hasVisibleHtml(doc.content.en);
  });

  /**
   * View-mode HTML. Quill stores text color as inline `style`; Angular's default
   * sanitizer would strip that and show black text. We allowlist-sanitize first
   * (scripts / handlers / unsafe CSS out, color styles kept), then mark SafeHtml.
   * View falls back to the other locale only when the selected one is empty.
   * Edit mode never uses this fallback — drafts stay independent.
   */
  readonly viewingHtml = computed<SafeHtml | null>(() => {
    const doc = this.document();
    if (!doc) {
      return null;
    }
    const selected = doc.content[this.locale()];
    const html = hasVisibleHtml(selected)
      ? selected
      : hasVisibleHtml(doc.content.ar)
        ? doc.content.ar
        : doc.content.en;
    if (!hasVisibleHtml(html)) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustHtml(sanitizeRichTextHtml(html));
  });

  readonly draftHtml = computed(() => (this.locale() === 'ar' ? this.draftAr() : this.draftEn()));

  constructor() {
    this.locale.set(this.lang.language());

    // switchMap cancels the previous get() so a slow response cannot overwrite

    toObservable(this.kind)
      .pipe(
        switchMap((kind) =>
          merge(of(undefined), this.reload$).pipe(
            switchMap(() => {
              this.state.set('loading');
              return this.api.get(kind).pipe(
                map((doc) => ({ ok: true as const, doc })),
                catchError(() => of({ ok: false as const, doc: null })),
              );
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (!result.ok) {
          this.state.set('error');
          return;
        }
        this.document.set(result.doc);
        this.state.set('ready');
        this.mode.set('view');
        this.draftAr.set('');
        this.draftEn.set('');
        this.quill = null;
        this.syncingEditor = false;
      });
  }

  setLocale(value: AppLanguage): void {
    if (value === this.locale()) {
      return;
    }

    if (this.mode() === 'edit') {
      this.flushQuillToActiveDraft();
    }

    const syncEditor = this.mode() === 'edit' && this.quill !== null;
    if (syncEditor) {

      this.syncingEditor = true;
    }

    this.locale.set(value);

    if (syncEditor) {
      this.applyQuillDirection();

      afterNextRender(
        () => {
          this.syncingEditor = false;
        },
        { injector: this.injector },
      );
    }
  }

  setDraft(value: string | undefined): void {
    if (this.syncingEditor) {
      return;
    }
    const next = value ?? '';
    if (this.locale() === 'ar') {
      this.draftAr.set(next);
    } else {
      this.draftEn.set(next);
    }
  }

  startEdit(): void {
    void this.registerQuillFont().then((result) => {
      if (result.status === 'failed') {
        this.messages.add({
          severity: 'error',
          summary: this.lang.t('common.error'),
        });
        return;
      }
      const doc = this.document();
      this.draftAr.set(doc?.content.ar ?? '');
      this.draftEn.set(doc?.content.en ?? '');
      this.mode.set('edit');
    });
  }

  onEditorInit(event: EditorInitEvent): void {
    const quill = event.editor as AppQuill;
    this.quill = quill;
    wireQuillToolbarHandlers(quill, {
      uploadImage: (file) =>
        firstValueFrom(this.media.uploadEditorImage(file)).then((uploaded) => uploaded.url),
      onImageUploadError: () => {
        this.messages.add({
          severity: 'error',
          summary: this.lang.t('common.error'),
        });
      },
    });
    this.applyQuillDirection();
  }

  cancelEdit(): void {
    this.mode.set('view');
    this.draftAr.set('');
    this.draftEn.set('');
    this.quill = null;
    this.syncingEditor = false;
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (this.mode() === 'edit') {
      this.flushQuillToActiveDraft();
    }
    this.saving.set(true);
    this.api
      .save(this.kind(), {
        content: {
          ar: this.draftAr(),
          en: this.draftEn(),
        },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.saving.set(false);
          this.document.set(doc);
          this.mode.set('view');
          this.draftAr.set('');
          this.draftEn.set('');
          this.quill = null;
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

  reload(): void {
    this.reload$.next();
  }

  private flushQuillToActiveDraft(): void {
    if (!this.quill || this.syncingEditor) {
      return;
    }
    const html = readQuillHtml(this.quill);
    if (this.locale() === 'ar') {
      this.draftAr.set(html);
    } else {
      this.draftEn.set(html);
    }
  }

  private applyQuillDirection(): void {
    if (!this.quill) {
      return;
    }
    applyQuillDirection(this.quill, this.locale());
  }
}
