// Parsers para importar exportaciones de Zotero: BibTeX (.bib), RIS (.ris) y CSV de Zotero.
export interface ParsedRef {
  title: string;
  authors: string[];
  year: number | null;
  item_type: string;
  doi: string | null;
  url: string | null;
  journal: string | null;
  publisher: string | null;
  abstract: string | null;
  tags: string[];
}

const empty = (): ParsedRef => ({
  title: "", authors: [], year: null, item_type: "article",
  doi: null, url: null, journal: null, publisher: null, abstract: null, tags: [],
});

const clean = (s: string) =>
  s.replace(/^[{"]+|[}",]+$/g, "").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

const normAuthor = (a: string) => {
  const t = clean(a);
  if (t.includes(",")) {
    const [last, first] = t.split(",");
    return `${(first ?? "").trim()} ${last.trim()}`.trim();
  }
  return t;
};

const mapType = (t: string): string => {
  const k = t.toLowerCase();
  if (k.includes("book") && k.includes("section")) return "chapter";
  if (k.includes("incollection") || k.includes("chap")) return "chapter";
  if (k.includes("book")) return "book";
  if (k.includes("thesis") || k === "thes") return "thesis";
  if (k.includes("report") || k === "rprt" || k.includes("tech")) return "report";
  if (k.includes("web") || k.includes("elec") || k.includes("misc") || k.includes("online")) return "web";
  return "article";
};

export const parseBibtex = (text: string): ParsedRef[] => {
  const out: ParsedRef[] = [];
  const entries = text.split(/^\s*@/m).slice(1);
  for (const raw of entries) {
    const typeMatch = raw.match(/^(\w+)\s*\{/);
    const ref = empty();
    ref.item_type = mapType(typeMatch?.[1] ?? "article");
    const fieldRe = /(\w+)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|[^,\n]+)/g;
    let m: RegExpExecArray | null;
    while ((m = fieldRe.exec(raw))) {
      const key = m[1].toLowerCase();
      const val = clean(m[2]);
      if (!val) continue;
      if (key === "title") ref.title = val;
      else if (key === "author" || key === "editor") ref.authors = val.split(/\s+and\s+/i).map(normAuthor).filter(Boolean);
      else if (key === "year" || key === "date") { const y = Number(val.slice(0, 4)); if (y) ref.year = y; }
      else if (key === "journal" || key === "journaltitle" || key === "booktitle") ref.journal = val;
      else if (key === "publisher" || key === "school" || key === "institution") ref.publisher = val;
      else if (key === "doi") ref.doi = val.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      else if (key === "url" || key === "howpublished") ref.url = val.startsWith("http") ? val : ref.url;
      else if (key === "abstract") ref.abstract = val;
      else if (key === "keywords") ref.tags = val.split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    }
    if (ref.title) out.push(ref);
  }
  return out;
};

export const parseRis = (text: string): ParsedRef[] => {
  const out: ParsedRef[] = [];
  let ref = empty();
  let started = false;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z][A-Z0-9])\s+-\s?(.*)$/);
    if (!m) continue;
    const [, tag, valRaw] = m;
    const val = valRaw.trim();
    if (tag === "TY") { if (started && ref.title) out.push(ref); ref = empty(); started = true; ref.item_type = mapType(val); continue; }
    if (tag === "ER") { if (ref.title) out.push(ref); ref = empty(); started = false; continue; }
    if (!val) continue;
    if (tag === "TI" || tag === "T1") ref.title = val;
    else if (tag === "AU" || tag === "A1" || tag === "A2") ref.authors.push(normAuthor(val));
    else if (tag === "PY" || tag === "Y1" || tag === "DA") { const y = Number(val.slice(0, 4)); if (y) ref.year = ref.year ?? y; }
    else if (tag === "JO" || tag === "JF" || tag === "T2") ref.journal = val;
    else if (tag === "PB") ref.publisher = val;
    else if (tag === "DO") ref.doi = val.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    else if (tag === "UR") ref.url = val;
    else if (tag === "AB" || tag === "N2") ref.abstract = ref.abstract ? `${ref.abstract} ${val}` : val;
    else if (tag === "KW") ref.tags.push(val.toLowerCase());
  }
  if (started && ref.title) out.push(ref);
  return out;
};

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cells.push(cur); cur = ""; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
};

const splitCsvRows = (text: string): string[] => {
  const rows: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQ = !inQ; cur += c; }
    else if ((c === "\n") && !inQ) { rows.push(cur.replace(/\r$/, "")); cur = ""; }
    else cur += c;
  }
  if (cur.trim()) rows.push(cur);
  return rows;
};

export const parseZoteroCsv = (text: string): ParsedRef[] => {
  const rows = splitCsvRows(text);
  if (rows.length < 2) return [];
  const headers = splitCsvLine(rows[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const out: ParsedRef[] = [];
  for (const row of rows.slice(1)) {
    const cells = splitCsvLine(row);
    const get = (name: string) => { const i = idx(name); return i >= 0 ? (cells[i] ?? "").trim() : ""; };
    const ref = empty();
    ref.title = get("title");
    if (!ref.title) continue;
    ref.item_type = mapType(get("item type") || "article");
    const authors = get("author");
    ref.authors = authors ? authors.split(";").map(normAuthor).filter(Boolean) : [];
    const y = Number((get("publication year") || get("date")).slice(0, 4));
    ref.year = y || null;
    ref.journal = get("publication title") || null;
    ref.publisher = get("publisher") || null;
    ref.doi = get("doi").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") || null;
    ref.url = get("url") || null;
    ref.abstract = get("abstract note") || null;
    const kw = get("manual tags") || get("automatic tags");
    ref.tags = kw ? kw.split(";").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
    out.push(ref);
  }
  return out;
};

export const parseBibFile = (filename: string, text: string): ParsedRef[] => {
  const n = filename.toLowerCase();
  if (n.endsWith(".ris") || /^TY\s+-\s/m.test(text)) return parseRis(text);
  if (n.endsWith(".csv")) return parseZoteroCsv(text);
  return parseBibtex(text);
};
