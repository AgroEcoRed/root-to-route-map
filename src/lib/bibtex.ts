import type { LibraryItem } from "@/types/library";

const escape = (s: string) => (s ?? "").replace(/[{}\\]/g, "\\$&");

export const toBibtex = (items: LibraryItem[]): string => {
  return items
    .map((it) => {
      const firstAuthor = (it.authors?.[0] ?? "anon").split(/\s+/).pop() ?? "anon";
      const key = `${firstAuthor}${it.year ?? ""}${it.id.slice(0, 4)}`.replace(/[^A-Za-z0-9]/g, "");
      const lines = [
        `  title = {${escape(it.title)}}`,
        it.authors?.length ? `  author = {${it.authors.map(escape).join(" and ")}}` : null,
        it.year ? `  year = {${it.year}}` : null,
        it.journal ? `  journal = {${escape(it.journal)}}` : null,
        it.publisher ? `  publisher = {${escape(it.publisher)}}` : null,
        it.doi ? `  doi = {${it.doi}}` : null,
        it.url ? `  url = {${it.url}}` : null,
        it.abstract ? `  abstract = {${escape(it.abstract)}}` : null,
        it.tags?.length ? `  keywords = {${it.tags.join(", ")}}` : null,
      ].filter(Boolean);
      const type = it.item_type === "book" ? "book" : it.item_type === "thesis" ? "phdthesis" : "article";
      return `@${type}{${key},\n${lines.join(",\n")}\n}`;
    })
    .join("\n\n");
};

export const toCsv = (items: LibraryItem[]): string => {
  const header = ["title", "authors", "year", "type", "doi", "url", "journal", "publisher", "tags"];
  const escapeCsv = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const rows = items.map((it) =>
    [
      it.title,
      (it.authors ?? []).join("; "),
      it.year ?? "",
      it.item_type,
      it.doi ?? "",
      it.url ?? "",
      it.journal ?? "",
      it.publisher ?? "",
      (it.tags ?? []).join("; "),
    ]
      .map(String)
      .map(escapeCsv)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
};

export const downloadFile = (filename: string, content: string, mime = "text/plain") => {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};