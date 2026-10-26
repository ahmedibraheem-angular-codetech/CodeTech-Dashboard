import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AppButton } from '../../../../shared/components/app-button/app-button';
import type { SocialChannel } from '../../models/social-links.model';

@Component({
  selector: 'app-social-link-card',
  imports: [FormsModule, ToggleSwitch, AppButton],
  templateUrl: './social-link-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinkCard {
  readonly channel = input.required<SocialChannel>();
  readonly title = input.required<string>();
  readonly url = input.required<string>();
  readonly editLabel = input.required<string>();
  readonly deleteLabel = input.required<string>();
  readonly wide = input(false);

  readonly enabledChange = output<boolean>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  protected openUrl(): void {
    const href = this.normalizedUrl();
    if (!href) {
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  protected async copyUrl(): Promise<void> {
    const href = this.url().trim();
    if (!href || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Clipboard may be denied; keep silent to avoid changing UX.
    }
  }

  private normalizedUrl(): string {
    const href = this.url().trim();
    if (!href) {
      return '';
    }
    return /^https?:\/\//i.test(href) ? href : `https://${href}`;
  }
}
