import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  readonly crumbs = inject(BreadcrumbService);
  readonly lang = inject(LanguageService);
}
