import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import {
  readLocale,
  readMedia,
  type LocaleText,
  type LocalizedMedia,
  type Project,
} from '../../models/project.model';
import { usableProjectImage } from '../../utils/project-detail-visual';
import { localeFilled } from '../../utils/project-field-rules';

@Component({
  selector: 'app-project-detail-identity',
  templateUrl: './project-detail-identity.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailIdentity {
  readonly lang = inject(LanguageService);
  readonly project = input.required<Project>();
  readonly locale = input.required<AppLanguage>();
  readonly identityIndex = signal(0);

  protected readonly buttons = computed(() =>
    this.project().identityButtons.filter((button) => {
      const hasImage = button.images.some((image) =>
        usableProjectImage(readMedia(image.image, this.locale()).imageUrl),
      );
      return localeFilled(button.title) || localeFilled(button.body) || hasImage;
    }),
  );

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale()) || value.ar;
  }

  protected mediaUrl(image: LocalizedMedia): string {
    return readMedia(image, this.locale()).imageUrl;
  }

  protected show(url: string): boolean {
    return usableProjectImage(url);
  }
}
