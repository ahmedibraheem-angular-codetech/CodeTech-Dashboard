import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { StatisticsCard, TrendDirection } from './statistics-card.model';

@Component({
  selector: 'app-statistics-cards',
  imports: [NgTemplateOutlet],
  templateUrl: './statistics-cards.html',
  styleUrl: './statistics-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsCards {
  readonly cards = input.required<readonly StatisticsCard[]>();
  readonly cardSelect = output<StatisticsCard>();

  protected valueOf(card: StatisticsCard): string {
    return typeof card.value === 'number' ? card.value.toLocaleString() : card.value;
  }

  protected direction(card: StatisticsCard): TrendDirection {
    if (card.trendDirection) {
      return card.trendDirection;
    }
    if ((card.trend ?? 0) < 0) {
      return 'down';
    }
    if ((card.trend ?? 0) > 0) {
      return 'up';
    }
    return 'neutral';
  }

  protected trendOf(card: StatisticsCard): string {
    if (card.trendLabel) {
      return card.trendLabel;
    }
    if (card.trend == null) {
      return '';
    }
    const sign = card.trend > 0 ? '+' : '';
    return `${sign}${card.trend}%`;
  }

  protected iconFor(direction: TrendDirection): string {
    if (direction === 'down') {
      return 'pi pi-arrow-down-right';
    }
    if (direction === 'up') {
      return 'pi pi-arrow-up-right';
    }
    return 'pi pi-minus';
  }

  protected choose(card: StatisticsCard): void {
    if (card.interactive) {
      this.cardSelect.emit(card);
    }
  }
}
