import { filterKnownProjectIds } from './service-editor-projects';

describe('service-editor-projects', () => {
  it('keeps draft ids until the catalog is ready', () => {
    expect(filterKnownProjectIds(['a', 'b'], [{ id: 'a' } as never], 'loading')).toEqual([
      'a',
      'b',
    ]);
  });

  it('drops unknown ids when ready', () => {
    expect(
      filterKnownProjectIds(['a', 'gone'], [{ id: 'a' } as never, { id: 'c' } as never], 'ready'),
    ).toEqual(['a']);
  });
});
