import { blankService } from '../models/service.model';
import {
  draftAddFaq,
  draftAddPoint,
  draftSetField,
  draftSetProject,
  draftSetWhyImage,
} from './service-draft';

describe('service-draft', () => {
  it('writes locale fields and why image slots', () => {
    const named = draftSetField(blankService(), 'name', 'ar', 'خدمة');
    expect(named.name).toEqual({ ar: 'خدمة', en: '' });

    const withImage = draftSetWhyImage(named, 'en', { name: 'a.png', url: 'blob:1' });
    expect(withImage.whyImage.image.en).toMatchObject({
      imageName: 'a.png',
      imageUrl: 'blob:1',
      imageUuid: null,
    });
  });

  it('adds points/faqs and toggles project selection', () => {
    let draft = draftAddPoint(blankService(), 'solutions');
    expect(draft.solutions).toHaveLength(2);
    draft = draftAddFaq(draft);
    expect(draft.faqs).toHaveLength(2);
    draft = draftSetProject(draft, 'wasly', true);
    expect(draft.projectIds).toContain('wasly');
    draft = draftSetProject(draft, 'wasly', false);
    expect(draft.projectIds).not.toContain('wasly');
  });
});
