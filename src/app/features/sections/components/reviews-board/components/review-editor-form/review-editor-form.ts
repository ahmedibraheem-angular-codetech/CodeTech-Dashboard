import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import type {
  ReviewMediaDraft,
  ReviewMediaFile,
  ReviewMediaIntent,
} from '../../../../models/review.model';

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
export class ReviewEditorForm {
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly form = input.required<ReviewEditorFormGroup>();
  readonly mode = input.required<ReviewEditorMode>();
  readonly submitted = output<void>();

  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly avatar = signal<UploadedImageMeta | null>(null);
  readonly avatarPreview = signal<string | null>(null);
  readonly avatarError = signal('');
  readonly video = signal<UploadedVideoMeta | null>(null);
  readonly videoError = signal('');

  /** Picked File for coat-check upload (never a display URL). */
  private readonly avatarFile = signal<File | null>(null);
  private readonly videoFile = signal<File | null>(null);

  private readonly photoCleared = signal(false);
  private readonly hadExistingPhoto = signal(false);

  readonly imageAccept = IMAGE_UPLOAD_ACCEPT;
  readonly videoAccept = VIDEO_UPLOAD_ACCEPT;

  readonly showVideoUpload = computed(() => this.mode() === 'create');

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

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeAvatarPreview());
  }

  resetMedia(options?: { photo?: ReviewMediaFile | null }): void {
    this.revokeAvatarPreview();
    this.avatar.set(null);
    this.avatarPreview.set(null);
    this.avatarError.set('');
    this.avatarFile.set(null);
    this.video.set(null);
    this.videoError.set('');
    this.videoFile.set(null);
    this.photoCleared.set(false);
    this.hadExistingPhoto.set(false);
    this.locale.set(this.lang.language());

    const photo = options?.photo ?? null;
    if (photo) {
      this.hadExistingPhoto.set(true);
      this.avatarPreview.set(photo.url);
      this.avatar.set({
        name: photo.fileName || photo.name,
        size: photo.size,
        uploadedAt: toIsoDate(new Date()),
      });
    }
  }

  /** Coat-check intents for the parent save call. */
  mediaDraft(): ReviewMediaDraft {
    return {
      photo: this.photoIntent(),
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
    this.revokeAvatarPreview();
    this.avatar.set(null);
    this.avatarPreview.set(null);
    this.avatarError.set('');
    this.avatarFile.set(null);
    if (this.hadExistingPhoto()) {
      this.photoCleared.set(true);
    }
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
    this.video.set(null);
    this.videoError.set('');
    this.videoFile.set(null);
  }

  private photoIntent(): ReviewMediaIntent {
    const file = this.avatarFile();
    if (file) {
      return { kind: 'replace', file };
    }
    if (this.photoCleared()) {
      return { kind: 'clear' };
    }
    return { kind: 'omit' };
  }

  private videoIntent(): ReviewMediaIntent {
    const file = this.videoFile();
    if (file) {
      return { kind: 'replace', file };
    }
    return { kind: 'omit' };
  }

  private takeAvatar(file: File | undefined): void {
    const parsed = parseUploadedImage(file);
    if (!parsed) {
      return;
    }
    if (!parsed.ok) {
      this.avatarError.set(parsed.errorKey);
      return;
    }
    this.revokeAvatarPreview();
    this.avatarError.set('');
    this.photoCleared.set(false);
    this.avatarFile.set(file ?? null);
    this.avatar.set(parsed.image);
    this.avatarPreview.set(file ? URL.createObjectURL(file) : null);
  }

  private takeVideo(file: File | undefined): void {
    const parsed = parseUploadedVideo(file);
    if (!parsed) {
      return;
    }
    if (!parsed.ok) {
      this.videoError.set(parsed.errorKey);
      return;
    }
    this.videoError.set('');
    this.videoFile.set(file ?? null);
    this.video.set(parsed.video);
  }

  private revokeAvatarPreview(): void {
    const url = this.avatarPreview();
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
