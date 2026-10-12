import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: API_LATENCY_MS, useValue: 0 }],
    });
    service = TestBed.inject(UsersService);
  });

  it('lists the seeded users', async () => {
    const users = await firstValueFrom(service.list());
    expect(users.length).toBeGreaterThan(0);
  });

  it('creates and removes a user', async () => {
    const created = await firstValueFrom(
      service.create({
        name: 'تجربة',
        email: 'demo@codetech.sa',
        phone: '0550000000',
        role: 'viewer',
        status: 'active',
        joinedAt: '2026-10-12',
      }),
    );
    const afterCreate = await firstValueFrom(service.list());
    expect(afterCreate.some((user) => user.id === created.id)).toBe(true);

    await firstValueFrom(service.remove(created.id));
    const afterRemove = await firstValueFrom(service.list());
    expect(afterRemove.some((user) => user.id === created.id)).toBe(false);
  });
});
