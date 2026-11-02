import { emptyProductImage, localeText } from '../models/product.model';
import {
  productsPageFeature,
  productsPageSector,
  type ProductsPageContent,
  type ProductsPageSector,
} from '../models/products-page.model';

const DESK = '/images/product-cover-desk.jpg';
const WOOD = '/images/product-cover-wood.jpg';
const FLAT = '/images/product-cover-flat.jpg';
const PROJECT = '/images/project-cover.jpg';
const POSTER = '/images/video-poster.jpg';

const brief = localeText(
  'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
  'A short description written by the team later.',
);

function pageSector(arTitle: string, enTitle: string, imageUrl: string): ProductsPageSector {
  const image = { ...emptyProductImage(), imageName: `${enTitle}.jpg`, imageUrl };
  return {
    ...productsPageSector(localeText(arTitle, enTitle)),
    image: { ar: { ...image }, en: { ...image } },
  };
}

export const PRODUCTS_PAGE_SEED: ProductsPageContent = {
  featuresEnabled: true,
  sectorsEnabled: true,
  productsVisible: true,
  features: [
    productsPageFeature(
      localeText('مصمم وفق أفضل الممارسات العالمية', 'Built on global best practice'),
      brief,
      'pi-th-large',
    ),
    productsPageFeature(localeText('مرونة عالية', 'High flexibility'), brief, 'pi-cog'),
    productsPageFeature(localeText('أمان موثوق', 'Trusted security'), brief, 'pi-shield'),
    productsPageFeature(localeText('سهولة الاستخدام', 'Easy to use'), brief, 'pi-user'),
    productsPageFeature(localeText('تكامل مرن', 'Flexible integration'), brief, 'pi-sitemap'),
    productsPageFeature(localeText('قابلية التوسع', 'Room to grow'), brief, 'pi-expand'),
  ],
  sectors: [
    pageSector('حكومي', 'Government', PROJECT),
    pageSector('شركات', 'Companies', DESK),
    pageSector('الصحة', 'Health', WOOD),
    pageSector('تعليم', 'Education', FLAT),
    pageSector('القطاع الخاص', 'Private sector', DESK),
    pageSector('المؤسسات', 'Institutions', PROJECT),
    pageSector('الأفراد', 'Individuals', POSTER),
    pageSector('سياحة', 'Tourism', WOOD),
  ],
};
