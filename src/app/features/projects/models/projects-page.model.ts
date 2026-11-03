import type { LocaleText } from './project.model';

export interface ProjectsPageStat {
  id: string;
  label: LocaleText;
  value: LocaleText;
}

export interface ProjectsPageContent {
  numbersEnabled: boolean;
  numbers: ProjectsPageStat[];
}
