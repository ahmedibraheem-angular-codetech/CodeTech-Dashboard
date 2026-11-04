import { blankProduct, localeText } from '../models/product.model';
import {
  clearLocalizedSlotImage,
  mapAtIndex,
  patchItemLocaleField,
  removeKeepingMinOne,
  setLocalizedSlotImage,
  withProductImage,
  withoutProductImage,
  writeLocaleText,
} from './product-draft';

describe('product-draft helpers', () => {
  it('writes a single locale without dropping the other', () => {
    expect(writeLocaleText(localeText('أ', 'A'), 'en', 'B')).toEqual({ ar: 'أ', en: 'B' });
  });

  it('maps and patches list items by index', () => {
    const items = [{ title: localeText('أ', 'A') }, { title: localeText('ب', 'B') }];
    expect(mapAtIndex(items, 1, (item) => ({ ...item, title: localeText('ج', 'C') }))).toEqual([
      { title: localeText('أ', 'A') },
      { title: localeText('ج', 'C') },
    ]);
    expect(patchItemLocaleField(items, 0, 'title', 'ar', 'جديد')).toEqual([
      { title: localeText('جديد', 'A') },
      { title: localeText('ب', 'B') },
    ]);
  });

  it('sets and clears product images including localized slots', () => {
    const image = withProductImage(
      { imageName: '', imageUrl: '', imageUuid: 'old' },
      { name: 'a.png', url: 'blob:1' },
    );
    expect(image).toEqual({ imageName: 'a.png', imageUrl: 'blob:1', imageUuid: null });
    expect(withoutProductImage(image)).toEqual({
      imageName: '',
      imageUrl: '',
      imageUuid: null,
    });

    const sectors = blankProduct().sectors;
    const withEn = setLocalizedSlotImage(sectors, 0, 'en', { name: 'en.png', url: 'blob:en' });
    expect(withEn[0]?.image.en).toMatchObject({ imageName: 'en.png', imageUrl: 'blob:en' });
    expect(clearLocalizedSlotImage(withEn, 0, 'en')[0]?.image.en.imageUrl).toBe('');
  });

  it('keeps at least one item when removing', () => {
    expect(removeKeepingMinOne(['a'], 0)).toEqual(['a']);
    expect(removeKeepingMinOne(['a', 'b'], 0)).toEqual(['b']);
  });
});
