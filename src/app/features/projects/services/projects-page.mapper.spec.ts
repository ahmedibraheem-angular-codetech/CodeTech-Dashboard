import type { ProjectsPageDto, ProjectsPageStatDto } from '../models/project.api';
import {
  mapProjectsPage,
  mapProjectsPageStat,
  toProjectsPageStatWrite,
} from './projects-page.mapper';

const STAT: ProjectsPageStatDto = {
  id: 4,
  title: { ar: 'مشروع', en: 'Project' },
  value: { ar: '١٠', en: '10' },
};

const PAGE: ProjectsPageDto = {
  sections: { stats_visible: true, projects_visible: true },
  stats: [STAT],
};

describe('projects-page.mapper', () => {
  it('maps stats visibility and numbered stats', () => {
    const content = mapProjectsPage(PAGE);
    expect(content.numbersEnabled).toBe(true);
    expect(content.numbers).toEqual([
      {
        id: '4',
        label: { ar: 'مشروع', en: 'Project' },
        value: { ar: '١٠', en: '10' },
      },
    ]);
  });

  it('maps a single stat and tolerates missing stats', () => {
    expect(mapProjectsPageStat(STAT)).toEqual({
      id: '4',
      label: { ar: 'مشروع', en: 'Project' },
      value: { ar: '١٠', en: '10' },
    });
    expect(
      mapProjectsPage({
        sections: { stats_visible: false, projects_visible: false },
        stats: undefined as unknown as ProjectsPageDto['stats'],
      }).numbers,
    ).toEqual([]);
  });

  it('trims labels and values in the write DTO', () => {
    expect(
      toProjectsPageStatWrite({
        id: '4',
        label: { ar: '  أ  ', en: '  B  ' },
        value: { ar: '  ١  ', en: '  1  ' },
      }),
    ).toEqual({
      title: { ar: 'أ', en: 'B' },
      value: { ar: '١', en: '1' },
    });
  });
});
