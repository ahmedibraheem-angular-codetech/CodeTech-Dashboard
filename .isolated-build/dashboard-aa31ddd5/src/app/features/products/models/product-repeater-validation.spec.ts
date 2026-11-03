import {
  blankProduct,
  emptyLocalizedMedia,
  emptyProductImage,
  localeText,
  productFaq,
  productId,
  productMedia,
  productPoint,
  productSector,
  productStat,
  productUnit,
} from './product.model';
import {
  firstRepeaterValidationIssue,
  isNewFaqValid,
  isNewIntegrationImageValid,
  isNewPointTitleBodyValid,
  isNewStatValid,
  isNewUnitValid,
  isServerItemId,
  newFaqAnswerArMissing,
  newFaqQuestionArMissing,
  newIntegrationImageMissing,
  newPointBodyArMissing,
  newPointTitleArMissing,
  newStatTitleArMissing,
  newStatValueArMissing,
  productRepeatersValid,
  sectorImageArMissing,
  slotHasImage,
} from './product-repeater-validation';

describe('product-repeater-validation', () => {
  it('treats numeric ids as server items and others as new', () => {
    expect(isServerItemId('12')).toBe(true);
    expect(isServerItemId('point-1')).toBe(false);
    expect(isServerItemId('')).toBe(false);
  });

  it('treats whitespace-only Arabic as empty', () => {
    const item = {
      ...productPoint(localeText('   ', 'Feature'), localeText('body', 'body')),
      id: productId('point'),
    };
    expect(newPointTitleArMissing(item)).toBe(true);
    expect(isNewPointTitleBodyValid(item)).toBe(false);
  });

  it('skips empty new placeholders and existing server rows for title/body rules', () => {
    const empty = productPoint();
    expect(isNewPointTitleBodyValid(empty)).toBe(true);

    const existing = {
      ...productPoint(localeText('', 'Only EN'), localeText('', 'Only EN')),
      id: '42',
    };
    expect(isNewPointTitleBodyValid(existing)).toBe(true);
    expect(newPointTitleArMissing(existing)).toBe(false);
  });

  it('requires Arabic title and body on new contentful points', () => {
    const item = {
      ...productPoint(localeText('', 'EN title'), localeText('وصف', 'EN body')),
      id: productId('point'),
    };
    expect(newPointTitleArMissing(item)).toBe(true);
    expect(newPointBodyArMissing(item)).toBe(false);
    expect(isNewPointTitleBodyValid(item)).toBe(false);

    item.title = localeText('عنوان', 'EN title');
    expect(isNewPointTitleBodyValid(item)).toBe(true);
  });

  it('requires Arabic label and value on new stats', () => {
    const item = { ...productStat(), id: productId('stat'), label: localeText('', 'L'), value: localeText('1', '1') };
    expect(newStatTitleArMissing(item)).toBe(true);
    expect(newStatValueArMissing(item)).toBe(false);
    expect(isNewStatValid(item)).toBe(false);
  });

  it('requires Arabic title on new modules and reasons/identity-style title-only rows', () => {
    const unit = {
      ...productUnit(),
      id: productId('unit'),
      title: localeText('', 'Module'),
      body: localeText('x', 'x'),
    };
    expect(isNewUnitValid(unit)).toBe(false);
    unit.title = localeText('وحدة', 'Module');
    expect(isNewUnitValid(unit)).toBe(true);
  });

  it('requires Arabic question and answer on new FAQs', () => {
    const item = {
      ...productFaq(),
      id: productId('faq'),
      question: localeText('  ', 'Q'),
      answer: localeText('', 'A'),
    };
    expect(newFaqQuestionArMissing(item)).toBe(true);
    expect(newFaqAnswerArMissing(item)).toBe(true);
    expect(isNewFaqValid(item)).toBe(false);
  });

  it('accepts existing or blob images and rejects cleared slots for integrations', () => {
    expect(slotHasImage({ imageName: 'a.png', imageUrl: 'https://cdn/a.png', imageUuid: 'u1' })).toBe(
      true,
    );
    expect(slotHasImage({ imageName: 'b.png', imageUrl: 'blob:http://local/1', imageUuid: null })).toBe(
      true,
    );
    expect(slotHasImage(emptyProductImage())).toBe(false);

    const missing = {
      ...productMedia(),
      id: productId('media'),
      title: localeText('تكامل', 'Integration'),
      image: emptyLocalizedMedia(),
    };
    expect(newIntegrationImageMissing(missing)).toBe(true);
    expect(isNewIntegrationImageValid(missing)).toBe(false);

    const withRemote = {
      ...missing,
      image: {
        ar: { imageName: 'a.png', imageUrl: 'https://cdn/a.png', imageUuid: 'u1' },
        en: emptyProductImage(),
      },
    };
    expect(isNewIntegrationImageValid(withRemote)).toBe(true);

    const existingCleared = {
      ...productMedia(),
      id: '9',
      title: localeText('قديم', 'Old'),
      image: emptyLocalizedMedia(),
    };
    expect(isNewIntegrationImageValid(existingCleared)).toBe(true);
  });

  it('flags sector rows that keep English media after Arabic was cleared', () => {
    const sector = {
      ...productSector(),
      id: '3',
      image: {
        ar: emptyProductImage(),
        en: { imageName: 'en.png', imageUrl: 'https://cdn/en.png', imageUuid: 'en' },
      },
    };
    expect(sectorImageArMissing(sector)).toBe(true);
  });

  it('reports the first invalid wizard step and keeps a blank product valid', () => {
    expect(productRepeatersValid(blankProduct())).toBe(true);
    expect(firstRepeaterValidationIssue(blankProduct())).toBeNull();

    const draft = blankProduct();
    draft.features = [
      {
        ...productPoint(localeText('', 'Only EN'), localeText('وصف', 'Body')),
        id: productId('point'),
      },
    ];
    expect(firstRepeaterValidationIssue(draft)).toEqual({ step: 0, preferAr: true });

    draft.features = [productPoint()];
    draft.offer = [
      {
        ...productPoint(localeText('عرض', 'Offer'), localeText('', 'Body')),
        id: productId('point'),
      },
    ];
    expect(firstRepeaterValidationIssue(draft)?.step).toBe(2);
  });
});
