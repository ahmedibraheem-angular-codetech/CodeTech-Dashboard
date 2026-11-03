import type { ProjectMedia, ProjectPoint } from '../models/project.model';

const ICON_CLASS = /^pi-[a-z0-9-]+$/;

export interface ProjectPointVisual {
  icon: string;
  image: string;
}

export function usableProjectImage(url: string): boolean {
  return url.length > 0 && !url.startsWith('icon:');
}

export function projectPointVisual(
  entry: Pick<ProjectPoint, 'imageUrl'> | ProjectMedia,
): ProjectPointVisual {
  const url = entry.imageUrl;
  if (!url) {
    return { icon: '', image: '' };
  }
  if (url.startsWith('icon:')) {
    const icon = url.slice('icon:'.length);
    return { icon: ICON_CLASS.test(icon) ? icon : '', image: '' };
  }
  return { icon: '', image: url };
}
