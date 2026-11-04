import type { Project } from '../../projects/models/project.model';
import type { ServiceProjectsStatus } from '../constants/service.constants';

/**
 * When the projects catalog is ready, drop draft ids that are no longer in the list.
 * While loading/failed, keep the draft ids unchanged (same as the previous private helper).
 */
export function filterKnownProjectIds(
  projectIds: readonly string[],
  projects: readonly Project[],
  projectsStatus: ServiceProjectsStatus,
): string[] {
  if (projectsStatus !== 'ready') {
    return [...projectIds];
  }
  const known = new Set(projects.map((project) => project.id));
  return projectIds.filter((id) => known.has(id));
}
