import { TestBed } from '@angular/core/testing';

import { type StatisticsCard } from './statistics-card.model';
import { StatisticsCards } from './statistics-cards';

describe('StatisticsCards', () => {
  const cards: StatisticsCard[] = [
    { id: 'a', title: 'Open', value: 1284, trend: 12.5, caption: 'Yesterday' },
    { id: 'b', title: 'Closed', value: '20', icon: 'pi pi-inbox' },
  ];

  it('renders every card from the input and formats a numeric value', () => {
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelectorAll('.stat-card')).toHaveLength(2);
    expect(root.textContent).toContain('1,284');
    expect(root.textContent).toContain('+12.5%');
    expect(root.querySelectorAll('.stat-card__trend')).toHaveLength(1);
    expect(root.querySelector('.stat-card__icon .pi-inbox')).not.toBeNull();
  });

  it('emits a click only for an interactive card', () => {
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    const interactive: StatisticsCard = { ...cards[1], interactive: true };
    fixture.componentRef.setInput('cards', [interactive]);
    fixture.detectChanges();
    const chosen: StatisticsCard[] = [];
    fixture.componentInstance.cardSelect.subscribe((card) => chosen.push(card));

    fixture.nativeElement.querySelector('button.stat-card').click();

    expect(chosen).toEqual([interactive]);
  });
});
