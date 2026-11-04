import type { Project } from '../../projects/models/project.model';
import type { ServicePageStatus, ServiceProjectsStatus } from '../constants/service.constants';
import type { Service } from '../models/service.model';
import { serviceNamesValid } from './service-editor-navigation';
import { filterKnownProjectIds } from './service-editor-projects';

export type ServicePersistEvaluation =
  { kind: 'busy' } | { kind: 'nameError'; step: 0 } | { kind: 'ready'; service: Service };

/**
 * Pre-save gate evaluation matching the previous private `persist` method.
 * HTTP, toasts, ObjectUrls, and signal writes stay in the component.
 */
export function evaluateServicePersist(
  draft: Service,
  published: boolean,
  options: {
    saving: boolean;
    status: ServicePageStatus;
    projects: readonly Project[];
    projectsStatus: ServiceProjectsStatus;
  },
): ServicePersistEvaluation {
  if (options.saving || options.status !== 'ready') {
    return { kind: 'busy' };
  }
  if (published && !serviceNamesValid(draft)) {
    return { kind: 'nameError', step: 0 };
  }
  return {
    kind: 'ready',
    service: {
      ...draft,
      published,
      projectIds: filterKnownProjectIds(draft.projectIds, options.projects, options.projectsStatus),
    },
  };
}
