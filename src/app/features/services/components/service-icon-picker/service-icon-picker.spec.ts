import { TestBed } from '@angular/core/testing';

import { SERVICES_SEED } from '../../services/services.mock';
import { SERVICE_ICONS, ServiceIconPicker } from './service-icon-picker';

describe('ServiceIconPicker', () => {
  function render(value = '') {
    const fixture = TestBed.createComponent(ServiceIconPicker);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('groupLabel', 'Choose the service icon');
    fixture.componentRef.setInput('optionLabel', 'Select icon');
    fixture.detectChanges();
    const picked: string[] = [];
    fixture.componentInstance.picked.subscribe((icon) => picked.push(icon));
    return { fixture, root: fixture.nativeElement as HTMLElement, picked };
  }

  it('offers only bare PrimeIcons classes, including every seeded service icon', () => {
    expect(SERVICE_ICONS.every((icon) => /^pi-[a-z-]+$/.test(icon))).toBe(true);
    expect(new Set(SERVICE_ICONS).size).toBe(SERVICE_ICONS.length);
    for (const service of SERVICES_SEED) {
      expect(SERVICE_ICONS, service.id).toContain(service.icon);
    }
  });

  it('renders an accessible listbox with one option per icon and nothing selected by default', () => {
    const { root } = render();
    const list = root.querySelector('[role="listbox"]');
    expect(list?.getAttribute('aria-label')).toBe('Choose the service icon');
    const options = root.querySelectorAll('button[role="option"]');
    expect(options).toHaveLength(SERVICE_ICONS.length);
    expect(root.querySelectorAll('.is-selected')).toHaveLength(0);
    expect(options[0]?.getAttribute('aria-label')).toBe('Select icon: pi-globe');
  });

  it('marks the current icon and emits the bare class when another is chosen', () => {
    const { root, picked } = render('pi-cloud');
    const selected = root.querySelectorAll<HTMLElement>('.is-selected');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.dataset['icon']).toBe('pi-cloud');
    expect(selected[0]?.getAttribute('aria-selected')).toBe('true');

    root.querySelector<HTMLButtonElement>('button[data-icon="pi-shield"]')?.click();
    expect(picked).toEqual(['pi-shield']);
    expect(picked[0]).not.toContain('icon:');
  });

  it('keeps an icon outside the library visible and selected', () => {
    const { root } = render('pi-legacy');
    const options = [...root.querySelectorAll<HTMLElement>('button[role="option"]')];
    expect(options).toHaveLength(SERVICE_ICONS.length + 1);
    expect(options[0]?.dataset['icon']).toBe('pi-legacy');
    expect(options[0]?.classList.contains('is-selected')).toBe(true);
  });
});
