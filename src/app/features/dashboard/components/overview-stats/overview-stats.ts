import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-overview-stats',
  imports: [RouterLink],
  templateUrl: './overview-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewStats {
  readonly lang = inject(LanguageService);

  readonly partnerCount = input.required<number>();
  readonly userTotal = input.required<number>();
  readonly activeUsers = input.required<number>();
  readonly contactRequests = input.required<number>();
}
