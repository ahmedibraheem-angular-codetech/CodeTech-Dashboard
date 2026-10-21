import { TestBed } from '@angular/core/testing';

import { SectorCard } from './sector-card';

describe('SectorCard', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [SectorCard] });
    const fixture = TestBed.createComponent(SectorCard);
    fixture.componentRef.setInput('title', 'حكومي');
    fixture.componentRef.setInput('imageUrl', '/images/project-cover.jpg');
    fixture.componentRef.setInput('editLabel', 'تعديل');
    fixture.componentRef.setInput('deleteLabel', 'حذف');
    fixture.detectChanges();
    return fixture;
  }

  it('renders the title, image, and action labels', () => {
    const fixture = render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.classList.contains('app-sector-card')).toBe(true);
    expect(root.textContent).toContain('حكومي');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/images/project-cover.jpg');
    expect(root.querySelector('.app-sector-card__tool--edit')?.getAttribute('aria-label')).toBe(
      'تعديل',
    );
    expect(root.querySelector('.app-sector-card__tool--delete')?.getAttribute('aria-label')).toBe(
      'حذف',
    );
  });

  it('emits edit and delete without owning navigation', () => {
    const fixture = render();
    let edited = false;
    let removed = false;
    fixture.componentInstance.editRequested.subscribe(() => (edited = true));
    fixture.componentInstance.deleteRequested.subscribe(() => (removed = true));

    (
      fixture.nativeElement.querySelector('.app-sector-card__tool--edit') as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector('.app-sector-card__tool--delete') as HTMLButtonElement
    ).click();

    expect(edited).toBe(true);
    expect(removed).toBe(true);
  });
});
