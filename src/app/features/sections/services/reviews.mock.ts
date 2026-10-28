import type { Review } from '../models/review.model';

const quoteAr =
  'تجربة رائعة مع فريق كود التقنية، التزام بالمواعيد وجودة عالية في التنفيذ والدعم المستمر بعد التسليم.';
const quoteEn =
  'An excellent experience with the CodeTech team — on-time delivery, strong quality, and ongoing support after launch.';

function review(id: string, published: boolean, day: string, time: string, rating = 5): Review {
  return {
    id,
    externalId: '255663',
    rating,
    published,
    avatarUrl: 'images/avatar-placeholder.svg',
    mediaUrl: 'images/ceo.svg',
    mediaKind: 'video',
    createdAt: day,
    createdTime: time,
    texts: {
      ar: {
        name: 'محمد عز الدين',
        role: 'مدير تنفيذي',
        quote: quoteAr,
      },
      en: {
        name: 'Mohamed Ezz El-Din',
        role: 'Executive Manager',
        quote: quoteEn,
      },
    },
  };
}

export const REVIEWS_SEED: Review[] = [
  review('rev1', true, '2026-10-09', '12:00 PM', 5),
  review('rev2', false, '2026-10-09', '12:00 PM', 4),
  review('rev3', true, '2026-10-09', '12:00 PM', 5),
  review('rev4', false, '2026-10-09', '12:00 PM', 4),
  review('rev5', true, '2026-10-09', '12:00 PM', 5),
  review('rev6', false, '2026-10-09', '12:00 PM', 4),
];
