import { blankProject, localeText } from '../models/project.model';
import {
  clearLocalizedSlotImage,
  mapAtIndex,
  patchItemLocaleField,
  removeKeepingMinOne,
  setLocalizedSlotImage,
  withProjectImage,
  withoutProjectImage,
  writeLocaleText,
} from './project-draft';

describe('project-draft helpers', () => {
  it('writes a single locale without dropping the other', () => {
    expect(writeLocaleText(localeText('أ', 'A'), 'ar', 'ب')).toEqual({ ar: 'ب', en: 'A' });
  });

  it('maps and patches list items by index', () => {
    const items = [{ title: localeText('أ', 'A') }, { title: localeText('ب', 'B') }];
    expect(mapAtIndex(items, 0, (item) => ({ ...item, title: localeText('ج', 'C') }))[0]?.title).toEqual(
      localeText('ج', 'C'),
    );
    expect(patchItemLocaleField(items, 1, 'title', 'en', 'Bee')[1]?.title).toEqual(
      localeText('ب', 'Bee'),
    );
  });

  it('sets and clears project images including localized slots', () => {
    const image = withProjectImage(
      { imageName: 'x', imageUrl: 'y', imageUuid: 'z' },
      { name: 'n.png', url: 'blob:n' },
    );
    expect(image.imageUuid).toBeNull();
    expect(withoutProjectImage(image).imageUrl).toBe('');

    const cards = blankProject().aboutCards;
    const withAr = setLocalizedSlotImage(cards, 0, 'ar', { name: 'ar.png', url: 'blob:ar' });
    expect(withAr[0]?.image.ar.imageName).toBe('ar.png');
    expect(clearLocalizedSlotImage(withAr, 0, 'ar')[0]?.image.ar.imageName).toBe('');
  });

  it('keeps at least one item when removing', () => {
    expect(removeKeepingMinOne([1], 0)).toEqual([1]);
    expect(removeKeepingMinOne([1, 2, 3], 1)).toEqual([1, 3]);
  });
});
