import { DestroyRef, Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ObjectUrls {
  private readonly owned = new Set<string>();
  private readonly draft = new Map<string, number>();
  private readonly store = new Map<string, number>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.owned) {
        URL.revokeObjectURL(url);
      }
      this.owned.clear();
      this.draft.clear();
      this.store.clear();
    });
  }

  create(file: Blob): string {
    const url = URL.createObjectURL(file);
    this.owned.add(url);
    this.draft.set(url, (this.draft.get(url) ?? 0) + 1);
    return url;
  }

  release(url: string): void {
    this.dec(this.draft, url);
    this.gc(url);
  }

  abandon(value: unknown): void {
    for (const url of blobUrls(value)) {
      this.release(url);
    }
  }

  sync(previous: unknown, next: unknown): void {
    const before = blobUrlCounts(previous);
    const after = blobUrlCounts(next);
    for (const url of new Set([...before.keys(), ...after.keys()])) {
      const delta = (after.get(url) ?? 0) - (before.get(url) ?? 0);
      if (delta > 0) {
        this.store.set(url, (this.store.get(url) ?? 0) + delta);
      } else if (delta < 0) {
        this.dec(this.store, url, -delta);
      }
      this.gc(url);
    }
  }

  private dec(map: Map<string, number>, url: string, by = 1): void {
    const count = map.get(url);
    if (count === undefined) {
      return;
    }
    if (count > by) {
      map.set(url, count - by);
      return;
    }
    map.delete(url);
  }

  private gc(url: string): void {
    if (!url || !this.owned.has(url) || this.draft.has(url) || this.store.has(url)) {
      return;
    }
    this.owned.delete(url);
    URL.revokeObjectURL(url);
  }
}

export function blobUrls(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) {
      into.add(value);
    }
    return into;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      blobUrls(item, into);
    }
    return into;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      blobUrls(item, into);
    }
  }
  return into;
}

export function blobUrlCounts(
  value: unknown,
  into = new Map<string, number>(),
): Map<string, number> {
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) {
      into.set(value, (into.get(value) ?? 0) + 1);
    }
    return into;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      blobUrlCounts(item, into);
    }
    return into;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      blobUrlCounts(item, into);
    }
  }
  return into;
}
