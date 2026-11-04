import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

import { type StatisticsCard, type TrendDirection } from './statistics-card.model';

const ANIMATION_MS = 1100;

/** Ease-in-out cubic — soft acceleration and deceleration. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface ParsedStatValue {
  /** Numeric target when the value can be animated; otherwise null. */
  readonly numeric: number | null;
  /** Formats an interpolated number to match the source style. */
  readonly format: (value: number) => string;
  /** Literal fallback when the value is non-numeric. */
  readonly literal: string;
}

interface CardMotion {
  displayed: number;
  target: number;
  format: (value: number) => string;
  frame: number | null;
  /** True after the card has completed (or skipped) its first viewport reveal. */
  revealed: boolean;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function countFractionDigits(value: number): number {
  if (!Number.isFinite(value) || Number.isInteger(value)) {
    return 0;
  }
  const text = String(value);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * Parses a card value into a numeric target + formatter that preserves
 * grouping separators / decimal precision from the original input.
 */
export function parseStatValue(value: string | number): ParsedStatValue {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { numeric: null, format: () => String(value), literal: String(value) };
    }
    const digits = countFractionDigits(value);
    return {
      numeric: value,
      literal: value.toLocaleString(),
      format: (n) =>
        n.toLocaleString(undefined, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }),
    };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { numeric: 0, format: () => '0', literal: '0' };
  }

  // Support en-style "1,284" / "1,284.5" and plain "20" / "12.5".
  const compact = trimmed.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(compact)) {
    return { numeric: null, format: () => trimmed, literal: trimmed };
  }

  const numeric = Number(compact);
  const hasGrouping = trimmed.includes(',');
  const dot = compact.indexOf('.');
  const digits = dot === -1 ? 0 : compact.length - dot - 1;

  return {
    numeric,
    literal: trimmed,
    format: (n) => {
      if (!hasGrouping && digits === 0) {
        return String(Math.round(n));
      }
      const formatted = n.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: hasGrouping,
      });
      return formatted;
    },
  };
}

