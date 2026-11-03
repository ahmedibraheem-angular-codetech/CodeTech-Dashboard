import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { readLocale, type LocaleText, type ProjectPoint } from '../../models/project.model';
import { projectPointVisual } from '../../utils/project-detail-visual';

@Component({
  selector: 'app-project-detail-points',
  templateUrl: './project-detail-points.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPoints {
  readonly items = input.required<readonly ProjectPoint[]>();
  readonly locale = input.required<AppLanguage>();

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale()) || value.ar;
  }

  protected visual(entry: ProjectPoint) {
    return projectPointVisual(entry);
  }
}
