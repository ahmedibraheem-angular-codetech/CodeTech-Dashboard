import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProjectsPage } from './projects-list';

describe('ProjectsPage', () => {
  it('renders the project catalog', async () => {
    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('إدارة المشاريع');
    expect(root.textContent).toContain('وصلي');
    expect(root.querySelectorAll('.project-tile')).toHaveLength(6);
  });
});
