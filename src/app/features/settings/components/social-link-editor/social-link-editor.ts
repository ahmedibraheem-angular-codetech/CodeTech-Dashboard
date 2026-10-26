import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Select } from 'primeng/select';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import type {
  SocialChannel,
  SocialChannelDraft,
  SocialPlatformId,
  SocialPublishStatus,
} from '../../models/social-links.model';
import { emptyLocaleText } from '../../models/social-links.model';

@Component({
  selector: 'app-social-link-editor',
  imports: [ReactiveFormsModule, Select, LocaleSwitch, Modal],
  templateUrl: './social-link-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinkEditor {
  private readonly fb = inject(FormBuilder);
  readonly lang = inject(LanguageService);

  readonly visible = model(false);
  readonly platforms = input.required<SocialPlatformId[]>();
  readonly saving = input(false);
  /** Prefer the parent page content locale when opening the modal. */
  readonly contentLocale = input<AppLanguage>();

  readonly saved = output<SocialChannelDraft>();
  readonly cancelled = output<void>();

  readonly locale = linkedSignal<AppLanguage>(() => this.lang.language());
  private readonly urlDraft = signal(emptyLocaleText());
  private readonly editing = signal<SocialChannel | null>(null);

  /** Modal / form copy follows content locale — not the global UI language. */
  t(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  readonly title = computed(() => {
    this.locale();
    return this.t(this.editing() ? 'social.editChannel' : 'social.addChannel');
  });

  readonly saveLabel = computed(() => {
    this.locale();
    return this.t('common.saveChanges');
  });

  readonly cancelLabel = computed(() => {
    this.locale();
    return this.t('common.cancel');
  });

  readonly platformOptions = computed(() => {
    this.locale();
    return this.platforms().map((id) => ({
      label: this.t(`social.platform.${id}`),
      value: id,
    }));
  });

  readonly statusOptions = computed(() => {
    this.locale();
    return [
      { label: this.t('social.status.published'), value: 'published' as const },
      { label: this.t('social.status.draft'), value: 'draft' as const },
    ];
  });

  readonly form = this.fb.nonNullable.group({
    platform: this.fb.nonNullable.control<SocialPlatformId>('linkedin', Validators.required),
    status: this.fb.nonNullable.control<SocialPublishStatus>('published', Validators.required),
    url: this.fb.nonNullable.control('', Validators.required),
  });

  open(channel: SocialChannel | null, platforms: SocialPlatformId[]): void {
    const source = channel?.url ?? emptyLocaleText();
    const loc = this.contentLocale() ?? this.lang.language();
    this.editing.set(channel);
    this.urlDraft.set({ ...source });
    this.locale.set(loc);
    this.form.reset({
      platform: channel?.platform ?? platforms[0] ?? 'linkedin',
      status: channel?.status ?? 'published',
      url: source[loc] || source.ar || source.en,
    });
    this.visible.set(true);
  }

  protected setLocale(next: AppLanguage): void {
    if (next === this.locale()) {
      return;
    }
    this.flushUrl();
    this.locale.set(next);
    this.form.controls.url.setValue(this.urlDraft()[next]);
  }

  protected onSave(): void {
    this.flushUrl();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.saved.emit({
      platform: raw.platform,
      status: raw.status,
      url: { ...this.urlDraft() },
    });
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  private flushUrl(): void {
    const draft = { ...this.urlDraft() };
    draft[this.locale()] = this.form.controls.url.value.trim();
    this.urlDraft.set(draft);
  }
}
