import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MapPin, ShieldCheck, Users, Activity, Sprout } from "lucide-react";

type Stats = {
  totalActors: number;
  totalLayerActors: number;
  totalProducts: number;
  totalLibraryItems: number;
  spgGreen: number;
  spgYellow: number;
  spgRed: number;
};

const initial: Stats = {
  totalActors: 0,
  totalLayerActors: 0,
  totalProducts: 0,
  totalLibraryItems: 0,
  spgGreen: 0,
  spgYellow: 0,
  spgRed: 0,
};

const ObservatorioPage = () => {
  const [stats, setStats] = useState<Stats>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profiles, layers, products, library, green, yellow, red] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("layer_actors").select("*", { count: "exact", head: true }),
          supabase.from("mtr_products").select("*", { count: "exact", head: true }),
          supabase.from("library_items").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("certification", "green"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("certification", "yellow"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("certification", "red"),
        ]);
        setStats({
          totalActors: profiles.count ?? 0,
          totalLayerActors: layers.count ?? 0,
          totalProducts: products.count ?? 0,
          totalLibraryItems: library.count ?? 0,
          spgGreen: green.count ?? 0,
          spgYellow: yellow.count ?? 0,
          spgRed: red.count ?? 0,
        });
      } catch (err) {
        console.error("[observatorio] stats error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalSpg = stats.spgGreen + stats.spgYellow + stats.spgRed;
  const verifiedPct = totalSpg > 0 ? Math.round((stats.spgGreen / totalSpg) * 100) : 0;

  const cards = [
    { icon: Users, label: "Actorxs registradxs", value: stats.totalActors, color: "text-emerald-600" },
    { icon: MapPin, label: "Actores en capas", value: stats.totalLayerActors, color: "text-sky-600" },
    { icon: Sprout, label: "Productos en mercado", value: stats.totalProducts, color: "text-amber-600" },
    { icon: BarChart3, label: "Saberes en biblioteca", value: stats.totalLibraryItems, color: "text-violet-600" },
    { icon: ShieldCheck, label: "% SPG verificado", value: `${verifiedPct}%`, color: "text-green-700" },
    { icon: Activity, label: "En transición (SPG amarillo)", value: stats.spgYellow, color: "text-yellow-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            Observatorio Agroecológico
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">
            Indicadores del ecosistema
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Métricas vivas del ecosistema agroecológico mapeado en AgroEco.Red.
            Datos derivados de actores registradxs, mercado, biblioteca y procesos de Garantías Participativas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-elevated transition-shadow"
            >
              <c.icon className={`h-7 w-7 mb-3 ${c.color}`} />
              <p className="text-3xl font-display text-foreground mb-1">
                {loading ? "…" : c.value}
              </p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-muted/40 border border-border">
          <h2 className="font-display text-xl mb-2">Próximas capas del Observatorio</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Distribución geográfica por provincia y región.</li>
            <li>Línea de tiempo de transiciones agroecológicas registradas.</li>
            <li>Mapa de calor de ferias y nodos de comercialización.</li>
            <li>Indicadores de género, edad y composición de los SPG.</li>
            <li>Apertura de datos vía API pública para investigación.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ObservatorioPage;