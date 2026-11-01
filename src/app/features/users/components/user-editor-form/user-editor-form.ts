import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import type { UserRole, UserStatus } from '../../models/user.model';

export type UserEditorFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  role: FormControl<UserRole>;
  status: FormControl<UserStatus>;
  joinedAt: FormControl<string>;
}>;

interface PhotoPreview {
  name: string;
  url: string;
  sizeLabel: string;
  dateLabel: string;
}

@Component({
  selector: 'app-user-editor-form',
  imports: [
    ReactiveFormsModule,
    AppButton,
    FieldError,
    IconField,
    InputIcon,
    InputText,
    LocaleSwitch,
    Select,
  ],
  templateUrl: './user-editor-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditorForm {
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = inject(LanguageService);
  private photoObjectUrl = '';

  readonly form = input.required<UserEditorFormGroup>();

  readonly locale = model.required<AppLanguage>();
  readonly submitted = output<void>();

  readonly photo = signal<PhotoPreview | null>(null);

  readonly formRoles = computed(() => {
    this.locale();
    return [
      { label: this.t('roles.superAdmin'), value: 'super-admin' as const },
      { label: this.t('roles.editor'), value: 'editor' as const },
      { label: this.t('roles.viewer'), value: 'viewer' as const },
    ];
  });

  readonly formStatuses = computed(() => {
    this.locale();
    return [
      { label: this.t('status.active'), value: 'active' as const },
      { label: this.t('status.suspended'), value: 'suspended' as const },
    ];
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearPhoto());
  }

  t(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  clearPhoto(): void {
    if (this.photoObjectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoObjectUrl);
    }
    this.photoObjectUrl = '';
    this.photo.set(null);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onPhotoPick(event: Event): void {
    const input = event.target;
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    this.applyPhoto(file);
    if (input instanceof HTMLInputElement) {
      input.value = '';
    }
  }

  protected onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    this.applyPhoto(event.dataTransfer?.files?.[0]);
  }

  private applyPhoto(file: File | undefined): void {
    if (!file?.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      return;
    }
    this.clearPhoto();
    this.photoObjectUrl = URL.createObjectURL(file);
    this.photo.set({
      name: file.name,
      url: this.photoObjectUrl,
      sizeLabel: this.formatBytes(file.size),
      dateLabel: new Date().toLocaleDateString(this.locale() === 'ar' ? 'ar' : 'en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
