import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../core/services/language.service';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';

/** Ban reason card shown when the user status is suspended. */
@Component({
  selector: 'app-user-detail-ban',
  imports: [ContentPanel],
  templateUrl: './user-detail-ban.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailBan {
  readonly lang = inject(LanguageService);

  readonly stamp = input.required<string>();
}
