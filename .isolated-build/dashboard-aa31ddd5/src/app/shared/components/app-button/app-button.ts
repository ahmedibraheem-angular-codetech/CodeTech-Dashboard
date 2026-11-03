import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Button } from 'primeng/button';

import { LanguageService } from '../../../core/services/language.service';

export type AppButtonVariant =
  'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger' | 'success';
export type AppButtonSize = 'small' | 'medium' | 'large';
export type AppButtonType = 'button' | 'submit' | 'reset';
export type AppButtonIconPos = 'start' | 'end' | 'left' | 'right';

type PrimeSeverity = 'primary' | 'secondary' | 'success' | 'danger' | null;
type PrimeVariant = 'outlined' | 'text' | undefined;
type PrimeSize = 'small' | 'large' | undefined;
type PrimeIconPos = 'left' | 'right';

/**
 * Project-wide button. A thin mapped wrapper around PrimeNG Button so features
 * share one variant/size API without owning PrimeNG severity flags.
 *
 * Visual tokens stay in `app-theme.ts` and the existing scoped page overrides.
 * This component does not route, call APIs, or translate.
 */
@Component({
  selector: 'app-button',
  imports: [Button],
  templateUrl: './app-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-button',
    '[class.app-button--fluid]': 'fluid()',
    '[class.app-button--icon-only]': 'iconOnly()',
  },
})
export class AppButton {
  private readonly lang = inject(LanguageService);

  readonly label = input<string>();
  readonly icon = input<string>();
  readonly iconPos = input<AppButtonIconPos>('start');
  readonly variant = input<AppButtonVariant>('primary');
  readonly size = input<AppButtonSize>('medium');
  readonly type = input<AppButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fluid = input(false);
  readonly rounded = input(false);
  /** Applies PrimeNG outlined on top of a colour variant (`danger` + outlined, etc.). */
  readonly outlined = input(false);
  /** Applies PrimeNG text on top of a colour variant (`danger` + text logout). */
  readonly text = input(false);
  readonly ariaLabel = input<string>();
  readonly styleClass = input<string>();

  readonly clicked = output<MouseEvent>();

  protected readonly iconOnly = computed(() => Boolean(this.icon()) && !this.label());

  protected readonly primeLabel = computed(() => this.label() || undefined);
  protected readonly primeIcon = computed(() => this.icon() || undefined);
  protected readonly primeAriaLabel = computed(() => this.ariaLabel() || undefined);
  protected readonly primeStyleClass = computed(() => this.styleClass() || undefined);

  protected readonly primeSeverity = computed<PrimeSeverity>(() => {
    switch (this.variant()) {
      case 'secondary':
      case 'outlined':
      case 'ghost':
        return 'secondary';
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      default:
        return null;
    }
  });

  protected readonly primeVariant = computed<PrimeVariant>(() => {
    if (this.variant() === 'ghost' || this.text()) {
      return 'text';
    }
    if (this.variant() === 'outlined' || this.outlined()) {
      return 'outlined';
    }
    return undefined;
  });

  protected readonly primeSize = computed<PrimeSize>(() => {
    const size = this.size();
    return size === 'medium' ? undefined : size;
  });

  protected readonly primeIconPos = computed<PrimeIconPos>(() => {
    const pos = this.iconPos();
    if (pos === 'left' || pos === 'right') {
      return pos;
    }
    const rtl = this.lang.language() === 'ar';
    if (pos === 'end') {
      return rtl ? 'left' : 'right';
    }
    return rtl ? 'right' : 'left';
  });

  protected onPrimeClick(event: MouseEvent): void {
    this.clicked.emit(event);
  }
}
