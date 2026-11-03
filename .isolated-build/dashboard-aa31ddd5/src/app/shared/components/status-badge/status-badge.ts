import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tag } from 'primeng/tag';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-status-badge',
  imports: [Tag],
  templateUrl: './status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  private readonly lang = inject(LanguageService);
  readonly status = input.required<'active' | 'suspended'>();
  readonly label = computed(() =>
    this.lang.t(this.status() === 'active' ? 'status.active' : 'status.suspended'),
  );
  readonly severity = computed(() => (this.status() === 'active' ? 'success' : 'danger'));
}
