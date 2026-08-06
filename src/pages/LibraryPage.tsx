import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Upload, Download, Search, Tag, FileText, ExternalLink, Loader2, Plus, FolderPlus, Folder, Sparkles, Library, Quote, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import type { LibraryItem, LibraryCollection } from "@/types/library";
import { toBibtex, toCsv, downloadFile } from "@/lib/bibtex";
import { parseBibFile } from "@/lib/bibimport";
import { TAG_LABELS, CURATED_TAG_SLUGS, tagLabel } from "@/lib/libraryTags";
import LicenseSelector from "@/components/LicenseSelector";
import LicenseBadge from "@/components/LicenseBadge";
import { DEFAULT_LICENSE, LicenseCode } from "@/lib/licenses";
import { normalizeTitle, normalizePersonName } from "@/lib/titleCase";
import { CITATION_STYLES, CitationStyle, formatCitation, formatBibliography } from "@/lib/citations";

const ITEM_TYPES = ["article", "book", "thesis", "report", "chapter", "web"];

// Reconoce metadatos a partir de un DOI o de un link (OJS, DSpace, SciELO, etc.)
const fetchCitationMeta = async (input: string) => {
  const { data, error } = await supabase.functions.invoke("fetch-citation", { body: { input } });
  if (error) return null;
  const meta = data as any;
  if (!meta || meta.error) return null;
  return meta;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const LibraryPage = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [collections, setCollections] = useState<LibraryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [zoteroOpen, setZoteroOpen] = useState(false);
  const [style, setStyle] = useState<CitationStyle>(
    (localStorage.getItem("agrored-citation-style") as CitationStyle) ?? "apa"
  );

  // Support deep-link ?tag=participatory-guarantee from SPG page etc.
  useEffect(() => {
    const t = searchParams.get("tag");
    if (t && t !== tagFilter) setTagFilter(t);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep URL in sync when the user changes the tag chip.
  useEffect(() => {
    const current = searchParams.get("tag");
    if (tagFilter && current !== tagFilter) {
      setSearchParams((p) => { const n = new URLSearchParams(p); n.set("tag", tagFilter); return n; }, { replace: true });
    } else if (!tagFilter && current) {
      setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("tag"); return n; }, { replace: true });
    }
  }, [tagFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollections = async () => {
    const { data } = await supabase
      .from("library_collections")
      .select("*")
      .order("name", { ascending: true });
    setCollections((data ?? []) as LibraryCollection[]);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("library_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as LibraryItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); loadCollections(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      if (collectionFilter && it.collection_id !== collectionFilter) return false;
      if (tagFilter && !it.tags?.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.authors?.some((a) => a.toLowerCase().includes(q)) ||
        it.abstract?.toLowerCase().includes(q) ||
        it.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, tagFilter, collectionFilter]);

  const countByCollection = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((it) => { if (it.collection_id) m.set(it.collection_id, (m.get(it.collection_id) ?? 0) + 1); });
    return m;
  }, [items]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((it) =>
      it.tags?.forEach((t) => {
        if (TAG_LABELS[t]) counts.set(t, (counts.get(t) ?? 0) + 1);
      })
    );
    return CURATED_TAG_SLUGS
      .filter((s) => counts.has(s))
      .sort((a, b) => tagLabel(a, lang).localeCompare(tagLabel(b, lang)));
  }, [items, lang]);

  const createCollection = async () => {
    if (!user) return;
    const name = window.prompt("Nombre de la carpeta");
    if (!name?.trim()) return;
    const { data, error } = await supabase
      .from("library_collections")
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Carpeta creada");
    await loadCollections();
    setCollectionFilter((data as LibraryCollection).id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider px-4 py-1 rounded-full bg-secondary/10 mb-3">
              Biblioteca colaborativa
            </span>
            <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-3 flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" /> Biblioteca AgroEco
            </h1>
            <p className="text-muted-foreground">
              Repositorio abierto de documentos, artículos y referencias sobre agroecología.
              Lectura libre, contribución para usuarios registrados. Las referencias no se eliminan, solo se suman.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container max-w-6xl">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, autor, etiqueta…"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => downloadFile("agroecored-biblio.bib", toBibtex(filtered))}>
              <Download className="h-4 w-4 mr-1" /> BibTeX
            </Button>
            <Button variant="outline" onClick={() => downloadFile("agroecored-biblio.csv", toCsv(filtered), "text/csv")}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            {user ? (
              <>
                <Dialog open={zoteroOpen} onOpenChange={setZoteroOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><RefreshCw className="h-4 w-4 mr-1" /> Conectar Zotero</Button>
                  </DialogTrigger>
                  <ZoteroDialog onClose={() => { setZoteroOpen(false); load(); }} />
                </Dialog>
                <Dialog open={importOpen} onOpenChange={setImportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Library className="h-4 w-4 mr-1" /> Importar archivo</Button>
                  </DialogTrigger>
                  <ImportDialog
                    collections={collections}
                    defaultCollection={collectionFilter}
                    onClose={() => { setImportOpen(false); load(); }}
                  />
                </Dialog>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" /> Sumar referencia</Button>
                  </DialogTrigger>
                  <UploadDialog
                    collections={collections}
                    defaultCollection={collectionFilter}
                    onClose={() => { setOpen(false); load(); }}
                  />
                </Dialog>
              </>
            ) : (
              <Button asChild><Link to="/ingresar"><Upload className="h-4 w-4 mr-1" /> Ingresá para subir</Link></Button>
            )}
          </div>

          {/* Citas */}
          <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
            <Quote className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Estilo de cita</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={style}
              onChange={(e) => { setStyle(e.target.value as CitationStyle); localStorage.setItem("agrored-citation-style", e.target.value); }}
            >
              {CITATION_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(formatBibliography(filtered, style));
                toast.success(`Bibliografía de ${filtered.length} referencias copiada`);
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar bibliografía
            </Button>
          </div>

          {/* Folders */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <button
              onClick={() => setCollectionFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${!collectionFilter ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary"}`}
            >
              <Folder className="h-3 w-3" /> Toda la biblioteca ({items.length})
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => setCollectionFilter(c.id === collectionFilter ? null : c.id)}
                className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${c.id === collectionFilter ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary"}`}
                title={c.description ?? undefined}
              >
                <Folder className="h-3 w-3" /> {c.name} ({countByCollection.get(c.id) ?? 0})
              </button>
            ))}
            {user && (
              <button
                onClick={createCollection}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary flex items-center gap-1"
              >
                <FolderPlus className="h-3 w-3" /> Nueva carpeta
              </button>
            )}
          </div>

          {/* Tag chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setTagFilter(null)}
                className={`text-xs px-3 py-1 rounded-full border ${!tagFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
              >Todas</button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t === tagFilter ? null : t)}
                  className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${t === tagFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                >
                  <Tag className="h-3 w-3" /> {tagLabel(t, lang)}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aún no hay referencias. {user ? "¡Sumá la primera!" : "Ingresá para sumar la primera."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  collections={collections}
                  canEdit={!!user && it.uploaded_by === user.id}
                  onMoved={load}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

const ItemCard = ({
  item, collections, canEdit, onMoved,
}: { item: LibraryItem; collections: LibraryCollection[]; canEdit: boolean; onMoved: () => void }) => {
  const { lang } = useLanguage();
  const openFile = async () => {
    if (!item.file_path) return;
    const { data, error } = await supabase.storage
      .from("biblioteca")
      .createSignedUrl(item.file_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Iniciá sesión para acceder al archivo");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  const move = async (collection_id: string | null) => {
    const { error } = await supabase.from("library_items").update({ collection_id }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Referencia movida");
    onMoved();
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl p-4 sm:p-5 bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{item.item_type}{item.year ? ` · ${item.year}` : ""}</p>
          <h3 className="font-display text-lg text-foreground leading-snug">{item.title}</h3>
          {item.authors?.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{item.authors.join(", ")}</p>
          )}
          {item.journal && <p className="text-xs text-muted-foreground italic">{item.journal}</p>}
          {item.abstract && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.abstract}</p>
          )}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tagLabel(t, lang)}</span>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LicenseBadge code={item.license} attribution={item.attribution} />
            {item.collection_id && !canEdit && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {collections.find((c) => c.id === item.collection_id)?.name ?? "Carpeta"}
              </span>
            )}
            {canEdit && (
              <select
                className="text-[11px] rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground"
                value={item.collection_id ?? ""}
                onChange={(e) => move(e.target.value || null)}
              >
                <option value="">Sin carpeta</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {item.file_path && (
            <button onClick={openFile} className="text-xs flex items-center gap-1 text-primary hover:underline">
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Enlace
            </a>
          )}
          {item.doi && (
            <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">
              DOI: {item.doi}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const UploadDialog = ({
  collections, defaultCollection, onClose,
}: { collections: LibraryCollection[]; defaultCollection: string | null; onClose: () => void }) => {
  const { user } = useAuth();
  const [doi, setDoi] = useState("");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState<string>("");
  const [itemType, setItemType] = useState("article");
  const [url, setUrl] = useState("");
  const [journal, setJournal] = useState("");
  const [publisher, setPublisher] = useState("");
  const [abstract, setAbstract] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [collectionId, setCollectionId] = useState<string>(defaultCollection ?? "");
  const [license, setLicense] = useState<LicenseCode>(DEFAULT_LICENSE);
  const [attribution, setAttribution] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  const autoRead = async (f: File) => {
    if (f.size > 20 * 1024 * 1024) {
      toast.error("El archivo supera los 20 MB; completá la ficha a mano");
      return;
    }
    setReading(true);
    try {
      const fileBase64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("parse-bibliography", {
        body: { fileBase64, mime: f.type || "application/pdf", filename: f.name },
      });
      if (error) throw error;
      const meta = data as any;
      if (!meta || meta.error) throw new Error(meta?.error ?? "Sin datos");
      if (meta.title) setTitle((p) => p || normalizeTitle(meta.title));
      if (meta.authors?.length) setAuthors((p) => p || meta.authors.map((a: string) => normalizePersonName(a)).join(", "));
      if (meta.year) setYear((p) => p || String(meta.year));
      if (meta.item_type) setItemType(meta.item_type);
      if (meta.doi) setDoi((p) => p || meta.doi);
      if (meta.journal) setJournal((p) => p || meta.journal);
      if (meta.publisher) setPublisher((p) => p || meta.publisher);
      if (meta.abstract) setAbstract((p) => p || meta.abstract);
      if (meta.tags?.length) setTags((p) => p || meta.tags.join(", "));
      toast.success("Ficha completada automáticamente. Revisá y corregí si hace falta.");
    } catch (e: any) {
      toast.error("No se pudo leer el archivo automáticamente. Completá la ficha a mano.");
    } finally {
      setReading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setFile(f);
    autoRead(f);
  };

  const lookup = async () => {
    const input = doi.trim();
    if (!input) return;
    setBusy(true);
    const meta = await fetchCitationMeta(input);
    setBusy(false);
    if (!meta) return toast.error("No se pudieron reconocer los metadatos de ese DOI o link");
    if (meta.title) setTitle(normalizeTitle(meta.title));
    if (meta.authors?.length) setAuthors(meta.authors.map((a: string) => normalizePersonName(a)).join(", "));
    setYear(meta.year ? String(meta.year) : "");
    setJournal(meta.journal ?? "");
    setPublisher(meta.publisher ?? "");
    setUrl(meta.url ?? (/^https?:\/\//i.test(input) ? input : ""));
    setAbstract(meta.abstract ?? "");
    if (meta.item_type) setItemType(meta.item_type);
    if (meta.doi) setDoi(meta.doi);
    else if (/^https?:\/\//i.test(input)) setDoi("");
    if (meta.tags?.length) setTags((p) => p || meta.tags.join(", "));
    toast.success("Metadatos reconocidos. Revisá la ficha antes de guardar.");
  };

  const submit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("El título es obligatorio");
    setBusy(true);
    let filePath: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("biblioteca").upload(path, file);
      if (upErr) { setBusy(false); return toast.error(upErr.message); }
      filePath = path;
    }
    const { error } = await supabase.from("library_items").insert({
      title: normalizeTitle(title.trim()),
      authors: authors.split(",").map((a) => normalizePersonName(a.trim())).filter(Boolean),
      year: year ? Number(year) : null,
      item_type: itemType,
      doi: doi.trim() || null,
      url: url.trim() || null,
      journal: journal.trim() || null,
      publisher: publisher.trim() || null,
      abstract: abstract.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      file_path: filePath,
      uploaded_by: user.id,
      collection_id: collectionId || null,
      license,
      attribution: attribution.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Referencia agregada");
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Sumar referencia a la biblioteca</DialogTitle>
        <DialogDescription>
          Arrastrá el PDF acá abajo: leemos el documento y completamos la ficha automáticamente.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        {/* Dropzone */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <input
            type="file"
            id="bibfile"
            className="hidden"
            accept=".pdf,.epub"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label htmlFor="bibfile" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {reading ? (
              <><Loader2 className="h-6 w-6 animate-spin text-primary" /> Leyendo el documento…</>
            ) : (
              <>
                <Upload className="h-6 w-6 text-primary" />
                <span className="font-medium text-foreground">{file ? file.name : "Arrastrá el PDF/EPUB acá o hacé clic para elegirlo"}</span>
                <span className="text-xs flex items-center gap-1"><Sparkles className="h-3 w-3" /> La ficha se completa sola a partir del archivo</span>
              </>
            )}
          </label>
        </div>
        {file && !reading && (
          <Button variant="ghost" size="sm" onClick={() => autoRead(file)}>
            <Sparkles className="h-4 w-4 mr-1" /> Volver a leer el archivo
          </Button>
        )}
        <div className="space-y-1">
          <div className="flex gap-2">
            <Input
              placeholder="DOI o link del artículo (ej. https://ojs.ceil-conicet.gov.ar/...)"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookup(); } }}
            />
            <Button variant="outline" onClick={lookup} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reconocer"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pegá un DOI o el link de la publicación (OJS, SciELO, repositorios) y completamos la ficha automáticamente.
          </p>
        </div>
        <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Autores (separados por coma)" value={authors} onChange={(e) => setAuthors(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Año" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <select className="rounded-md border border-input bg-background px-3 text-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input placeholder="Revista" value={journal} onChange={(e) => setJournal(e.target.value)} />
        <Input placeholder="Editorial" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
        <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Textarea placeholder="Resumen / abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={3} />
        <Input placeholder="Etiquetas (separadas por coma)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Carpeta</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
          >
            <option value="">Sin carpeta</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <LicenseSelector
          value={license}
          onChange={setLicense}
          attribution={attribution}
          onAttributionChange={setAttribution}
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={busy || reading}>{busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Publicar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const ImportDialog = ({
  collections, defaultCollection, onClose,
}: { collections: LibraryCollection[]; defaultCollection: string | null; onClose: () => void }) => {
  const { user } = useAuth();
  const [refs, setRefs] = useState<ReturnType<typeof parseBibFile>>([]);
  const [collectionId, setCollectionId] = useState<string>(defaultCollection ?? "");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [license, setLicense] = useState<LicenseCode>(DEFAULT_LICENSE);

  const handleFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseBibFile(f.name, text);
    if (parsed.length === 0) return toast.error("No se reconocieron referencias en el archivo");
    setRefs(parsed);
    toast.success(`${parsed.length} referencias detectadas`);
  };

  const importAll = async () => {
    if (!user || refs.length === 0) return;
    setBusy(true);
    const rows = refs.map((r) => ({
      title: normalizeTitle(r.title),
      authors: r.authors.map((a) => normalizePersonName(a)),
      year: r.year,
      item_type: r.item_type,
      doi: r.doi,
      url: r.url,
      journal: r.journal,
      publisher: r.publisher,
      abstract: r.abstract,
      tags: r.tags,
      uploaded_by: user.id,
      collection_id: collectionId || null,
      license,
    }));
    const { error } = await supabase.from("library_items").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} referencias importadas`);
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Importar biblioteca desde Zotero</DialogTitle>
        <DialogDescription>
          En Zotero: clic derecho sobre la colección → «Exportar colección…» → formato <strong>BibTeX</strong>, <strong>RIS</strong> o CSV.
          Después arrastrá el archivo acá.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <input type="file" id="zoterofile" className="hidden" accept=".bib,.ris,.csv,.txt" onChange={(e) => handleFiles(e.target.files)} />
          <label htmlFor="zoterofile" className="cursor-pointer flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-6 w-6 text-primary" />
            <span className="font-medium text-foreground">Arrastrá el .bib / .ris / .csv acá o hacé clic</span>
          </label>
        </div>

        {refs.length > 0 && (
          <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
            {refs.map((r, i) => (
              <div key={i} className="p-2 text-sm">
                <p className="font-medium text-foreground line-clamp-1">{r.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {r.authors.join(", ")}{r.year ? ` · ${r.year}` : ""}{r.journal ? ` · ${r.journal}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Carpeta destino</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
          >
            <option value="">Sin carpeta</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <LicenseSelector value={license} onChange={setLicense} />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={importAll} disabled={busy || refs.length === 0}>
          {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Importar {refs.length || ""}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default LibraryPage;
