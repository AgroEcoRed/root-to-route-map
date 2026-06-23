import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Upload, Download, Search, Tag, FileText, ExternalLink, Loader2, Plus } from "lucide-react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import type { LibraryItem } from "@/types/library";
import { toBibtex, toCsv, downloadFile } from "@/lib/bibtex";
import { TAG_LABELS, CURATED_TAG_SLUGS, tagLabel } from "@/lib/libraryTags";
import LicenseSelector from "@/components/LicenseSelector";
import LicenseBadge from "@/components/LicenseBadge";
import { DEFAULT_LICENSE, LicenseCode } from "@/lib/licenses";

const ITEM_TYPES = ["article", "book", "thesis", "report", "chapter", "web"];

const fetchDoiMeta = async (doi: string) => {
  try {
    const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!r.ok) return null;
    const j = await r.json();
    const m = j.message;
    return {
      title: m.title?.[0] ?? "",
      authors: (m.author ?? []).map((a: any) => `${a.given ?? ""} ${a.family ?? ""}`.trim()),
      year: m.issued?.["date-parts"]?.[0]?.[0] ?? null,
      journal: m["container-title"]?.[0] ?? "",
      publisher: m.publisher ?? "",
      abstract: m.abstract?.replace(/<[^>]+>/g, "") ?? "",
      url: m.URL ?? "",
      item_type: m.type?.includes("book") ? "book" : "article",
    };
  } catch {
    return null;
  }
};

const LibraryPage = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      if (tagFilter && !it.tags?.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.authors?.some((a) => a.toLowerCase().includes(q)) ||
        it.abstract?.toLowerCase().includes(q) ||
        it.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, tagFilter]);

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
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Sumar referencia</Button>
                </DialogTrigger>
                <UploadDialog onClose={() => { setOpen(false); load(); }} />
              </Dialog>
            ) : (
              <Button asChild><Link to="/ingresar"><Upload className="h-4 w-4 mr-1" /> Ingresá para subir</Link></Button>
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
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

const ItemCard = ({ item }: { item: LibraryItem }) => {
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
          <div className="mt-2">
            <LicenseBadge code={item.license} attribution={item.attribution} />
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

const UploadDialog = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [doi, setDoi] = useState("");
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState<string>("");
  const [itemType, setItemType] = useState("article");
  const [url, setUrl] = useState("");
  const [journal, setJournal] = useState("");
  const [abstract, setAbstract] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [license, setLicense] = useState<LicenseCode>(DEFAULT_LICENSE);
  const [attribution, setAttribution] = useState("");

  const lookup = async () => {
    if (!doi.trim()) return;
    setBusy(true);
    const meta = await fetchDoiMeta(doi.trim());
    setBusy(false);
    if (!meta) return toast.error("No se encontraron metadatos para ese DOI");
    setTitle(meta.title);
    setAuthors(meta.authors.join(", "));
    setYear(meta.year ? String(meta.year) : "");
    setJournal(meta.journal);
    setUrl(meta.url);
    setAbstract(meta.abstract);
    setItemType(meta.item_type);
    toast.success("Metadatos importados");
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
      title: title.trim(),
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      year: year ? Number(year) : null,
      item_type: itemType,
      doi: doi.trim() || null,
      url: url.trim() || null,
      journal: journal.trim() || null,
      abstract: abstract.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      file_path: filePath,
      uploaded_by: user.id,
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
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="DOI (opcional, autocompleta)" value={doi} onChange={(e) => setDoi(e.target.value)} />
          <Button variant="outline" onClick={lookup} disabled={busy}>Buscar DOI</Button>
        </div>
        <Input placeholder="Título *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Autores (separados por coma)" value={authors} onChange={(e) => setAuthors(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Año" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <select className="rounded-md border border-input bg-background px-3 text-sm" value={itemType} onChange={(e) => setItemType(e.target.value)}>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input placeholder="Revista / Editorial" value={journal} onChange={(e) => setJournal(e.target.value)} />
        <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Textarea placeholder="Resumen / abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={3} />
        <Input placeholder="Etiquetas (separadas por coma)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <input type="file" id="bibfile" className="hidden" accept=".pdf,.epub" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <label htmlFor="bibfile" className="cursor-pointer text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" /> {file ? file.name : "Adjuntar PDF/EPUB (opcional)"}
          </label>
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
        <Button onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Publicar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default LibraryPage;