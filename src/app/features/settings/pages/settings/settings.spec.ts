import { TestBed } from '@angular/core/testing';

import { LayoutService } from '../../../../core/services/layout.service';
import { SettingsPage } from './settings';

describe('SettingsPage', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SettingsPage] });
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('offers density and language as two PrimeNG select buttons', () => {
    const { root } = render();
    expect(root.querySelectorAll('p-selectbutton, p-selectButton')).toHaveLength(2);
    expect(root.querySelectorAll('p-selectbutton .p-togglebutton').length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it('switches the density from the select button', () => {
    const { fixture, root } = render();
    const layout = TestBed.inject(LayoutService);
    const groups = root.querySelectorAll('p-selectbutton');

    // Order in the template: density, language. Second option of the first group.
    groups[0].querySelectorAll<HTMLElement>('.p-togglebutton')[1].click();
    fixture.detectChanges();

    expect(layout.density()).toBe('compact');
  });

  it('does not let the active option be unselected', () => {
    const { fixture, root } = render();
    const layout = TestBed.inject(LayoutService);
    const group = root.querySelectorAll('p-selectbutton')[0];

    group.querySelectorAll<HTMLElement>('.p-togglebutton')[0].click();
    fixture.detectChanges();

    expect(layout.density()).toBe('comfortable');
  });

  it('has no theme option', () => {
    const { root } = render();
    expect(root.querySelector('#theme-label')).toBeNull();
  });
});
