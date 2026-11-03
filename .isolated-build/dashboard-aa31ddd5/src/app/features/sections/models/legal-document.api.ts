
export interface LegalPageDto {
  key: 'terms' | 'privacy';
  content: {
    ar: string | null;
    en: string | null;
  };
  updated_by: { id: number; name: string } | null;
  updated_at: string | null;
}

export interface LegalPageWriteDto {
  content: {
    ar: string;
    en: string | null;
  };
}
