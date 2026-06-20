import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, MapPin, Sprout, Users, Heart, UtensilsCrossed,
  Store, Building2, Truck, Factory, ShieldCheck, Mail,
  ClipboardCheck, Droplets, Leaf, FlaskConical, Eye, FileText, ExternalLink,
  Recycle, Microscope, Handshake, Trees, ShoppingBasket, User, HeartHandshake,
  Network, Apple, Carrot, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import rutasSanas from "@/data/rutasSanas.json";
import { useLayerActors } from "@/hooks/useLayerActors";

type ActorType =
  | "producer" | "cooperative" | "social_kitchen" | "restaurant" | "retail"
  | "institution" | "logistics" | "processing"
  | "agroecological_node" | "seed_bank" | "composting_center" | "research_center"
  | "solidarity_intermediary" | "community_garden" | "consumer_node"
  | "individual_consumer" | "food_bank" | "consumer_cooperative" | "community_org"
  | "health_food_store" | "agroecological_store" | "agroecological_fair"
  | "agroecological_market" | "bio_input_supplier";
type CertLevel = "red" | "yellow" | "green" | "none_spg";

interface Actor {
  id: number;
  name: string;
  type: ActorType;
  location: string;
  description: string;
}

interface SPG {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  peer_visit_count: number;
  evaluation_form_url: string | null;
  methodology: string | null;
}

interface SPGEvaluation {
  id: string;
  evaluation_type: string;
  title: string;
  result: string | null;
  notes: string | null;
  evaluated_at: string | null;
}

const evalTypeIcons: Record<string, typeof Droplets> = {
  suelo: FlaskConical,
  agua: Droplets,
  biodiversidad: Leaf,
  condiciones_laborales: Users,
};

// Fallback used until DB data loads. Rutas Sanas now lives in `layer_actors`.
const fallbackRealActors: Actor[] = (rutasSanas as Array<{n:string;lat:number;lng:number;t:string;f:string;d:string}>).map((p, i) => {
  // Extract a short location heuristically (first comma-separated chunk of d, fallback to f)
  const locGuess = (p.d || "").split(/[-–|]/)[0].trim().split(",").slice(0, 2).join(",").slice(0, 60);
  return {
    id: i + 1,
    name: p.n,
    type: p.t as ActorType,
    location: locGuess || p.f || "—",
    description: p.d || p.f || "",
  };
});

const knownSpgs = [
  { name: "SPG FCAL-UNER", region: "Entre Ríos", description: "Sistema Participativo de Garantía de la Facultad de Ciencias de la Alimentación de la Universidad Nacional de Entre Ríos.", url: "https://www.fcal.uner.edu.ar/spg/" },
  { name: "Red SPG Buenos Aires", region: "Buenos Aires", description: "Red de certificación participativa del Gran Buenos Aires, articulando productores y consumidores.", url: null },
  { name: "SPG Rosario", region: "Santa Fe", description: "Sistema participativo que certifica productores del cinturón hortícola de Rosario.", url: null },
];

