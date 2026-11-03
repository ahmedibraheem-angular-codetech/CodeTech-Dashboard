import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { Project } from '../../models/project.model';
import { usableProjectImage } from '../../utils/project-detail-visual';

@Component({
  selector: 'app-project-detail-gallery',
  templateUrl: './project-detail-gallery.html',
  styleUrl: '../../pages/project-detail/project-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailGallery {
  readonly project = input.required<Project>();

  protected show(url: string): boolean {
    return usableProjectImage(url);
  }
}
