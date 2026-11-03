import type {
  ProjectsPageDto,
  ProjectsPageStatDto,
  ProjectsPageStatWriteDto,
} from '../models/project.api';
import { localeText, type LocaleText } from '../models/project.model';
import type { ProjectsPageContent, ProjectsPageStat } from '../models/projects-page.model';

function locale(value: { ar: string | null; en: string | null } | null | undefined): LocaleText {
  return localeText(
    typeof value?.ar === 'string' ? value.ar : '',
    typeof value?.en === 'string' ? value.en : '',
  );
}

export function mapProjectsPage(dto: ProjectsPageDto): ProjectsPageContent {
  return {
    numbersEnabled: !!dto.sections?.stats_visible,
    numbers: (dto.stats ?? []).map(mapStat),
  };
}

export function mapProjectsPageStat(dto: ProjectsPageStatDto): ProjectsPageStat {
  return mapStat(dto);
}

function mapStat(dto: ProjectsPageStatDto): ProjectsPageStat {
  return {
    id: String(dto.id),
    label: locale(dto.title),
    value: locale(dto.value),
  };
}

export function toProjectsPageStatWrite(stat: ProjectsPageStat): ProjectsPageStatWriteDto {
  return {
    title: { ar: stat.label.ar.trim(), en: stat.label.en.trim() },
    value: { ar: stat.value.ar.trim(), en: stat.value.en.trim() },
  };
}
