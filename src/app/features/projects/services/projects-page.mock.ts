import { localeText } from '../models/project.model';
import { projectsPageStat, type ProjectsPageContent } from '../models/projects-page.model';

export const PROJECTS_PAGE_SEED: ProjectsPageContent = {
  numbersEnabled: false,
  numbers: [
    projectsPageStat(localeText('رضا العملاء', 'Customer satisfaction'), localeText('4.8', '4.8')),
    projectsPageStat(localeText('متواجد في 8 دول', 'Present in 8 countries'), localeText('8', '8')),
    projectsPageStat(localeText('مشروع ناجح', 'Successful project'), localeText('150', '150')),
    projectsPageStat(localeText('قطاعًا مختلفًا', 'Different sectors'), localeText('15', '15')),
  ],
};
