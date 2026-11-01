import { HOME_PAGE_DTO } from './homepage.mock';
import { mapHomePage, toBlockWrite } from './homepage.mapper';

describe('homepage.mapper', () => {
  it('maps the home page DTO into the UI model', () => {
    const content = mapHomePage(HOME_PAGE_DTO);
    expect(content.partners).toHaveLength(2);
    expect(content.partners[0]).toMatchObject({
      id: '1',
      name: 'maarej.png',
      image: expect.objectContaining({
        uuid: 'logo-1',
        url: 'https://webdash.codetech-sa-dev.com/storage/maarej.png',
      }),
    });
    expect(content.videoEnabled).toBe(true);
    expect(content.videoName).toBe('intro-video.mp4');
    expect(content.videoUrl).toContain('intro-video.mp4');
    expect(content.about.texts.ar.title).toBe('عن كود التقنية');
    expect(content.about.texts.ar.body).toContain('شركة سعودية');
    expect(content.about.texts.ar.points).toHaveLength(2);
    expect(content.about.image?.uuid).toBe('about-image');
    expect(content.vision.texts.ar.body).toBe('');
    expect(content.vision.image).toBeNull();
  });

  it('builds an Arabic/English write payload and omits image when undefined', () => {
    const content = mapHomePage(HOME_PAGE_DTO);
    const keep = toBlockWrite(content.about, undefined);
    expect(keep.title).toEqual({ ar: 'عن كود التقنية', en: 'About CodeTech' });
    expect(keep.description?.ar).toContain('شركة سعودية');
    expect(keep.points?.en).toEqual(['10+ years of experience', 'A Saudi team']);
    expect(keep).not.toHaveProperty('image');

    const clear = toBlockWrite(content.about, null);
    expect(clear.image).toBeNull();

    const replace = toBlockWrite(content.about, 'new-uuid');
    expect(replace.image).toBe('new-uuid');
  });
});
