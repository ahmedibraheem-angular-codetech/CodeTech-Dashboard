import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { readLocale, type LocaleText, type Project } from '../../models/project.model';

@Component({
  selector: 'app-project-detail-seo',
  templateUrl: './project-detail-seo.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailSeo {
  readonly lang = inject(LanguageService);
  readonly project = input.required<Project>();
  readonly locale = input.required<AppLanguage>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale()) || value.ar;
  }
}
