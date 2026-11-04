import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { type StatisticsCard } from './statistics-card.model';
import { StatisticsCards, parseStatValue } from './statistics-cards';

describe('parseStatValue', () => {
  it('preserves integer grouping for locale-formatted strings', () => {
    const parsed = parseStatValue('1,284');
    expect(parsed.numeric).toBe(1284);
    expect(parsed.format(1284)).toBe('1,284');
    expect(parsed.format(0)).toBe('0');
  });

  it('preserves decimal precision', () => {
    const parsed = parseStatValue('12.50');
    expect(parsed.numeric).toBe(12.5);
    expect(parsed.format(12.5)).toBe('12.50');
  });

  it('returns null numeric for non-numeric literals', () => {
    expect(parseStatValue('N/A').numeric).toBeNull();
    expect(parseStatValue('N/A').literal).toBe('N/A');
  });
});

describe('StatisticsCards', () => {
  const cards: StatisticsCard[] = [
    { id: 'a', title: 'Open', value: 1284, trend: 12.5, caption: 'Yesterday' },
    { id: 'b', title: 'Closed', value: '20', icon: 'pi pi-inbox' },
  ];

  const ANIMATION_MS = 1100;
  let reducedMotion = true;
  let rafQueue: FrameRequestCallback[] = [];
  let now = 0;

  beforeEach(() => {
    reducedMotion = true;
    rafQueue = [];
    now = 0;

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly callback: IntersectionObserverCallback) {}
        observe(): void {
          this.callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        unobserve(): void {}
        disconnect(): void {}
        takeRecords(): IntersectionObserverEntry[] {
          return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue[id - 1] = () => undefined;
    });
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function flushFrames(ms: number): void {
    now += ms;
    const queue = [...rafQueue];
    rafQueue = [];
    for (const frame of queue) {
      frame(now);
    }
  }

  function finishAnimations(): void {
    for (let guard = 0; guard < 20 && rafQueue.length > 0; guard += 1) {
      flushFrames(ANIMATION_MS);
    }
    rafQueue = [];
  }

  function settle(fixture: { detectChanges(): void }): void {
    fixture.detectChanges();
    // afterNextRender + observer microtasks
    flushFrames(0);
    fixture.detectChanges();
  }

  it('renders every card from the input and formats a numeric value', async () => {
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    fixture.componentRef.setInput('cards', cards);
    settle(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelectorAll('.stat-card')).toHaveLength(2);
    expect(root.textContent).toContain('1,284');
    expect(root.textContent).toContain('+12.5%');
    expect(root.querySelectorAll('.stat-card__trend')).toHaveLength(1);
    expect(root.querySelector('.stat-card__icon .pi-inbox')).not.toBeNull();
  });

  it('emits a click only for an interactive card', () => {
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    const interactive: StatisticsCard = { ...cards[1], interactive: true };
    fixture.componentRef.setInput('cards', [interactive]);
    settle(fixture);
    const chosen: StatisticsCard[] = [];
    fixture.componentInstance.cardSelect.subscribe((card) => chosen.push(card));

    fixture.nativeElement.querySelector('button.stat-card').click();

    expect(chosen).toEqual([interactive]);
  });

  it('counts up from zero on first viewport appearance', async () => {
    reducedMotion = false;
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: 100 }]);
    settle(fixture);

    const value = () =>
      fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim() ?? '';

    expect(value()).toBe('0');

    flushFrames(550);
    fixture.detectChanges();
    const mid = Number(value().replace(/,/g, ''));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    flushFrames(1100);
    fixture.detectChanges();
    expect(value()).toBe('100');
  });

  it('animates from the current displayed value to a new target without resetting to zero', () => {
    reducedMotion = false;
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    const cardsSignal = signal<StatisticsCard[]>([{ id: 'n', title: 'Total', value: 100 }]);
    fixture.componentRef.setInput('cards', cardsSignal());
    settle(fixture);
    finishAnimations();
    fixture.detectChanges();

    const value = () =>
      fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim() ?? '';
    expect(value()).toBe('100');

    cardsSignal.set([{ id: 'n', title: 'Total', value: 200 }]);
    fixture.componentRef.setInput('cards', cardsSignal());
    fixture.detectChanges();

    expect(value()).toBe('100');
    flushFrames(550);
    fixture.detectChanges();
    const mid = Number(value());
    expect(mid).toBeGreaterThan(100);
    expect(mid).toBeLessThan(200);
    expect(value()).not.toBe('0');

    finishAnimations();
    fixture.detectChanges();
    expect(value()).toBe('200');
  });

  it('replaces an in-flight animation from the interpolated value when a newer target arrives', () => {
    reducedMotion = false;
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: 100 }]);
    settle(fixture);
    finishAnimations();
    fixture.detectChanges();

    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: 300 }]);
    fixture.detectChanges();
    flushFrames(200);
    fixture.detectChanges();

    const midText =
      fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim() ?? '0';
    const mid = Number(midText);
    expect(mid).toBeGreaterThan(100);
    expect(mid).toBeLessThan(300);

    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: 150 }]);
    fixture.detectChanges();
    const afterRetarget =
      fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim() ?? '';
    expect(Number(afterRetarget)).toBe(mid);
    expect(afterRetarget).not.toBe('0');

    finishAnimations();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim()).toBe(
      '150',
    );
  });

  it('does not restart when the same numeric target is provided again', () => {
    reducedMotion = false;
    TestBed.configureTestingModule({ imports: [StatisticsCards] });
    const fixture = TestBed.createComponent(StatisticsCards);
    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: '1,284' }]);
    settle(fixture);
    finishAnimations();
    fixture.detectChanges();

    const before = fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim();
    expect(before).toBe('1,284');

    rafQueue = [];
    fixture.componentRef.setInput('cards', [{ id: 'n', title: 'Total', value: '1,284' }]);
    fixture.detectChanges();
    expect(rafQueue).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim()).toBe(
      '1,284',
    );
  });
});
