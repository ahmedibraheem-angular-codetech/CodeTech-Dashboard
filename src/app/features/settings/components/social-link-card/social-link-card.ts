import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AppButton } from '../../../../shared/components/app-button/app-button';
import type { SocialChannel } from '../../models/social-links.model';
import { toSafeHttpUrl, type SocialLinkCopyResult } from './social-link-url';

export type { SocialLinkCopyResult };

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
  /** Accessible label for the open-in-new-tab control. */
  readonly openLabel = input.required<string>();
  /** Accessible label for the copy-link control. */
  readonly copyLabel = input.required<string>();
  /** Accessible name for the readonly URL field (focusable for select/copy). */
  readonly urlFieldLabel = input.required<string>();
  readonly wide = input(false);

  readonly enabledChange = output<boolean>();
  readonly edit = output<void>();
  readonly remove = output<void>();
  /** Parent shows toast; card stays presentational. */
  readonly copyResult = output<SocialLinkCopyResult>();

  protected openUrl(): void {
    const href = toSafeHttpUrl(this.url());
    if (!href) {
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  protected async copyUrl(): Promise<void> {
    const href = this.url().trim();
    if (!href) {
      this.copyResult.emit({ ok: false, reason: 'empty' });
      return;
    }
    if (!navigator.clipboard?.writeText) {
      this.copyResult.emit({ ok: false, reason: 'unsupported' });
      return;
    }
    try {
      // Copy the stored value (trimmed), not the normalized open URL.
      await navigator.clipboard.writeText(href);
      this.copyResult.emit({ ok: true });
    } catch {
      this.copyResult.emit({ ok: false, reason: 'denied' });
    }
  }
}
