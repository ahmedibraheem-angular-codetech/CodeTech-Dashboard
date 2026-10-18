export interface ProjectTag {
  icon: string;
  label: string;
}

export interface Project {
  id: string;
  published: boolean;
  name: string;
  summary: string;
  coverUrl: string;
  tags: ProjectTag[];
}