@Component({
  selector: 'app-statistics-cards',
  imports: [NgTemplateOutlet],
  templateUrl: './statistics-cards.html',
  styleUrl: './statistics-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsCards {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly cards = input.required<readonly StatisticsCard[]>();
  readonly cardSelect = output<StatisticsCard>();

  /** Independent display strings keyed by card id — not derived live from inputs. */
  private readonly displayed = signal<ReadonlyMap<string, string>>(new Map());
  private readonly motion = new Map<string, CardMotion>();
  private readonly inView = signal(false);
  private observer: IntersectionObserver | null = null;

  constructor() {
    effect(() => {
      const cards = this.cards();
      const visible = this.inView();
      untracked(() => this.reconcile(cards, visible));
    });

    afterNextRender(() => this.observeViewport());

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
      for (const state of this.motion.values()) {
        this.cancelFrame(state);
      }
      this.motion.clear();
    });
  }

  protected valueOf(card: StatisticsCard): string {
    return this.displayed().get(card.id) ?? this.fallbackLabel(card);
  }

  protected direction(card: StatisticsCard): TrendDirection {
    if (card.trendDirection) {
      return card.trendDirection;
    }
    if ((card.trend ?? 0) < 0) {
      return 'down';
    }
    if ((card.trend ?? 0) > 0) {
      return 'up';
    }
    return 'neutral';
  }

  protected trendOf(card: StatisticsCard): string {
    if (card.trendLabel) {
      return card.trendLabel;
    }
    if (card.trend == null) {
      return '';
    }
    const sign = card.trend > 0 ? '+' : '';
    return `${sign}${card.trend}%`;
  }

  protected iconFor(direction: TrendDirection): string {
    if (direction === 'down') {
      return 'pi pi-arrow-down-right';
    }
    if (direction === 'up') {
      return 'pi pi-arrow-up-right';
    }
    return 'pi pi-minus';
  }

  protected choose(card: StatisticsCard): void {
    if (card.interactive) {
      this.cardSelect.emit(card);
    }
  }

  private fallbackLabel(card: StatisticsCard): string {
    return typeof card.value === 'number' ? card.value.toLocaleString() : card.value;
  }

  private observeViewport(): void {
    const root = this.host.nativeElement;
    if (typeof IntersectionObserver !== 'function') {
      this.inView.set(true);
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.inView.set(true);
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold: 0.15 },
    );
    this.observer.observe(root);
  }

  private reconcile(cards: readonly StatisticsCard[], visible: boolean): void {
    const seen = new Set<string>();
    const reduced = prefersReducedMotion();
    const patches = new Map<string, string>();

    for (const card of cards) {
      seen.add(card.id);
      const parsed = parseStatValue(card.value);

      if (parsed.numeric == null) {
        this.cancelFrame(this.motion.get(card.id));
        this.motion.delete(card.id);
        patches.set(card.id, parsed.literal);
        continue;
      }

      let state = this.motion.get(card.id);
      if (!state) {
        state = {
          displayed: 0,
          target: parsed.numeric,
          format: parsed.format,
          frame: null,
          revealed: false,
        };
        this.motion.set(card.id, state);
        patches.set(card.id, state.format(0));
      } else {
        state.format = parsed.format;
      }

      const targetChanged = state.target !== parsed.numeric;
      state.target = parsed.numeric;

      if (!visible) {
        // Hold at the current visual value (0 for new cards) until first paint in view.
        patches.set(card.id, state.format(state.displayed));
        continue;
      }

      if (reduced) {
        this.cancelFrame(state);
        state.displayed = state.target;
        state.revealed = true;
        patches.set(card.id, state.format(state.displayed));
        continue;
      }

      if (!state.revealed) {
        // First viewport appearance: always count up from the current visual (0).
        this.startTransition(card.id, state, state.displayed, state.target);
        continue;
      }

      if (targetChanged) {
        // Live update: continue from the currently displayed / interpolated value.
        this.startTransition(card.id, state, state.displayed, state.target);
        continue;
      }

      // Same target — never restart. Leave in-flight frames untouched.
      if (!state.frame) {
        patches.set(card.id, state.format(state.displayed));
      }
    }

    for (const id of [...this.motion.keys()]) {
      if (!seen.has(id)) {
        this.cancelFrame(this.motion.get(id));
        this.motion.delete(id);
      }
    }

    this.displayed.update((current) => {
      const next = new Map(current);
      for (const id of [...next.keys()]) {
        if (!seen.has(id)) {
          next.delete(id);
        }
      }
      for (const [id, label] of patches) {
        // Do not clobber values owned by an active rAF tick.
        if (this.motion.get(id)?.frame != null) {
          continue;
        }
        next.set(id, label);
      }
      return next;
    });
  }

  private startTransition(id: string, state: CardMotion, from: number, to: number): void {
    this.cancelFrame(state);

    if (from === to) {
      state.displayed = to;
      state.revealed = true;
      this.writeLabel(id, state.format(to));
      return;
    }

    const startedAt = performance.now();
    state.revealed = true;
    state.displayed = from;
    this.writeLabel(id, state.format(from));

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / ANIMATION_MS);
      const eased = easeInOutCubic(progress);
      state.displayed = from + (to - from) * eased;
      this.writeLabel(id, state.format(state.displayed));

      if (progress < 1) {
        state.frame = requestAnimationFrame(tick);
        return;
      }

      state.frame = null;
      state.displayed = to;
      this.writeLabel(id, state.format(to));
    };

    state.frame = requestAnimationFrame(tick);
  }

  private writeLabel(id: string, label: string): void {
    this.displayed.update((current) => {
      if (current.get(id) === label) {
        return current;
      }
      const next = new Map(current);
      next.set(id, label);
      return next;
    });
  }

  private cancelFrame(state: CardMotion | undefined): void {
    if (state?.frame != null) {
      cancelAnimationFrame(state.frame);
      state.frame = null;
    }
  }
}
