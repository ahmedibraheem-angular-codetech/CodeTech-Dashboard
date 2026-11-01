import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../../../../core/services/language.service';
import { ServiceCard } from './service-card';

describe('ServiceCard', () => {
  async function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [ServiceCard] });
    localStorage.setItem('codetech.language', 'ar');
    TestBed.inject(LanguageService);
    const fixture = TestBed.createComponent(ServiceCard);
    fixture.componentRef.setInput('title', 'تطوير المواقع');
    fixture.componentRef.setInput('description', 'وصف الخدمة');
    fixture.componentRef.setInput('icon', 'pi-globe');
    fixture.componentRef.setInput('published', true);
    fixture.componentRef.setInput('editLabel', 'تعديل الخدمة');
    fixture.componentRef.setInput('deleteLabel', 'حذف الخدمة');
    fixture.componentRef.setInput('toggleLabel', 'عرض الخدمة في الموقع');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the title, description, and a PrimeIcons icon from `icon`', async () => {
    const root: HTMLElement = (await render()).nativeElement;
    expect(root.querySelector('h2')?.textContent?.trim()).toBe('تطوير المواقع');
    expect(root.querySelector('.service-card__description')?.textContent).toBe('وصف الخدمة');
    const icon = root.querySelector('.service-card__icon i');
    expect(icon?.classList.contains('pi')).toBe(true);
    expect(icon?.classList.contains('pi-globe')).toBe(true);
    expect(root.querySelector('img')).toBeNull();
  });

  it('never treats an upload-style `icon:` value or a URL as an icon class', async () => {
    for (const bad of ['icon:pi-globe', '/images/project-cover.jpg', '']) {
      TestBed.resetTestingModule();
      const icon = (await render({ icon: bad })).nativeElement.querySelector(
        '.service-card__icon i',
      );
      expect(icon?.className).toBe('pi pi-cog');
    }
  });

  it('reflects the published state on the toggle with an accessible name', async () => {
    const root: HTMLElement = (await render({ published: false })).nativeElement;
    const input = root.querySelector<HTMLInputElement>('p-toggleswitch input');
    expect(input?.checked).toBe(false);
    expect(input?.getAttribute('aria-label')).toBe('عرض الخدمة في الموقع: تطوير المواقع');
    TestBed.resetTestingModule();
    const on: HTMLElement = (await render({ published: true })).nativeElement;
    expect(on.querySelector<HTMLInputElement>('p-toggleswitch input')?.checked).toBe(true);
  });

  it('emits publish, edit, and delete requests', async () => {
    const fixture = await render({ published: false });
    const root: HTMLElement = fixture.nativeElement;
    const published: boolean[] = [];
    let edits = 0;
    let deletes = 0;
    fixture.componentInstance.publishedChange.subscribe((value) => published.push(value));
    fixture.componentInstance.editRequested.subscribe(() => (edits += 1));
    fixture.componentInstance.deleteRequested.subscribe(() => (deletes += 1));

    root.querySelector<HTMLInputElement>('p-toggleswitch input')?.click();
    root.querySelector<HTMLButtonElement>('button[aria-label="تعديل الخدمة"]')?.click();
    root.querySelector<HTMLButtonElement>('button[aria-label="حذف الخدمة"]')?.click();

    expect(published).toEqual([true]);
    expect(edits).toBe(1);
    expect(deletes).toBe(1);
  });

  it('requests the details from the card body and the title, but not from its controls', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    let opens = 0;
    fixture.componentInstance.openRequested.subscribe(() => (opens += 1));

    root.querySelector<HTMLElement>('.service-card__description')?.click();
    expect(opens).toBe(1);
    root.querySelector<HTMLElement>('.service-card__icon')?.click();
    expect(opens).toBe(2);

    root.querySelector<HTMLButtonElement>('h2 button')?.click();
    expect(opens).toBe(3);

    root.querySelector<HTMLInputElement>('p-toggleswitch input')?.click();
    root.querySelector<HTMLButtonElement>('button[aria-label="تعديل الخدمة"]')?.click();
    root.querySelector<HTMLButtonElement>('button[aria-label="حذف الخدمة"]')?.click();
    expect(opens).toBe(3);
  });
});
