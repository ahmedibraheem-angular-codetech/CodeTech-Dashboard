import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
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
import { catchError, forkJoin, of, startWith } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { loadFailureStatus } from '../../../../core/http/api-error';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { NetworkStatusService } from '../../../../core/services/network-status.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { formatIsoDate } from '../../../../shared/utils/date';
import { SocialLinkCard } from '../../components/social-link-card/social-link-card';
import type { SocialLinkCopyResult } from '../../components/social-link-card/social-link-url';
import { SocialLinkEditor } from '../../components/social-link-editor/social-link-editor';
import type { SiteSettings, SiteSettingsDraft } from '../../models/site-settings.model';
import type {
  SocialChannel,
  SocialChannelDraft,
  SocialPlatformId,
} from '../../models/social-links.model';
import { availableSocialPlatforms, emptyLocaleText } from '../../models/social-links.model';
import { SiteSettingsService } from '../../services/site-settings.service';
import { SocialLinksService } from '../../services/social-links.service';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

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
    HasPermissionDirective,
  ],
  templateUrl: './social-links.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinksPage {
  private readonly socialApi = inject(SocialLinksService);
  private readonly siteApi = inject(SiteSettingsService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly network = inject(NetworkStatusService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);

  private readonly editor = viewChild.required(SocialLinkEditor);
  private readonly confirm = viewChild.required(ConfirmDialog);

  readonly state = signal<LoadState>('loading');
  readonly saving = signal(false);
  readonly editorSaving = signal(false);
  readonly locale = signal<AppLanguage>('ar');
  readonly site = signal<SiteSettings | null>(null);
  private readonly siteBaseline = signal<SiteSettings | null>(null);
  readonly channels = signal<SocialChannel[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly editorPlatforms = signal<SocialPlatformId[]>([]);
  private pendingLogoFile: File | null = null;
  private objectUrl: string | null = null;

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
    this.locale();
    const site = this.site();
    if (!site?.updatedAt) {
      return '';
    }
    return this.t('social.lastUpdated').replace(
      '{date}',
      formatIsoDate(site.updatedAt, this.locale()),
    );
  });

  readonly logoPreviewUrl = computed(() => this.site()?.logo.url ?? null);
  readonly logoPreviewName = computed(() => this.site()?.logo.name ?? '');

  t(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  readonly canUpdate = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('site_settings.update');
  });
  readonly canDelete = computed(() => {
    const session = this.auth.session();
    return !!session?.profileLoaded && this.auth.hasPermission('site_settings.delete');
  });

  readonly mapEmbedUrl = computed(() => {
    const query = this.locationQuery().trim() || 'Saudi Arabia';
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=6&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor() {
    this.locale.set(this.lang.language());
    effect(() => {
      if (this.canUpdate()) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });
    this.reload();
  }

  protected reload(): void {
    this.state.set('loading');
    forkJoin({
      site: this.siteApi.get().pipe(catchError((error: unknown) => of({ error }))),
      channels: this.socialApi.list().pipe(catchError((error: unknown) => of({ error }))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ site, channels }) => {
          const siteFailed = site && typeof site === 'object' && 'error' in site;
          const channelsFailed = channels && typeof channels === 'object' && 'error' in channels;

          if (siteFailed && channelsFailed) {
            const err = (site as { error: unknown }).error;
            this.state.set(loadFailureStatus(err, this.network.online()));
            return;
          }

          if (!siteFailed) {
            this.applySite(site as SiteSettings);
          } else {
            this.messages.add({
              severity: 'error',
              summary: this.lang.t('social.siteLoadError'),
            });
          }

          if (!channelsFailed) {
            this.channels.set(channels as SocialChannel[]);
          } else {
            this.channels.set([]);
            this.messages.add({
              severity: 'error',
              summary: this.lang.t('social.channelsLoadError'),
            });
          }

          this.state.set(!siteFailed || !channelsFailed ? 'ready' : 'error');
        },
        error: (error: unknown) => this.state.set(loadFailureStatus(error, this.network.online())),
      });
  }

  protected setLocale(next: AppLanguage): void {
    if (next === this.locale()) {
      return;
    }
    this.flushLocaleFields();
    this.locale.set(next);
    this.form.patchValue({
      description: this.descriptionDraft()[next],
      locationName: this.locationNameDraft()[next],
    });
  }

  protected channelTitle(channel: SocialChannel): string {
    this.locale();
    return this.t(`social.platform.${channel.platform}`);
  }

  protected channelUrl(channel: SocialChannel): string {
    return channel.url;
  }

  protected openLinkLabel(channel: SocialChannel): string {
    this.locale();
    return this.t('social.openLink').replace('{name}', this.channelTitle(channel));
  }

  protected copyLinkLabel(channel: SocialChannel): string {
    this.locale();
    return this.t('social.copyLink').replace('{name}', this.channelTitle(channel));
  }

  protected urlFieldLabel(channel: SocialChannel): string {
    this.locale();
    return this.t('social.urlField').replace('{name}', this.channelTitle(channel));
  }

  protected onCopyResult(result: SocialLinkCopyResult): void {
    if (result.ok) {
      this.messages.add({ severity: 'success', summary: this.lang.t('social.linkCopied') });
      return;
    }
    if (result.reason === 'empty') {
      return;
    }
    this.messages.add({ severity: 'error', summary: this.lang.t('social.linkCopyFailed') });
  }

  protected openAdd(): void {
    const platforms = availableSocialPlatforms(this.channels());
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
    const platforms = [channel.platform, ...availableSocialPlatforms(this.channels(), channel.id)];
    this.editingId.set(channel.id);
    this.editorPlatforms.set(platforms);
    this.editor().open(channel, platforms);
  }

  protected onEditorSaved(draft: SocialChannelDraft): void {
    this.editorSaving.set(true);
    const id = this.editingId();
    const request = id ? this.socialApi.update(id, draft) : this.socialApi.create(draft);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (channel) => {
        this.editorSaving.set(false);
        this.upsertLocalChannel(channel);
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
    this.socialApi
      .remove(channel.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.channels.set(this.channels().filter((item) => item.id !== channel.id));
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
    this.socialApi
      .setPublished(channel.id, enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.upsertLocalChannel(updated),
        error: () => {
          // Force card re-bind to previous enabled value.
          this.channels.set([...this.channels()]);
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
    const current = this.site();
    if (!current) {
      return;
    }
    this.revokeObjectUrl();
    const url = URL.createObjectURL(file);
    this.objectUrl = url;
    this.pendingLogoFile = file;
    this.site.set({
      ...current,
      logo: {
        uuid: current.logo.uuid,
        name: file.name,
        url,
      },
    });
  }

  protected cancel(): void {
    const saved = this.siteBaseline();
    if (!saved) {
      return;
    }
    this.pendingLogoFile = null;
    this.revokeObjectUrl();
    this.applySite(structuredClone(saved));
    this.messages.add({
      severity: 'info',
      summary: this.lang.t('social.changesDiscarded'),
    });
  }

  protected save(): void {
    const current = this.site();
    if (!current || this.saving()) {
      return;
    }
    this.flushLocaleFields();
    const raw = this.form.getRawValue();
    const draft: SiteSettingsDraft = {
      description: { ...this.descriptionDraft() },
      companyName: { ...current.companyName },
      websiteUrl: current.websiteUrl,
      phone: raw.phone.trim(),
      email: raw.email.trim(),
      locationName: { ...this.locationNameDraft() },
      mapUrl: raw.mapUrl.trim(),
      logo: this.pendingLogoFile
        ? { kind: 'replace', file: this.pendingLogoFile }
        : { kind: 'omit' },
    };
    this.saving.set(true);
    this.siteApi
      .save(draft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.pendingLogoFile = null;
          this.revokeObjectUrl();
          this.applySite(saved);
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

  private applySite(site: SiteSettings): void {
    this.site.set(site);
    this.siteBaseline.set(structuredClone(site));
    this.descriptionDraft.set({ ...site.description });
    this.locationNameDraft.set({ ...site.locationName });
    const loc = this.locale();
    this.form.reset({
      description: site.description[loc] || site.description.ar,
      phone: site.phone,
      email: site.email,
      locationName: site.locationName[loc] || site.locationName.ar,
      mapUrl: site.mapUrl,
    });
  }

  private upsertLocalChannel(channel: SocialChannel): void {
    const list = this.channels();
    const index = list.findIndex((item) => item.id === channel.id);
    if (index < 0) {
      this.channels.set([...list, channel]);
      return;
    }
    const next = [...list];
    next[index] = channel;
    this.channels.set(next);
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

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
