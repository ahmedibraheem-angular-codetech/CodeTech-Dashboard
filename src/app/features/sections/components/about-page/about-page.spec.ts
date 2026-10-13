import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { AboutPage } from './about-page';

describe('AboutPage', () => {
  async function render() {
    TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the four About sections from the seed', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelectorAll('app-about-groups')).toHaveLength(2);
    expect(root.querySelector('app-about-ceo')).not.toBeNull();
    expect(root.querySelector('app-about-team')).not.toBeNull();
    expect(root.textContent).toContain('فلسفة الشركة');
    expect(root.textContent).toContain('م. رامي حسن');
    expect(root.querySelectorAll('.about-member')).toHaveLength(4);
    expect(root.querySelector('app-section-empty')).toBeNull();
  });
});
