import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';

import { isApiError } from '../../../../core/http/api-error';
import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { AppButton } from '../../../../shared/components/app-button/app-button';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { Modal } from '../../../../shared/components/modal/modal';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { formatIsoDate } from '../../../../shared/utils/date';
import { formatFileSize } from '../../../../shared/utils/file-size';
import { parseUploadedImage } from '../../../../shared/utils/image-upload';
import { type AboutImage, type AboutMember, type AboutMemberText } from '../../models/about.model';
import { AboutService } from '../../services/about.service';

const LOCALES: readonly AppLanguage[] = ['ar', 'en'];

function control(value: string, required: boolean): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: required ? [Validators.required] : [],
  });
}

function textGroup(requiredName: boolean): FormGroup<{
  name: FormControl<string>;
  role: FormControl<string>;
}> {
  return new FormGroup({
    name: control('', requiredName),
    role: control('', false),
  });
}

function hasCopy(text: AboutMemberText): boolean {
  return text.name.trim().length > 0 || text.role.trim().length > 0;
}

@Component({
  selector: 'app-about-team',
  imports: [
    ReactiveFormsModule,
    AppButton,
    InputText,
    Tooltip,
    ConfirmDialog,
    ContentPanel,
    LocaleSwitch,
    Modal,
    SectionEmpty,
    HasPermissionDirective,
  ],
  templateUrl: './about-team.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutTeamSection {
  private readonly api = inject(AboutService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  private readonly confirm = viewChild.required(ConfirmDialog);

  readonly team = input.required<AboutMember[]>();
  readonly changed = output<AboutMember[]>();

  readonly locales = LOCALES;
  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly locale = signal<AppLanguage>('ar');
  readonly image = signal<AboutImage | null>(null);
  readonly imageError = signal('');

  readonly imageSize = computed(() => formatFileSize(this.image()?.size ?? 0));
  readonly imageDate = computed(() =>
    formatIsoDate(this.image()?.uploadedAt ?? '1970-01-01', this.lang.language()),
  );

  readonly form = new FormGroup({ ar: textGroup(true), en: textGroup(false) });

  viewOf(member: AboutMember): AboutMemberText {
    const current = this.lang.language();
    const other: AppLanguage = current === 'ar' ? 'en' : 'ar';
    return hasCopy(member.texts[current]) ? member.texts[current] : member.texts[other];
  }

  text(key: string, locale: AppLanguage): string {
    return this.lang.lookup(key, locale) ?? key;
  }

  download(member: AboutMember): void {
    const href = member.image?.downloadUrl || member.image?.url;
    if (!href) {
      return;
    }
    const link = document.createElement('a');
    link.href = href;
    link.download = member.image?.name || this.viewOf(member).name;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  }

  open(member?: AboutMember): void {
    this.editingId.set(member?.id ?? null);
    for (const code of LOCALES) {
      const text = member?.texts[code] ?? { name: '', role: '' };
      this.form.controls[code].setValue({ name: text.name, role: text.role });
    }
    this.form.markAsPristine();
    this.image.set(member?.image ?? null);
    this.imageError.set('');
    this.locale.set(this.lang.language());
    this.editorOpen.set(true);
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.takeImage(input.files?.[0]);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.takeImage(event.dataTransfer?.files?.[0]);
  }

  removeImage(): void {
    this.image.set(null);
    this.imageError.set('');
  }

  save(): void {
    if (this.form.controls.ar.invalid || this.saving()) {
      this.form.controls.ar.markAllAsTouched();
      return;
    }
    const editingId = this.editingId();
    const previous =
      editingId == null ? null : (this.team().find((item) => item.id === editingId)?.image ?? null);
    const member: AboutMember = {
      id: editingId ?? 'new',
      texts: { ar: this.read('ar'), en: this.read('en') },
      image: this.image(),
    };
    const isNew = !editingId;
    this.saving.set(true);
    this.api
      .saveMember(member, previous)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editorOpen.set(false);
          if (isNew) {
            this.messages.add({
              severity: 'success',
              summary: this.lang.t('about.toastMemberAddSuccess'),
            });
          }
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t(isNew ? 'about.toastAddError' : 'about.toastSaveError'),
          });
        },
      });
  }

  async remove(member: AboutMember): Promise<void> {
    const accepted = await this.confirm().ask({
      title: this.lang.t('about.deleteMemberTitle'),
      message: this.lang.t('about.deleteMember'),
      confirmLabel: this.lang.t('about.delete'),
      cancelLabel: this.lang.t('common.back'),
      danger: true,
    });
    if (!accepted) {
      return;
    }
    this.api
      .removeMember(member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reload();
          this.messages.add({
            severity: 'success',
            summary: this.lang.t('about.toastMemberDeleteSuccess'),
          });
        },
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('about.toastDeleteError'),
          }),
      });
  }

  private reload(): void {
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => this.changed.emit(content.team),
        error: (error: unknown) =>
          this.messages.add({
            severity: 'error',
            summary:
              isApiError(error) && error.serverMessage
                ? error.serverMessage
                : this.lang.t('about.toastSaveError'),
          }),
      });
  }

  private read(locale: AppLanguage): AboutMemberText {
    const value = this.form.controls[locale].getRawValue();
    return {
      name: value.name.trim(),
      role: value.role.trim(),
    };
  }

  private takeImage(file: File | undefined): void {
    const result = parseUploadedImage(file);
    if (!result) {
      return;
    }
    if (!result.ok) {
      this.imageError.set(result.errorKey);
      return;
    }
    if (!file) {
      return;
    }
    this.imageError.set('');
    this.image.set({ ...result.image, file, url: undefined, uuid: undefined });
  }
}
