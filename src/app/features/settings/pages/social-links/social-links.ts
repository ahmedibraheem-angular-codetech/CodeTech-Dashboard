import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { startWith } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { formatIsoDate } from '../../../../shared/utils/date';
import { SocialLinkCard } from '../../components/social-link-card/social-link-card';
import { SocialLinkEditor } from '../../components/social-link-editor/social-link-editor';
import type {
  SocialChannel,
  SocialChannelDraft,
  SocialLinksDocument,
  SocialPlatformId,
} from '../../models/social-links.model';
import { emptyLocaleText, readLocale } from '../../models/social-links.model';
import { SocialLinksService } from '../../services/social-links.service';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-social-links-page',
  imports: [
    ReactiveFormsModule,
    PageHeader,
    AppButton,
    LocaleSwitch,
    StateView,
    IconField,
    InputIcon,
    InputText,
    Textarea,
    SocialLinkCard,
    SocialLinkEditor,
    ConfirmDialog,
  ],
  templateUrl: './social-links.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinksPage {
  private readonly api = inject(SocialLinksService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  readonly lang = inject(LanguageService);

  private readonly editor = viewChild.required(SocialLinkEditor);
  private readonly confirm = viewChild.required(ConfirmDialog);

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly editorSaving = signal(false);
  readonly locale = signal<AppLanguage>('ar');
  readonly document = signal<SocialLinksDocument | null>(null);
  private readonly baseline = signal<SocialLinksDocument | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly editorPlatforms = signal<SocialPlatformId[]>([]);

  private readonly descriptionDraft = signal(emptyLocaleText());
  private readonly locationNameDraft = signal(emptyLocaleText());

  readonly form = this.fb.nonNullable.group({
    description: [''],
    phone: [''],
    email: [''],
    locationName: [''],
    mapUrl: [''],
  });

  private readonly locationQuery = toSignal(
    this.form.controls.locationName.valueChanges.pipe(
      startWith(this.form.controls.locationName.value),
    ),
    { initialValue: this.form.controls.locationName.value },
  );

  readonly updatedLabel = computed(() => {
    this.lang.language();
    const doc = this.document();
    if (!doc) {
      return '';
    }
    return this.lang
      .t('social.lastUpdated')
      .replace('{date}', formatIsoDate(doc.updatedAt, this.lang.language()));
  });

  readonly channels = computed(() => this.document()?.channels ?? []);

  /** Live Google Maps embed driven by the location name field. */
  readonly mapEmbedUrl = computed(() => {
    const query = this.locationQuery().trim() || 'Saudi Arabia';
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=6&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor() {
    this.locale.set(this.lang.language());
    this.reload();
  }

  protected reload(): void {
    this.state.set('loading');
    this.api
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.applyDocument(doc);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected setLocale(next: AppLanguage): void {
    this.flushLocaleFields();
    this.locale.set(next);
    this.form.patchValue({
      description: this.descriptionDraft()[next],
      locationName: this.locationNameDraft()[next],
    });
  }

  protected channelTitle(channel: SocialChannel): string {
    this.lang.language();
    return this.lang.t(`social.platform.${channel.platform}`);
  }

  protected channelUrl(channel: SocialChannel): string {
    return readLocale(channel.url, this.locale());
  }

  protected openAdd(): void {
    const platforms = this.api.availablePlatforms();
    if (platforms.length === 0) {
      this.messages.add({
        severity: 'warn',
        summary: this.lang.t('social.noPlatformsLeft'),
      });
      return;
    }
    this.editingId.set(null);
    this.editorPlatforms.set(platforms);
    this.editor().open(null, platforms);
  }

  protected openEdit(channel: SocialChannel): void {
    const platforms = [channel.platform, ...this.api.availablePlatforms(channel.id)];
    this.editingId.set(channel.id);
    this.editorPlatforms.set(platforms);
    this.editor().open(channel, platforms);
  }

  protected onEditorSaved(draft: SocialChannelDraft): void {
    this.editorSaving.set(true);
    this.api
      .upsertChannel(draft, this.editingId() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.editorSaving.set(false);
          this.applyDocument(doc);
          this.editor().visible.set(false);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('social.channelSaved'),
          });
        },
        error: () => {
          this.editorSaving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected async removeChannel(channel: SocialChannel): Promise<void> {
    const ok = await this.confirm().ask({
      title: this.lang.t('social.deleteChannel'),
      message: this.lang.t('social.deleteChannelMessage'),
      confirmLabel: this.lang.t('social.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.api
      .removeChannel(channel.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => {
          this.applyDocument(doc);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('social.channelDeleted'),
          });
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected setEnabled(channel: SocialChannel, enabled: boolean): void {
    this.api
      .setChannelEnabled(channel.id, enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doc) => this.applyDocument(doc),
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  protected onImagePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const doc = this.document();
    if (!doc) {
      return;
    }
    const url = URL.createObjectURL(file);
    this.document.set({
      ...doc,
      site: {
        ...doc.site,
        imageName: file.name,
        imageUrl: url,
      },
    });
  }

  protected cancel(): void {
    const saved = this.baseline();
    if (!saved) {
      return;
    }
    this.applyDocument(structuredClone(saved));
    this.messages.add({
      severity: 'info',
      summary: this.lang.t('social.changesDiscarded'),
    });
  }

  protected save(): void {
    const doc = this.document();
    if (!doc || this.saving()) {
      return;
    }
    this.flushLocaleFields();
    const raw = this.form.getRawValue();
    const next: SocialLinksDocument = {
      ...doc,
      site: {
        ...doc.site,
        description: { ...this.descriptionDraft() },
        phone: raw.phone.trim(),
        email: raw.email.trim(),
      },
      location: {
        name: { ...this.locationNameDraft() },
        mapUrl: raw.mapUrl.trim(),
      },
    };
    this.saving.set(true);
    this.api
      .save(next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.applyDocument(saved);
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('common.saveChanges'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private applyDocument(doc: SocialLinksDocument, asBaseline = true): void {
    this.document.set(doc);
    if (asBaseline) {
      this.baseline.set(structuredClone(doc));
    }
    this.descriptionDraft.set({ ...doc.site.description });
    this.locationNameDraft.set({ ...doc.location.name });
    const loc = this.locale();
    this.form.reset({
      description: doc.site.description[loc] || doc.site.description.ar,
      phone: doc.site.phone,
      email: doc.site.email,
      locationName: doc.location.name[loc] || doc.location.name.ar,
      mapUrl: doc.location.mapUrl,
    });
  }

  private flushLocaleFields(): void {
    const raw = this.form.getRawValue();
    const description = { ...this.descriptionDraft() };
    const locationName = { ...this.locationNameDraft() };
    description[this.locale()] = raw.description;
    locationName[this.locale()] = raw.locationName;
    this.descriptionDraft.set(description);
    this.locationNameDraft.set(locationName);
  }
}
