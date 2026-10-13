import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { Home } from './home';

describe('Home', () => {
  async function render() {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('composes every section once the content is loaded', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('app-partners-section')).not.toBeNull();
    expect(root.querySelector('app-video-section')).not.toBeNull();
    expect(root.querySelectorAll('app-content-block-card')).toHaveLength(2);
    expect(root.querySelector('app-overview-stats')).toBeNull();
    expect(root.textContent).toContain('عملاؤنا و شركاؤنا');
  });

  it('renders the seeded partners and the filled story sections', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelectorAll('.partner-card')).toHaveLength(8);
    expect(root.querySelector('.video-frame')).not.toBeNull();
    expect(root.querySelectorAll('.story')).toHaveLength(2);
    expect(root.querySelector('app-section-empty')).toBeNull();
  });
});
