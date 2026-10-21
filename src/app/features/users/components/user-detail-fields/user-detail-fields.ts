import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LanguageService } from '../../../../core/services/language.service';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import type { User } from '../../models/user.model';

/** User detail fields card: identity, contact, role, status, and activity. */
@Component({
  selector: 'app-user-detail-fields',
  imports: [ContentPanel],
  templateUrl: './user-detail-fields.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailFields {
  readonly lang = inject(LanguageService);

  readonly user = input.required<User>();
  readonly displayCode = input.required<string>();
  readonly roleLabel = input.required<string>();
  readonly statusLabel = input.required<string>();
  readonly stamp = input.required<string>();
  readonly isBlocked = input(false);
}
