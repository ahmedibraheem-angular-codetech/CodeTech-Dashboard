import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import type { AppLanguage } from '../../../../core/i18n/language';
import { LanguageService } from '../../../../core/services/language.service';
import { readLocale, readMedia, type LocaleText, type Project } from '../../models/project.model';
import { projectPointVisual, usableProjectImage } from '../../utils/project-detail-visual';
import { localeFilled } from '../../utils/project-field-rules';
import { ProjectDetailPoints } from '../project-detail-points/project-detail-points';

@Component({
  selector: 'app-project-detail-data',
  imports: [ProjectDetailPoints],
  templateUrl: './project-detail-data.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailData {
  readonly lang = inject(LanguageService);
  readonly project = input.required<Project>();
  readonly locale = input.required<AppLanguage>();

  protected readonly aboutCards = computed(() => this.points('aboutCards'));
  protected readonly challenges = computed(() => this.points('challenges'));
  protected readonly solutions = computed(() => this.points('solutions'));
  protected readonly features = computed(() => this.points('features'));
  protected readonly results = computed(() => this.points('results'));
  protected readonly tools = computed(() =>
    this.project().tools.filter((entry) => {
      const media = readMedia(entry.image, this.locale());
      return (
        localeFilled(entry.title) || localeFilled(entry.body) || usableProjectImage(media.imageUrl)
      );
    }),
  );
  protected readonly solutionsImage = computed(() => {
    const entry = this.project().solutionsImage;
    const media = readMedia(entry.image, this.locale());
    return usableProjectImage(media.imageUrl) ? { ...entry, media } : null;
  });

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale()) || value.ar;
  }

  protected summary(): string {
    const value = this.project().summary;
    return readLocale(value, this.locale()) || value.ar;
  }

  protected categoryIcon(url: string): string {
    return url.startsWith('icon:') ? url.slice(5) : 'pi-tag';
  }

  protected categoryMediaUrl(entry: Project['categories'][number]): string {
    return readMedia(entry.image, this.locale()).imageUrl;
  }

  protected toolVisual(entry: Project['tools'][number]) {
    return projectPointVisual(entry, this.locale());
  }

  private points(list: 'aboutCards' | 'challenges' | 'solutions' | 'features' | 'results') {
    return this.project()[list].filter((entry) => {
      const art = projectPointVisual(entry, this.locale());
      return localeFilled(entry.title) || localeFilled(entry.body) || !!art.image || !!art.icon;
    });
  }
}
