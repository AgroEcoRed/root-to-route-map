import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, Search, ExternalLink, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";

interface GovProgram {
  id: string;
  country: string;
  region: string | null;
  city: string | null;
  name: string;
  organization: string | null;
  description: string | null;
  url: string;
  topics: string[];
  source: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", BR: "Brasil", UY: "Uruguay", CL: "Chile", MX: "México",
  CO: "Colombia", PE: "Perú", EC: "Ecuador", BO: "Bolivia", PY: "Paraguay",
};

const ProgramsPage = () => {
  const [items, setItems] = useState<GovProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>("AR");

  useEffect(() => {
    supabase.from("gov_programs").select("*").order("country").then(({ data, error }) => {
      if (!error) setItems((data ?? []) as GovProgram[]);
      setLoading(false);
    });
  }, []);

  const countries = useMemo(() => Array.from(new Set(items.map((i) => i.country))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      if (country && it.country !== country) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q) ||
        it.organization?.toLowerCase().includes(q) ||
        it.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, country]);

  const grouped = useMemo(() => {
    const m = new Map<string, GovProgram[]>();
    filtered.forEach((p) => {
      const arr = m.get(p.country) ?? [];
      arr.push(p);
      m.set(p.country, arr);
    });
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <motion.div className="text-center max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider px-4 py-1 rounded-full bg-secondary/10 mb-3">
              Programas públicos · Argentina
            </span>
            <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-3 flex items-center justify-center gap-3">
              <Landmark className="h-8 w-8 text-primary" /> Políticas públicas para la agroecología en Argentina
            </h1>
            <p className="text-muted-foreground">
              Catálogo curado de programas y leyes vigentes a nivel nacional y provincial (con foco inicial en la Provincia de Buenos Aires). A medida que la red crezca en otros países de la región, se irán sumando sus políticas públicas.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container max-w-6xl">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar programa, organismo, tema…" className="pl-9" />
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={country ?? ""} onChange={(e) => setCountry(e.target.value || null)}>
              <option value="">Todos los países</option>
              {countries.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-8">
              {grouped.map(([cc, progs]) => (
                <div key={cc}>
                  <h2 className="font-display text-xl text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> {COUNTRY_NAMES[cc] ?? cc}
                    <span className="text-sm text-muted-foreground font-sans">({progs.length})</span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {progs.map((p) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="block border border-border rounded-xl p-4 bg-card hover:border-primary hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors">{p.name}</h3>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                        {p.organization && <p className="text-xs text-muted-foreground mb-2">{p.organization}{p.region ? ` · ${p.region}` : ""}</p>}
                        {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                        {p.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.topics.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                            ))}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && (
                <p className="text-center text-muted-foreground py-12">No hay programas con esos filtros.</p>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ProgramsPage;