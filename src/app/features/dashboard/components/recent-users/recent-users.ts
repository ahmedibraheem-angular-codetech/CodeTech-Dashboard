import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TableModule } from 'primeng/table';

import { LanguageService } from '../../../../core/services/language.service';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { User } from '../../../users/models/user.model';

@Component({
  selector: 'app-recent-users',
  imports: [TableModule, StatusBadge],
  templateUrl: './recent-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentUsers {
  readonly lang = inject(LanguageService);

  readonly users = input.required<User[]>();
}
