import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SectionPage } from './section';

function route(titleKey: string): ActivatedRoute {
  return {
    data: of({ titleKey }),
    snapshot: { data: { titleKey } },
  } as unknown as ActivatedRoute;
}

describe('SectionPage', () => {
  async function render(titleKey: string) {
    TestBed.configureTestingModule({
      imports: [SectionPage],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: route(titleKey) }],
    });
    const fixture = TestBed.createComponent(SectionPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders an empty placeholder from the route titleKey', async () => {
    const fixture = await render('nav.categories');
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-state-view')).not.toBeNull();
    expect(root.querySelector('app-about-page')).toBeNull();
    expect(root.querySelector('app-faq-board')).toBeNull();
    expect(root.querySelector('app-inquiries-board')).toBeNull();
    expect(root.querySelector('app-reviews-board')).toBeNull();
    expect(root.querySelector('app-legal-document-board')).toBeNull();
  });

  it('does not import feature boards for any titleKey', async () => {
    for (const key of ['nav.about', 'nav.faq', 'nav.reviews', 'nav.terms', 'nav.inquiries']) {
      TestBed.resetTestingModule();
      const fixture = await render(key);
      const root: HTMLElement = fixture.nativeElement;
      expect(root.querySelector('app-about-page')).toBeNull();
      expect(root.querySelector('app-faq-board')).toBeNull();
      expect(root.querySelector('app-inquiries-board')).toBeNull();
      expect(root.querySelector('app-reviews-board')).toBeNull();
      expect(root.querySelector('app-legal-document-board')).toBeNull();
      expect(root.querySelector('app-state-view')).not.toBeNull();
    }
  });
});
