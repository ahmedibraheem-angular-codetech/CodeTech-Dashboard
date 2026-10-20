import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import type { AppLanguage } from '../../../core/i18n/language';
import { ProductUpload } from '../../../features/products/components/product-upload/product-upload';

/** One product feature: tab, title, description, and icon. */
@Component({
  selector: 'app-feature-card',
  imports: [InputText, Textarea, ProductUpload],
  templateUrl: './feature-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class FeatureCard {
  readonly label = input.required<string>();
  readonly title = input('');
  readonly titleLabel = input.required<string>();
  readonly titlePlaceholder = input('');
  readonly titleIcon = input('');
  readonly body = input('');
  readonly bodyLabel = input.required<string>();
  readonly bodyPlaceholder = input('');
  readonly iconLabel = input.required<string>();
  readonly imageName = input('');
  readonly imageUrl = input('');
  readonly locale = input<AppLanguage | null>(null);
  /** Library and upload tabs. Plain image drop zones leave this off. */
  readonly actions = input(true);
  readonly showIcon = input(true);
  readonly removeDisabled = input(false);
  readonly removeLabel = input('');
  readonly removeIcon = input('pi-trash');
  /** When false, only the tab stays visible so a parent can show one panel at a time. */
  readonly active = input(true);

  readonly titleChange = output<Event>();
  readonly bodyChange = output<Event>();
  readonly imageChange = output<{ name: string; url: string }>();
  readonly removed = output<void>();
  readonly selected = output<void>();
}
