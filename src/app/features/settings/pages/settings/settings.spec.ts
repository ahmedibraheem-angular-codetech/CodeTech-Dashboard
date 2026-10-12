import { TestBed } from '@angular/core/testing';

import { LayoutService } from '../../../../core/services/layout.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { SettingsPage } from './settings';

describe('SettingsPage', () => {
  function render() {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [SettingsPage] });
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('offers theme, density and language as three PrimeNG select buttons', () => {
    const { root } = render();
    expect(root.querySelectorAll('p-selectbutton, p-selectButton')).toHaveLength(3);
    expect(root.querySelectorAll('p-selectbutton .p-togglebutton').length).toBeGreaterThanOrEqual(
      6,
    );
  });

  it('switches the theme and density from the select buttons', () => {
    const { fixture, root } = render();
    const theme = TestBed.inject(ThemeService);
    const layout = TestBed.inject(LayoutService);
    const groups = root.querySelectorAll('p-selectbutton');

    // Order in the template: density, theme, language. Second option of each group.
    groups[1].querySelectorAll<HTMLElement>('.p-togglebutton')[1].click();
    groups[0].querySelectorAll<HTMLElement>('.p-togglebutton')[1].click();
    fixture.detectChanges();

    expect(theme.theme()).toBe('dark');
    expect(layout.density()).toBe('compact');
  });

  it('does not let the active option be unselected', () => {
    const { fixture, root } = render();
    const theme = TestBed.inject(ThemeService);
    const group = root.querySelectorAll('p-selectbutton')[1];

    group.querySelectorAll<HTMLElement>('.p-togglebutton')[0].click();
    fixture.detectChanges();

    expect(theme.theme()).toBe('light');
  });
});
