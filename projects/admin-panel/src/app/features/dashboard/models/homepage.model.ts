export interface Partner {
  id: string;
  name: string;
  monogram: string;
}

export interface ContentBlock {
  title: string;
  body: string;
  points: [string, string, string];
}

export interface HomepageContent {
  partners: Partner[];
  videoEnabled: boolean;
  videoName: string | null;
  about: ContentBlock;
  vision: ContentBlock;
}
