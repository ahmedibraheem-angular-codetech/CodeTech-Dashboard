import type { LocaleText } from './project.model';
import { localeText, projectId } from './project.model';

export interface ProjectsPageStat {
  id: string;
  label: LocaleText;
  value: LocaleText;
}

export interface ProjectsPageContent {
  numbersEnabled: boolean;
  numbers: ProjectsPageStat[];
}

export function projectsPageStat(label = localeText(), value = localeText()): ProjectsPageStat {
  return { id: projectId('page-stat'), label, value };
}
