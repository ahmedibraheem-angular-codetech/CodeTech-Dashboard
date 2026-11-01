
export const ICON_LIBRARY_IDS = [
  'fi-br-globe',
  'fi-br-golf',
  'fi-br-graduation-cap',
  'fi-br-graphic-tablet',
  'fi-br-grid',
  'fi-br-grid-alt',
  'fi-br-guitar',
  'fi-br-gym',
  'fi-br-hamburger',
  'fi-br-hand-holding-heart',
  'fi-br-hastag',
  'fi-br-hat-birthday',
  'fi-br-head-side-thinking',
  'fi-br-headphones',
  'fi-br-headset',
  'fi-br-heart',
  'fi-br-heart-arrow',
  'fi-br-home',
  'fi-br-home-location',
  'fi-br-home-location-alt',
  'fi-br-hourglass',
  'fi-br-hourglass-end',
  'fi-br-ice-cream',
  'fi-br-ice-skate',
  'fi-br-id-badge',
] as const;

export type IconLibraryId = (typeof ICON_LIBRARY_IDS)[number];

export function iconLibrarySrc(id: string): string {
  return `iconLibrary/${id}.svg`;
}