const ActorsPage = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ActorType | "all">("all");
  const [activeTab, setActiveTab] = useState<"actors" | "spg">("actors");
  const [selectedSpgId, setSelectedSpgId] = useState<string | null>(null);
  const [spgData, setSpgData] = useState<SPG | null>(null);
  const [spgEvals, setSpgEvals] = useState<SPGEvaluation[]>([]);
  const [loadingSpg, setLoadingSpg] = useState(false);
  const [dbSpgs, setDbSpgs] = useState<SPG[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { actors: rsDb } = useLayerActors("rutas_sanas");
  const realActors: Actor[] = useMemo(() => {
    if (!rsDb || rsDb.length === 0) return fallbackRealActors;
    return rsDb.map((p, i) => {
      const locGuess = (p.description || "").split(/[-–|]/)[0].trim().split(",").slice(0, 2).join(",").slice(0, 60);
      return {
        id: i + 1,
        name: p.name,
        type: (p.actor_type as ActorType) || "consumer_node",
        location: locGuess || p.family || "—",
        description: p.description || p.family || "",
      } as Actor;
    });
  }, [rsDb]);

  const typeConfig: Record<ActorType, { label: string; icon: typeof Sprout }> = {
    producer: { label: t("actor.producer"), icon: Sprout },
    cooperative: { label: t("actor.cooperative"), icon: Users },
    social_kitchen: { label: t("actor.social_kitchen"), icon: Heart },
    restaurant: { label: t("actor.restaurant"), icon: UtensilsCrossed },
    retail: { label: t("actor.retail"), icon: Store },
    institution: { label: t("actor.institution"), icon: Building2 },
    logistics: { label: t("actor.logistics"), icon: Truck },
    processing: { label: t("actor.processing"), icon: Factory },
    agroecological_node: { label: "Nodo Agroecológico", icon: Network },
    seed_bank: { label: "Banco de Semillas", icon: Sprout },
    composting_center: { label: "Centro de Compostaje", icon: Recycle },
    research_center: { label: "Centro de Investigación", icon: Microscope },
    solidarity_intermediary: { label: "Intermediario Solidario", icon: Handshake },
    community_garden: { label: "Huerta Comunitaria", icon: Trees },
    consumer_node: { label: "Nodo de Consumo", icon: ShoppingBasket },
    individual_consumer: { label: "Consumidor/a", icon: User },
    food_bank: { label: "Banco de Alimentos", icon: Apple },
    consumer_cooperative: { label: "Coop. de Consumo", icon: HeartHandshake },
    community_org: { label: "Org. Comunitaria", icon: Users },
    health_food_store: { label: "Dietética", icon: Store },
    agroecological_store: { label: "Almacén Agroecológico", icon: Store },
    agroecological_fair: { label: "Feria Agroecológica", icon: ShoppingBasket },
    agroecological_market: { label: "Mercado Agroecológico", icon: ShoppingBasket },
    bio_input_supplier: { label: "Bio-insumos", icon: Carrot },
  };

  const certConfig: Record<CertLevel, { label: string; classes: string }> = {
    red: { label: t("cert.red"), classes: "bg-destructive/10 text-destructive" },
    yellow: { label: t("cert.yellow"), classes: "bg-wheat/20 text-wheat-foreground" },
    green: { label: t("cert.green"), classes: "bg-primary/10 text-primary" },
    none_spg: { label: t("cert.none_spg"), classes: "bg-muted text-muted-foreground" },
  };

  const filtered = useMemo(() => {
    return realActors.filter((a) => {
      if (activeType !== "all" && a.type !== activeType) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, activeType]);

  useEffect(() => { setPage(1); }, [search, activeType]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageActors = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Active types ordered by count, for nicer filter chips
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ActorType, number>> = {};
    realActors.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, []);
  const orderedTypes = useMemo(
    () => (Object.keys(typeConfig) as ActorType[])
      .filter(k => (typeCounts[k] || 0) > 0)
      .sort((a, b) => (typeCounts[b] || 0) - (typeCounts[a] || 0)),
    [typeCounts, typeConfig]
  );

  // Helpers to extract contact info from description text
  const extractEmail = (s: string) => s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const extractUrl = (s: string) => s.match(/https?:\/\/[^\s)<]+/)?.[0];

  useEffect(() => {
    supabase.from("spgs").select("*").then(({ data }) => {
      if (data) setDbSpgs(data as SPG[]);
    });
  }, []);

  useEffect(() => {
    if (!selectedSpgId) return;
    setLoadingSpg(true);
    Promise.all([
      supabase.from("spgs").select("*").eq("id", selectedSpgId).single(),
      supabase.from("spg_evaluations").select("*").eq("spg_id", selectedSpgId).order("evaluated_at", { ascending: false }),
    ]).then(([spgRes, evalsRes]) => {
      if (spgRes.data) setSpgData(spgRes.data as SPG);
      if (evalsRes.data) setSpgEvals(evalsRes.data as SPGEvaluation[]);
      setLoadingSpg(false);
    });
  }, [selectedSpgId]);

  const closeSpgModal = () => {
    setSelectedSpgId(null);
    setSpgData(null);
    setSpgEvals([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-earth py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-white mb-2">{t("actors.title")}</h1>
            <p className="text-white/70 max-w-xl">{t("actors.subtitle")}</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("actors")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "actors"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1.5" />
              Miembros de la Red
            </button>
            <button
              onClick={() => setActiveTab("spg")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "spg"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4 inline mr-1.5" />
              Certificación Participativa (SPG)
            </button>
          </div>

          {activeTab === "actors" && (
            <>
              {/* Big search */}
              <div className="max-w-3xl mx-auto mb-6">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/70 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar por nombre, lugar o descripción..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-14 h-14 text-base rounded-2xl border-2 border-border bg-card shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary placeholder:text-muted-foreground/70"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  <span className="font-semibold text-foreground">{filtered.length}</span> miembros{search && <> para "<span className="italic">{search}</span>"</>}
                </p>
              </div>

              {/* Type filter chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                <button onClick={() => setActiveType("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeType === "all" ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}>
                  Todos <span className="opacity-70">· {realActors.length}</span>
                </button>
                {orderedTypes.map((key) => {
                  const cfg = typeConfig[key];
                  return (
                    <button key={key} onClick={() => setActiveType(key)}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        activeType === key ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}>
                      <cfg.icon className="h-3.5 w-3.5" />{cfg.label}
                      <span className="opacity-70">· {typeCounts[key]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pageActors.map((a, i) => {
                  const cfg = typeConfig[a.type];
                  const email = extractEmail(a.description);
                  const url = extractUrl(a.description);
                  return (
                    <motion.article key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03 }}
                      className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">
                      <div className="h-1.5 bg-gradient-to-r from-primary via-leaf to-wheat" />
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                            <cfg.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-base leading-tight text-card-foreground line-clamp-2">{a.name}</h3>
                            <Badge variant="secondary" className="text-[10px] mt-1.5">{cfg.label}</Badge>
                          </div>
                        </div>

                        {a.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
                            <span className="truncate">{a.location}</span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{a.description}</p>

                        {(email || url) && (
                          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                            {email && (
                              <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                                <Mail className="h-3 w-3" /> {email}
                              </a>
                            )}
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium">
                                <ExternalLink className="h-3 w-3" /> Sitio
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
                {pageActors.length === 0 && (
                  <p className="col-span-full text-center text-sm text-muted-foreground py-12">Sin miembros que coincidan con la búsqueda.</p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground px-3">
                    Página <span className="font-semibold text-foreground">{page}</span> de {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === "spg" && (
            <div className="space-y-8">
              {/* What is SPG */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-8">
                <h2 className="font-display text-2xl text-card-foreground mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  ¿Qué es un SPG?
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Un <strong className="text-foreground">Sistema Participativo de Garantía (SPG)</strong> es un mecanismo de certificación agroecológica basado en la confianza, la participación y el conocimiento local. 
                  A diferencia de las certificaciones convencionales (de tercera parte), los SPG involucran a productores, consumidores, técnicos y organizaciones de la comunidad en la verificación de las prácticas agroecológicas.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Los SPG se basan en visitas de pares, evaluaciones colectivas y procesos de aprendizaje mutuo. Son reconocidos internacionalmente por IFOAM y promueven la soberanía alimentaria, la transparencia y la relación directa entre quien produce y quien consume.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
                    <p className="text-2xl font-display text-primary">{dbSpgs.length || knownSpgs.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">SPGs registrados</p>
                  </div>
                  <div className="rounded-lg bg-wheat/10 border border-wheat/20 p-4 text-center">
                    <p className="text-2xl font-display text-wheat">Visitas de pares</p>
                    <p className="text-xs text-muted-foreground mt-1">Metodología central</p>
                  </div>
                  <div className="rounded-lg bg-earth/10 border border-earth/20 p-4 text-center">
                    <p className="text-2xl font-display text-earth">Comunitario</p>
                    <p className="text-xs text-muted-foreground mt-1">Basado en confianza</p>
                  </div>
                </div>
              </motion.div>

              {/* SPG Directory */}
              <div>
                <h3 className="font-display text-xl text-foreground mb-4">SPGs activos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {knownSpgs.map((spg, i) => (
                    <motion.div key={spg.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display text-base text-card-foreground">{spg.name}</h4>
                          {spg.region && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" /> {spg.region}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{spg.description}</p>
                      {spg.url && (
                        <a href={spg.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                          <ExternalLink className="h-3.5 w-3.5" /> Visitar sitio web
                        </a>
                      )}
                    </motion.div>
                  ))}

                  {dbSpgs.map((spg, i) => (
                    <motion.div key={spg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (knownSpgs.length + i) * 0.08 }}
                      className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display text-base text-card-foreground">{spg.name}</h4>
                          {spg.region && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" /> {spg.region}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{spg.description}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedSpgId(spg.id)}>
                          <Eye className="h-3 w-3 mr-1" /> Ver detalle
                        </Button>
                        {spg.evaluation_form_url && (
                          <a href={spg.evaluation_form_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                            <ExternalLink className="h-3 w-3" /> Sitio web
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* SPG Detail Modal */}
      <Dialog open={!!selectedSpgId} onOpenChange={(open) => !open && closeSpgModal()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {loadingSpg ? t("spg.loading") : spgData?.name}
            </DialogTitle>
          </DialogHeader>

          {spgData && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">{spgData.description}</p>
                {spgData.region && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <MapPin className="h-3 w-3" /> {spgData.region}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-display text-primary">{spgData.peer_visit_count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("spg.peer_visits")}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-display text-primary">{spgEvals.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("spg.evaluations_done")}</p>
                </div>
              </div>

              {spgData.methodology && (
                <div>
                  <h4 className="font-medium text-sm text-card-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" /> {t("spg.methodology")}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{spgData.methodology}</p>
                </div>
              )}

              {spgData.evaluation_form_url && (
                <div>
                  <h4 className="font-medium text-sm text-card-foreground mb-2">{t("spg.eval_form")}</h4>
                  <a href={spgData.evaluation_form_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary underline hover:text-primary/80 transition-colors">
                    {t("spg.view_form")}
                  </a>
                </div>
              )}

              {spgEvals.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-card-foreground mb-3 flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4 text-primary" /> {t("spg.evaluations")}
                  </h4>
                  <div className="space-y-3">
                    {spgEvals.map((ev) => {
                      const EvalIcon = evalTypeIcons[ev.evaluation_type] || FlaskConical;
                      const evalLabel = t(`eval.${ev.evaluation_type}`) || ev.evaluation_type;
                      return (
                        <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="rounded-lg border border-border p-4 hover:bg-muted/20 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <EvalIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-card-foreground">{ev.title}</p>
                                <p className="text-[10px] text-muted-foreground">{evalLabel}</p>
                              </div>
                            </div>
                            {ev.result && (<Badge variant="secondary" className="text-[10px] flex-shrink-0">{ev.result}</Badge>)}
                          </div>
                          {ev.notes && (<p className="text-xs text-muted-foreground mt-2 ml-10">{ev.notes}</p>)}
                          {ev.evaluated_at && (
                            <p className="text-[10px] text-muted-foreground mt-1 ml-10">
                              {new Date(ev.evaluated_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActorsPage;
