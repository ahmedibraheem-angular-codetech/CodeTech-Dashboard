import { TestBed } from '@angular/core/testing';

import { ServiceProjectCard } from './service-project-card';

describe('ServiceProjectCard', () => {
  async function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(ServiceProjectCard);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const changes: boolean[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => changes.push(value));
    return { fixture, root: fixture.nativeElement as HTMLElement, changes };
  }

  it('shows the cover, title, and summary it is given', async () => {
    const { root } = await render({
      title: 'Wasly',
      summary: 'Delivery platform',
      coverUrl: '/cover.png',
    });
    expect(root.querySelector('h3')?.textContent).toBe('Wasly');
    expect(root.querySelector('p')?.textContent).toBe('Delivery platform');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/cover.png');
  });

  it('renders no image element without a cover and still shows the toggle', async () => {
    const { root } = await render({ title: 'Wasly' });
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.service-project__toggle input')).not.toBeNull();
  });

  it('reflects the selected state and labels the toggle with the project title', async () => {
    const { root } = await render({ title: 'Wasly', selected: true, toggleLabel: 'Add project' });
    const input = root.querySelector<HTMLInputElement>('input');
    expect(input?.checked).toBe(true);
    expect(input?.getAttribute('aria-label')).toBe('Add project: Wasly');
    expect(root.querySelector('.service-project')?.classList.contains('is-selected')).toBe(true);
  });

  it('emits the new value when the toggle is switched', async () => {
    const { fixture, root, changes } = await render({ title: 'Wasly', selected: false });
    root.querySelector<HTMLInputElement>('input')?.click();
    fixture.detectChanges();
    expect(changes).toEqual([true]);
  });

  it('wraps the switch in the element that carries its positioning', async () => {
    const { root } = await render({ title: 'Wasly' });
    const toggle = root.querySelector<HTMLElement>('.service-project__toggle');
    expect(toggle).not.toBeNull();
    expect(root.querySelector('.service-project__toggle p-toggleswitch')).not.toBeNull();
  });
});
