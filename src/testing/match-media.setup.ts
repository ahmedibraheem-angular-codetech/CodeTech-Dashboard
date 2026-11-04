/**
 * jsdom often omits matchMedia or ships a MediaQueryList without
 * addEventListener/removeEventListener. LayoutService and others need both.
 */
function createMediaQueryList(query: string): MediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const list = {
    matches: false,
    media: query,
    onchange: null as MediaQueryList['onchange'],
    addListener(listener: (event: MediaQueryListEvent) => void): void {
      listeners.add(listener);
    },
    removeListener(listener: (event: MediaQueryListEvent) => void): void {
      listeners.delete(listener);
    },
    addEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
      if (typeof listener === 'function') {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    },
    removeEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
      if (typeof listener === 'function') {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    },
    dispatchEvent(): boolean {
      return false;
    },
  };

  return list as MediaQueryList;
}

const prior =
  typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia.bind(globalThis) : null;

globalThis.matchMedia = ((query: string): MediaQueryList => {
  if (prior) {
    const list = prior(query);
    if (list && typeof list.addEventListener === 'function') {
      return list;
    }
  }
  return createMediaQueryList(query);
}) as typeof matchMedia;
