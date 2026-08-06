import type { LibraryItem } from "@/types/library";

export type CitationStyle = "apa" | "chicago" | "vancouver" | "iso690";

export const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: "apa", label: "APA 7" },
  { value: "chicago", label: "Chicago" },
  { value: "vancouver", label: "Vancouver" },
  { value: "iso690", label: "ISO 690" },
];

const parts = (name: string) => {
  const t = name.replace(/\s+/g, " ").trim();
  if (!t) return { first: "", last: "" };
  if (t.includes(",")) {
    const [last, first] = t.split(",");
    return { last: last.trim(), first: (first ?? "").trim() };
  }
  const bits = t.split(" ");
  return { last: bits.pop() ?? t, first: bits.join(" ") };
};

const initials = (first: string) =>
  first.split(/[\s.-]+/).filter(Boolean).map((w) => `${w[0].toUpperCase()}.`).join(" ");

const joinList = (list: string[], amp = "&") => {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")} ${amp} ${list[list.length - 1]}`;
};

const authorsApa = (authors: string[]) =>
  joinList(authors.slice(0, 20).map((a) => { const { first, last } = parts(a); return first ? `${last}, ${initials(first)}` : last; }));

const authorsChicago = (authors: string[]) =>
  joinList(authors.map((a, i) => { const { first, last } = parts(a); return i === 0 ? (first ? `${last}, ${first}` : last) : `${first} ${last}`.trim(); }), "y");

const authorsVancouver = (authors: string[]) =>
  authors.slice(0, 6).map((a) => { const { first, last } = parts(a); return `${last}${first ? ` ${initials(first).replace(/[.\s]/g, "")}` : ""}`; }).join(", ") + (authors.length > 6 ? ", et al" : "");

const authorsIso = (authors: string[]) =>
  authors.map((a) => { const { first, last } = parts(a); return `${last.toUpperCase()}${first ? `, ${first}` : ""}`; }).join("; ");

const dot = (s: string) => (s.endsWith(".") ? s : `${s}.`);
const link = (it: LibraryItem) => (it.doi ? `https://doi.org/${it.doi}` : it.url ?? "");

/** Devuelve la referencia bibliográfica completa en el estilo pedido. */
export const formatCitation = (it: LibraryItem, style: CitationStyle): string => {
  const authors = it.authors ?? [];
  const y = it.year ?? "s.f.";
  const src = it.journal || it.publisher || "";
  const url = link(it);

  if (style === "apa") {
    const a = authors.length ? dot(authorsApa(authors)) : "";
    const t = it.item_type === "book" ? `*${it.title}*.` : `${dot(it.title)}`;
    const s = src ? (it.journal ? ` *${src}*.` : ` ${dot(src)}`) : "";
    return `${a} (${y}). ${t}${s}${url ? ` ${url}` : ""}`.replace(/\s+/g, " ").trim();
  }
  if (style === "chicago") {
    const a = authors.length ? dot(authorsChicago(authors)) : "";
    const t = it.item_type === "book" ? `*${it.title}*.` : `"${it.title.replace(/\.$/, "")}."`;
    const s = src ? ` ${it.journal ? `*${src}*` : src},` : "";
    return `${a} ${y}. ${t}${s} ${url}`.replace(/\s+/g, " ").trim().replace(/,?\s*$/, ".");
  }
  if (style === "vancouver") {
    const a = authors.length ? `${authorsVancouver(authors)}. ` : "";
    return `${a}${dot(it.title)} ${src ? `${src}. ` : ""}${it.year ?? ""}${url ? `. Disponible en: ${url}` : ""}`.replace(/\s+/g, " ").trim();
  }
  // ISO 690
  const a = authors.length ? `${authorsIso(authors)}. ` : "";
  return `${a}${dot(it.title)} ${src ? `${src}, ` : ""}${it.year ?? ""}${url ? `. Disponible en: ${url}` : ""}`.replace(/\s+/g, " ").trim();
};

/** Cita corta para insertar en el cuerpo del texto, ej. (Altieri, 2019). */
export const formatInText = (it: LibraryItem, style: CitationStyle): string => {
  const last = (it.authors?.[0] ? parts(it.authors[0]).last : "s.a.");
  const etal = (it.authors?.length ?? 0) > 2 ? " et al." : "";
  const y = it.year ?? "s.f.";
  if (style === "vancouver") return `(${last}${etal}, ${y})`;
  if (style === "chicago") return `(${last}${etal} ${y})`;
  return `(${last}${etal}, ${y})`;
};

/** Bibliografía completa ordenada alfabéticamente, lista para pegar en Word. */
export const formatBibliography = (items: LibraryItem[], style: CitationStyle): string =>
  items
    .map((it) => formatCitation(it, style))
    .sort((a, b) => a.localeCompare(b, "es"))
    .join("\n\n");
