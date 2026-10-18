import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';

export interface ProductCardFeature {
  id: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-product-card',
  imports: [Button],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly imageUrl = input('');
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly features = input<ProductCardFeature[]>([]);
  readonly revealed = input(false);
  readonly deleteLabel = input('');
  readonly editLabel = input('');
  readonly viewLabel = input('');
  readonly moreLabel = input('');

  readonly deleteRequested = output<void>();
  readonly editRequested = output<void>();
  readonly viewRequested = output<void>();
  readonly moreRequested = output<MouseEvent>();
}
