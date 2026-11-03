import { TestBed } from '@angular/core/testing';

import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('mirrors navigator.onLine and reacts to window events', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    TestBed.configureTestingModule({ providers: [NetworkStatusService] });
    const network = TestBed.inject(NetworkStatusService);

    expect(network.online()).toBe(true);

    window.dispatchEvent(new Event('offline'));
    expect(network.online()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(network.online()).toBe(true);
  });
});
