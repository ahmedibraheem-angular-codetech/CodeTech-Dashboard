import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  templateUrl: './brand-logo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandLogo {
  readonly tone = input<'brand' | 'light' | 'color'>('brand');
}
