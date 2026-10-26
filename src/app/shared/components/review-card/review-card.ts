import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { AppButton } from '../app-button/app-button';

export type ReviewCardStatus = 'published' | 'unpublished';

@Component({
  selector: 'app-review-card',
  imports: [FormsModule, Tag, ToggleSwitch, AppButton],
  templateUrl: './review-card.html',
  styleUrl: './review-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCard {
  readonly name = input.required<string>();
  readonly role = input.required<string>();
  readonly externalId = input.required<string>();
  readonly idLabel = input('');
  readonly avatarUrl = input('');
  readonly rating = input(5);
  readonly status = input.required<ReviewCardStatus>();
  readonly publishedLabel = input('');
  readonly unpublishedLabel = input('');
  readonly mediaUrl = input('');
  readonly mediaKind = input<'video' | 'image'>('image');
  readonly playLabel = input('');
  readonly createdAt = input('');
  readonly createdTime = input('');
  readonly quote = input('');
  readonly publishStatusLabel = input('');
  readonly published = input(false);
  readonly editLabel = input('');
  readonly deleteLabel = input('');

  readonly publishedChange = output<boolean>();
  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();
  readonly playRequested = output<void>();

  protected readonly stars = computed(() =>
    Array.from({ length: 5 }, (_, index) => index < Math.max(0, Math.min(5, this.rating()))),
  );

  protected readonly statusLabel = computed(() =>
    this.status() === 'published' ? this.publishedLabel() : this.unpublishedLabel(),
  );
}
