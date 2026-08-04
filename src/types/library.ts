export interface LibraryItem {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  item_type: string;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  tags: string[];
  file_path: string | null;
  publisher: string | null;
  journal: string | null;
  uploaded_by: string;
  collection_id?: string | null;
  created_at: string;
  license?: string | null;
  attribution?: string | null;
}

export interface LibraryCollection {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}
