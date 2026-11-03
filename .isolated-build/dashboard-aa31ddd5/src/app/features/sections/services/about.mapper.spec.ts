import { ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO } from './about.mock';
import {
  mapAboutPage,
  toCeoWrite,
  toStoryWrite,
  toTeamWrite,
  toVisionWrite,
} from './about.mapper';

describe('about.mapper', () => {
  it('maps the about page and partners into the UI model', () => {
    const content = mapAboutPage(ABOUT_PAGE_DTO, ABOUT_PARTNERS_DTO);
    expect(content.story.texts.ar[0].points).toEqual(['الجودة أولاً', 'فريق سعودي']);
    expect(content.story.image?.uuid).toBe('about-image');
    expect(content.vision.texts.ar.find((g) => g.id === 'vision')?.highlight).toBe(
      'نحو مستقبل رقمي',
    );
    expect(content.ceo.texts.en.name).toBe('Eng. Rami Hassan');
    expect(content.team).toHaveLength(2);
    expect(content.team[0]).toMatchObject({
      id: '1',
      texts: {
        ar: { name: 'سارة محمد', role: 'مصممة واجهات' },
        en: { name: 'Sara Mohamed', role: 'UI designer' },
      },
    });
    expect(content.partners).toHaveLength(2);
    expect(content.partners[0].name).toBe('partner-one.png');
  });

  it('builds story and vision write payloads with Arabic/English lists', () => {
    const content = mapAboutPage(ABOUT_PAGE_DTO, []);
    const story = toStoryWrite(content.story, 'img-1');
    expect(story.philosophy_points?.ar).toContain('الجودة أولاً');
    expect(story.target_market_points?.en).toEqual(['Government entities']);
    expect(story.image).toBe('img-1');

    const keep = toStoryWrite(content.story, undefined);
    expect(keep).not.toHaveProperty('image');

    const vision = toVisionWrite(content.vision);
    expect(vision.vision_quote?.ar).toBe('نحو مستقبل رقمي');
    expect(vision.mission_points?.en).toEqual(['Reliable solutions']);
  });

  it('builds CEO and bilingual team write payloads', () => {
    const content = mapAboutPage(ABOUT_PAGE_DTO, []);
    const ceo = toCeoWrite(content.ceo, null);
    expect(ceo.name.ar).toBe('م. رامي حسن');
    expect(ceo.job_title?.en).toBe('Chief executive of CodeTech');
    expect(ceo.image).toBeNull();

    const team = toTeamWrite(content.team[0], 'photo-1');
    expect(team).toEqual({
      name: { ar: 'سارة محمد', en: 'Sara Mohamed' },
      job_title: { ar: 'مصممة واجهات', en: 'UI designer' },
      photo: 'photo-1',
    });
  });

  it('preserves English on team update when Arabic fields change', () => {
    const content = mapAboutPage(ABOUT_PAGE_DTO, []);
    const member = {
      ...content.team[0],
      texts: {
        ar: { name: 'سارة م.', role: 'مصممة' },
        en: { name: 'Sara Mohamed', role: 'UI designer' },
      },
    };
    expect(toTeamWrite(member, undefined)).toEqual({
      name: { ar: 'سارة م.', en: 'Sara Mohamed' },
      job_title: { ar: 'مصممة', en: 'UI designer' },
    });
  });

  it('sends null English on create when English fields are empty', () => {
    expect(
      toTeamWrite(
        {
          id: 'new',
          texts: {
            ar: { name: 'نورة', role: 'محللة' },
            en: { name: '', role: '' },
          },
          image: null,
        },
        null,
      ),
    ).toEqual({
      name: { ar: 'نورة', en: null },
      job_title: { ar: 'محللة', en: null },
      photo: null,
    });
  });
});
