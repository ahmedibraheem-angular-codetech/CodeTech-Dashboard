import type { Project } from '../models/project.model';

const COVER = '/images/project-cover.jpg';

const tags = [
  { icon: 'pi pi-code', label: 'UI/UX' },
  { icon: 'pi pi-microchip', label: 'البرمجة' },
  { icon: 'pi pi-cloud', label: 'Cloud' },
];

function project(id: string): Project {
  return {
    id,
    published: true,
    name: 'موقع وتطبيق "وصلي" للخدمات السريعة',
    summary:
      'وصف نصي قصير تعريفي وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصحوبة فريق العمل. فقط ليتم التمييز من المراد بشكل أدق عن كود التقنية يتم كتابة جملة.',
    coverUrl: COVER,
    tags,
  };
}

/** Local catalog until a projects API exists. The screen repeats one project, as in the design. */
export const PROJECTS_SEED: Project[] = [
  project('wasly-1'),
  project('wasly-2'),
  project('wasly-3'),
  project('wasly-4'),
  project('wasly-5'),
  project('wasly-6'),
];
