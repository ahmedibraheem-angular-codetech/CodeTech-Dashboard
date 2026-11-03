import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

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
