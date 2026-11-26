import {
  ChangeDetectionStrategy,
  type OnInit,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  type AbstractControl,
  type FormControl,
  type FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import type { AppLanguage } from '../../../../../../core/i18n/language';
import { LanguageService } from '../../../../../../core/services/language.service';
import { AppButton } from '../../../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../../../shared/components/locale-switch/locale-switch';
import { watchBilingualErrors } from '../../../../../../shared/utils/bilingual-errors';
import { formatIsoDate, toIsoDate } from '../../../../../../shared/utils/date';
import { formatFileSize } from '../../../../../../shared/utils/file-size';
import {
  IMAGE_UPLOAD_ACCEPT,
  type UploadedImageMeta,
  parseUploadedImage,
} from '../../../../../../shared/utils/image-upload';
import {
  VIDEO_UPLOAD_ACCEPT,
  type UploadedVideoMeta,
  parseUploadedVideo,
} from '../../../../../../shared/utils/video-upload';
import {
  type LocalizedMedia,
  type LocalizedMediaDraft,
  type LocalizedMediaIntent,
  emptyMediaDraft,
} from '../../../../../../core/media/localized-media';
import type { ReviewMediaDraft } from '../../../../models/review.model';

export type ReviewEditorFormGroup = FormGroup<{
  nameAr: FormControl<string>;
  nameEn: FormControl<string>;
  roleAr: FormControl<string>;
  roleEn: FormControl<string>;
  quoteAr: FormControl<string>;
  quoteEn: FormControl<string>;
  rating: FormControl<number>;
  published: FormControl<boolean>;
}>;

interface VideoSlot {
  file: File | null;
  meta: UploadedVideoMeta | null;
  error: string;
  cleared: boolean;
  hadExisting: boolean;
}

interface PhotoSlot {
  file: File | null;
  meta: UploadedImageMeta | null;
  preview: string | null;
  error: string;
  cleared: boolean;
  hadExisting: boolean;
}

const LANGS: readonly AppLanguage[] = ['ar', 'en'];

function emptyVideoSlot(): VideoSlot {
  return { file: null, meta: null, error: '', cleared: false, hadExisting: false };
}

function emptySlot(): PhotoSlot {
  return { file: null, meta: null, preview: null, error: '', cleared: false, hadExisting: false };
}

export type ReviewEditorMode = 'create' | 'edit';

@Component({
  selector: 'app-review-editor-form',
  imports: [
    ReactiveFormsModule,
    AppButton,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    Select,
    Textarea,
    ToggleSwitch,
  ],
  templateUrl: './review-editor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewEditorForm implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly form = input.required<ReviewEditorFormGroup>();
  readonly mode = input.required<ReviewEditorMode>();
  /** Saved files of the review being edited; applied once when the form is created. */
  readonly initialPhoto = input<LocalizedMedia | null>(null);
  readonly initialVideo = input<LocalizedMedia | null>(null);
  readonly submitted = output<void>();

  readonly locale = model<AppLanguage>(this.lang.language());
  protected readonly invalidLocales = watchBilingualErrors(
    () => this.form(),
    this.locale,
    (form, l) => {
      const c = (form as unknown as { controls: Record<string, AbstractControl> }).controls;
      return Object.keys(c)
        .filter((k) => k.endsWith(l === 'ar' ? 'Ar' : 'En'))
        .map((k) => c[k]);
    },
  );
  protected ct(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? this.lang.t(key);
  }

  /** Photo state is kept per content language so each tab edits its own file. */
  private readonly photoState = signal<Record<AppLanguage, PhotoSlot>>({
    ar: emptySlot(),
    en: emptySlot(),
  });
  private patchSlot(lang: AppLanguage, patch: Partial<PhotoSlot>): void {
    this.photoState.update((all) => ({ ...all, [lang]: { ...all[lang], ...patch } }));
  }
  private readonly slot = computed(() => this.photoState()[this.locale()]);

  readonly avatar = computed(() => this.slot().meta);
  readonly avatarPreview = computed(() => this.slot().preview);
  readonly avatarError = computed(() => this.slot().error);
  private readonly videoState = signal<Record<AppLanguage, VideoSlot>>({
    ar: { file: null, meta: null, error: '', cleared: false, hadExisting: false },
    en: { file: null, meta: null, error: '', cleared: false, hadExisting: false },
  });
  private patchVideo(lang: AppLanguage, patch: Partial<VideoSlot>): void {
    this.videoState.update((all) => ({ ...all, [lang]: { ...all[lang], ...patch } }));
  }
  readonly video = computed(() => this.videoState()[this.locale()].meta);
  readonly videoError = computed(() => this.videoState()[this.locale()].error);

  readonly imageAccept = IMAGE_UPLOAD_ACCEPT;
  readonly videoAccept = VIDEO_UPLOAD_ACCEPT;

  readonly showVideoUpload = computed(() => true);

  readonly ratingOptions = Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    return { value, label: `${value}` };
  });

  protected starsFor(rating: number): boolean[] {
    const filled = Math.max(0, Math.min(5, rating));
    return Array.from({ length: 5 }, (_, index) => index < filled);
  }

  readonly avatarSize = computed(() => formatFileSize(this.avatar()?.size ?? 0));
  readonly avatarDate = computed(() =>
    formatIsoDate(this.avatar()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  protected formatVideoSize(size: number): string {
    return formatFileSize(size);
  }

  protected formatVideoDate(iso: string): string {
    return formatIsoDate(iso, this.lang.language());
  }

  ngOnInit(): void {
    this.resetMedia({ photo: this.initialPhoto(), video: this.initialVideo() });
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const l of LANGS) {
        this.revokePreview(this.photoState()[l].preview);
      }
    });
  }

  resetMedia(options?: { photo?: LocalizedMedia | null; video?: LocalizedMedia | null }): void {
    for (const l of LANGS) {
      this.revokePreview(this.photoState()[l].preview);
    }
    const video = { ar: emptyVideoSlot(), en: emptyVideoSlot() };
    for (const l of LANGS) {
      const saved = options?.video?.[l] ?? null;
      if (saved) {
        video[l] = {
          ...emptyVideoSlot(),
          hadExisting: true,
          meta: {
            name: saved.fileName || saved.name,
            size: saved.size,
            uploadedAt: toIsoDate(new Date()),
          },
        };
      }
    }
    this.videoState.set(video);
    this.locale.set(this.lang.language());
    const next = { ar: emptySlot(), en: emptySlot() };
    for (const l of LANGS) {
      const photo = options?.photo?.[l] ?? null;
      if (photo) {
        next[l] = {
          ...emptySlot(),
          hadExisting: true,
          preview: photo.url,
          meta: {
            name: photo.fileName || photo.name,
            size: photo.size,
            uploadedAt: toIsoDate(new Date()),
          },
        };
      }
    }
    this.photoState.set(next);
  }

  mediaDraft(): ReviewMediaDraft {
    return {
      photo: { ar: this.photoIntent('ar'), en: this.photoIntent('en') },
      video: this.videoIntent(),
    };
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onAvatarPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.takeAvatar(input.files?.[0]);
    input.value = '';
  }

  protected onAvatarDrop(event: DragEvent): void {
    event.preventDefault();
    this.takeAvatar(event.dataTransfer?.files?.[0]);
  }

  protected removeAvatar(): void {
    const l = this.locale();
    const cur = this.photoState()[l];
    this.revokePreview(cur.preview);
    this.patchSlot(l, {
      meta: null,
      preview: null,
      error: '',
      file: null,
      cleared: cur.hadExisting,
    });
  }

  protected onVideoPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.takeVideo(input.files?.[0]);
    input.value = '';
  }

  protected onVideoDrop(event: DragEvent): void {
    event.preventDefault();
    this.takeVideo(event.dataTransfer?.files?.[0]);
  }

  protected removeVideo(): void {
    const cur = this.videoState()[this.locale()];
    this.patchVideo(this.locale(), {
      meta: null,
      error: '',
      file: null,
      cleared: cur.hadExisting,
    });
  }

  private photoIntent(l: AppLanguage): LocalizedMediaIntent {
    const slot = this.photoState()[l];
    if (slot.file) {
      return { kind: 'replace', file: slot.file };
    }
    if (slot.cleared) {
      return { kind: 'clear' };
    }
    return { kind: 'omit' };
  }

  private videoIntent(): LocalizedMediaDraft {
    const out = emptyMediaDraft();
    for (const l of LANGS) {
      const slot = this.videoState()[l];
      if (slot.file) {
        out[l] = { kind: 'replace', file: slot.file };
      } else if (slot.cleared) {
        out[l] = { kind: 'clear' };
      }
    }
    return out;
  }

  private takeAvatar(file: File | undefined): void {
    const l = this.locale();
    const parsed = parseUploadedImage(file);
    if (!parsed) {
      return;
    }
    if (!parsed.ok) {
      this.patchSlot(l, { error: parsed.errorKey });
      return;
    }
    this.revokePreview(this.photoState()[l].preview);
    this.patchSlot(l, {
      error: '',
      cleared: false,
      file: file ?? null,
      meta: parsed.image,
      preview: file ? URL.createObjectURL(file) : null,
    });
  }

  private takeVideo(file: File | undefined): void {
    const l = this.locale();
    const parsed = parseUploadedVideo(file);
    if (!parsed) {
      return;
    }
    if (!parsed.ok) {
      this.patchVideo(l, { error: parsed.errorKey });
      return;
    }
    this.patchVideo(l, { error: '', cleared: false, file: file ?? null, meta: parsed.video });
  }

  private revokePreview(url: string | null): void {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
