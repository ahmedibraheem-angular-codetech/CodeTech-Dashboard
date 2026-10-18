import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { blankProduct, localeText } from '../models/product.model';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    return TestBed.inject(ProductsService);
  }

  it('loads the seeded product by id', async () => {
    const api = setup();
    const item = await firstValueFrom(api.get('info-system'));
    expect(item?.name.ar).toBe('نظام إدارة خدمات تقنية المعلومات');
  });

  it('saves a new product and returns it from the list', async () => {
    const api = setup();
    const created = await firstValueFrom(
      api.save({ ...blankProduct(), name: localeText('منتج', 'Product') }),
    );
    expect(created.id).not.toBe('');
    const listed = await firstValueFrom(api.list());
    expect(listed.some((item) => item.id === created.id)).toBe(true);
  });
});
