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
  created_at: string;
}