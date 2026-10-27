import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FeatureCard } from './feature-card';

@Component({
  imports: [FeatureCard],
  template: `
    <app-feature-card label="Card" titleLabel="Title" bodyLabel="Body" iconLabel="Icon" />
    <app-feature-card
      label="Compact"
      titleLabel="Title"
      bodyLabel="Body"
      iconLabel="Icon"
      [bodyRows]="1"
      [showIcon]="false"
    >
      <p class="projected">Extra content</p>
    </app-feature-card>
  `,
})
class Host {}

describe('FeatureCard', () => {
  it('keeps three description rows and the upload by default', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');

    expect(cards[0].querySelector('textarea').getAttribute('rows')).toBe('3');
    expect(cards[0].querySelector('app-product-upload')).not.toBeNull();
  });

  it('supports a single-row description and projected content inside the body', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');

    expect(cards[1].querySelector('textarea').getAttribute('rows')).toBe('1');
    expect(cards[1].querySelector('app-product-upload')).toBeNull();
    expect(cards[1].querySelector('.feature-card__body .projected')?.textContent).toBe(
      'Extra content',
    );
  });
});
