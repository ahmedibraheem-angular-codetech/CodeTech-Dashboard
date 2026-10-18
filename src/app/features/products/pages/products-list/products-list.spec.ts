import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { ProductsPage } from './products-list';

describe('ProductsPage', () => {
  it('renders the catalog from the products service', async () => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }, provideRouter([])],
    });
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('إدارة المنتجات');
    expect(root.textContent).toContain('نظام إدارة خدمات تقنية المعلومات');
    expect(root.querySelectorAll('.product-card').length).toBeGreaterThan(0);
  });
});
