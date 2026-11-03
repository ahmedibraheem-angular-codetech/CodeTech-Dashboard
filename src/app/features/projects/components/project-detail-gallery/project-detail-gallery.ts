import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../core/services/language.service';
import { readMedia, type LocalizedMedia, type Project } from '../../models/project.model';
import { usableProjectImage } from '../../utils/project-detail-visual';

@Component({
  selector: 'app-project-detail-gallery',
  templateUrl: './project-detail-gallery.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailGallery {
  private readonly lang = inject(LanguageService);
  readonly project = input.required<Project>();

  protected mediaUrl(image: LocalizedMedia): string {
    return readMedia(image, this.lang.language()).imageUrl;
  }

  protected show(url: string): boolean {
    return usableProjectImage(url);
  }
}
