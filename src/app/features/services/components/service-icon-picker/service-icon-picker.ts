import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

/**
 * PrimeIcons offered for the service card. Values are bare classes (`pi-globe`), the same
 * format as `Service.icon`; the picker never produces an `icon:` upload value.
 */
export const SERVICE_ICONS: readonly string[] = [
  'pi-globe',
  'pi-mobile',
  'pi-desktop',
  'pi-cloud',
  'pi-chart-line',
  'pi-shield',
  'pi-code',
  'pi-cog',
  'pi-database',
  'pi-server',
  'pi-sitemap',
  'pi-wrench',
  'pi-headphones',
  'pi-briefcase',
  'pi-building',
  'pi-users',
  'pi-palette',
  'pi-camera',
  'pi-book',
  'pi-megaphone',
  'pi-shopping-cart',
  'pi-wallet',
  'pi-lock',
  'pi-bell',
  'pi-bolt',
  'pi-star',
  'pi-heart',
  'pi-flag',
  'pi-compass',
  'pi-box',
];

/** Feature-local icon selector for the independent `Service.icon` field. */
@Component({
  selector: 'app-service-icon-picker',
  templateUrl: './service-icon-picker.html',
  styleUrl: './service-icon-picker.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceIconPicker {
  /** Current `Service.icon`; empty means none chosen yet. */
  readonly value = input('');
  readonly groupLabel = input('');
  readonly optionLabel = input('');
  readonly picked = output<string>();

  /** An icon that is not in the library stays visible and selectable, so editing never drops it. */
  protected readonly options = computed(() => {
    const current = this.value();
    return current && !SERVICE_ICONS.includes(current)
      ? [current, ...SERVICE_ICONS]
      : SERVICE_ICONS;
  });
}
