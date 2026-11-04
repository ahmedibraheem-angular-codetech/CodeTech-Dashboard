import { blankService } from '../models/service.model';
import { evaluateServicePersist } from './service-editor-persist';

describe('service-editor-persist', () => {
  it('returns busy while saving or not ready', () => {
    expect(
      evaluateServicePersist(blankService(), false, {
        saving: true,
        status: 'ready',
        projects: [],
        projectsStatus: 'ready',
      }),
    ).toEqual({ kind: 'busy' });
  });

  it('blocks publish without both names', () => {
    expect(
      evaluateServicePersist(blankService(), true, {
        saving: false,
        status: 'ready',
        projects: [],
        projectsStatus: 'ready',
      }),
    ).toEqual({ kind: 'nameError', step: 0 });
  });

  it('filters unknown project ids only when the catalog is ready', () => {
    const draft = {
      ...blankService(),
      name: { ar: 'أ', en: 'A' },
      projectIds: ['keep', 'drop'],
    };
    const projects = [{ id: 'keep' } as never];

    const loading = evaluateServicePersist(draft, true, {
      saving: false,
      status: 'ready',
      projects,
      projectsStatus: 'loading',
    });
    expect(loading).toEqual({
      kind: 'ready',
      service: { ...draft, published: true, projectIds: ['keep', 'drop'] },
    });

    const ready = evaluateServicePersist(draft, true, {
      saving: false,
      status: 'ready',
      projects,
      projectsStatus: 'ready',
    });
    expect(ready).toEqual({
      kind: 'ready',
      service: { ...draft, published: true, projectIds: ['keep'] },
    });
  });
});
