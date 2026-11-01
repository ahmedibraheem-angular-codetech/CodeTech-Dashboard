import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import type { Review, ReviewContentDraft, ReviewMediaDraft } from '../../models/review.model';
import { ReviewsService } from '../../services/reviews.service';
import { ReviewsBoard } from './reviews-board';

const sample: Review = {
  id: '7',
  externalId: '000007',
  rating: 5,
  published: true,
  photo: {
    uuid: 'photo-uuid',
    url: 'https://cdn.test/portrait.png',
    name: 'portrait',
    fileName: 'portrait.png',
    size: 10,
  },
  video: {
    uuid: 'video-uuid',
    url: 'https://cdn.test/clip.mp4',
    name: 'clip',
    fileName: 'clip.mp4',
    size: 20,
  },
  createdAt: '2026-11-01T12:00:00.000000Z',
  sortOrder: 1,
  texts: {
    ar: { name: 'محمد', role: 'مدير', quote: 'رائع' },
    en: { name: 'Mohamed', role: 'Manager', quote: 'Great' },
  },
};

const GRANTS = [
  'testimonials.view',
  'testimonials.create',
  'testimonials.update',
  'testimonials.delete',
] as const;

/** Template methods are protected; tests exercise them through this harness. */
interface BoardHarness {
  form: ReviewsBoard['form'];
  loadFailed: ReviewsBoard['loadFailed'];
  loading: ReviewsBoard['loading'];
  visible: ReviewsBoard['visible'];
  avatarUrl(review: Review): string;
  mediaUrl(review: Review): string;
  mediaKind(review: Review): 'video' | 'image';
  reload(): void;
  addReview(): void;
  editReview(review: Review): void;
  save(): void;
  setPublished(review: Review, published: boolean): void;
  exportRows(): void;
}

async function settle(fixture: ComponentFixture<ReviewsBoard>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

describe('ReviewsBoard', () => {
  async function render(api: Partial<ReviewsService> = {}) {
    const list = vi.fn(() => of([sample]));
    const create = vi.fn((draft: ReviewContentDraft, media: ReviewMediaDraft) =>
      of({
        ...sample,
        id: '99',
        externalId: '000099',
        rating: draft.rating,
        published: draft.published,
        texts: draft.texts,
        photo: media.photo.kind === 'clear' ? null : sample.photo,
      }),
    );
    const update = vi.fn((id: string, draft: ReviewContentDraft) =>
      of({ ...sample, id, rating: draft.rating, published: draft.published, texts: draft.texts }),
    );
    const setPublished = vi.fn((id: string, published: boolean) =>
      of({ ...sample, id, published }),
    );
    const remove = vi.fn(() => of(undefined));
    const exportCsv = vi.fn(() => of(new Blob(['id\n'], { type: 'text/csv' })));

    TestBed.configureTestingModule({
      imports: [ReviewsBoard],
      providers: [
        MessageService,
        {
          provide: ReviewsService,
          useValue: {
            list,
            create,
            update,
            setPublished,
            remove,
            exportCsv,
            ...api,
          },
        },
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...GRANTS],
      }),
    );

    const fixture = TestBed.createComponent(ReviewsBoard);
    await settle(fixture);
    return {
      fixture,
      board: fixture.componentInstance as unknown as BoardHarness,
      root: fixture.nativeElement as HTMLElement,
      list,
      create,
      update,
      setPublished,
      remove,
      exportCsv,
    };
  }

  it('loads bilingual reviews and maps photo/video for the card', async () => {
    const { root, board } = await render();
    expect(root.textContent).toContain('محمد');
    expect(board.avatarUrl(sample)).toBe('https://cdn.test/portrait.png');
    expect(board.mediaKind(sample)).toBe('video');
    expect(board.mediaUrl(sample)).toBe('https://cdn.test/portrait.png');
  });

  it('shows error state and reloads the list on retry', async () => {
    const list$ = new Subject<Review[]>();
    const list = vi.fn(() => list$.asObservable());
    const { fixture, board, root } = await render({ list } as Partial<ReviewsService>);

    list$.error(new Error('boom'));
    await settle(fixture);
    expect(board.loadFailed()).toBe(true);
    expect(root.querySelector('app-state-view')).toBeTruthy();

    const retry$ = new Subject<Review[]>();
    list.mockImplementationOnce(() => retry$.asObservable());
    board.reload();
    expect(board.loading()).toBe(true);
    retry$.next([sample]);
    retry$.complete();
    await settle(fixture);
    expect(board.loadFailed()).toBe(false);
    expect(root.textContent).toContain('محمد');
  });

  it('creates a review with rating and media draft from the editor', async () => {
    const { board, fixture, create } = await render();
    board.addReview();
    await settle(fixture);
    board.form.setValue({
      nameAr: 'سارة',
      nameEn: 'Sara',
      roleAr: 'مصممة',
      roleEn: 'Designer',
      quoteAr: 'ممتاز',
      quoteEn: 'Excellent',
      rating: 4,
      published: true,
    });
    board.save();
    await settle(fixture);

    expect(create).toHaveBeenCalledWith(
      {
        rating: 4,
        published: true,
        texts: {
          ar: { name: 'سارة', role: 'مصممة', quote: 'ممتاز' },
          en: { name: 'Sara', role: 'Designer', quote: 'Excellent' },
        },
      },
      { photo: { kind: 'omit' }, video: { kind: 'omit' } },
    );
  });

  it('updates without clearing media when the editor omits photo/video', async () => {
    const { board, fixture, update } = await render();
    board.editReview(sample);
    await settle(fixture);
    board.form.controls.quoteEn.setValue('Updated quote');
    board.save();
    await settle(fixture);

    expect(update).toHaveBeenCalledWith(
      '7',
      expect.objectContaining({
        texts: expect.objectContaining({
          en: expect.objectContaining({ quote: 'Updated quote' }),
        }),
      }),
      { photo: { kind: 'omit' }, video: { kind: 'omit' } },
    );
  });

  it('rolls publish state back when the API fails', async () => {
    const setPublished = vi.fn(() => throwError(() => new Error('nope')));
    const { board, fixture } = await render({ setPublished } as Partial<ReviewsService>);
    board.setPublished(sample, false);
    await settle(fixture);
    expect(board.visible().find((row) => row.id === '7')?.published).toBe(true);
  });

  it('exports CSV through the service', async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const { board, fixture, exportCsv } = await render();
    board.exportRows();
    await settle(fixture);
    expect(exportCsv).toHaveBeenCalled();
    click.mockRestore();
  });
});
