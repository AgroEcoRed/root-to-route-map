import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Sprout, Users, Heart, UtensilsCrossed,
  Store, Building2, Truck, Factory, ShieldCheck, Mail
} from "lucide-react";
import { motion } from "framer-motion";

type ActorType = "producer" | "cooperative" | "social_kitchen" | "restaurant" | "retail" | "institution" | "logistics" | "processing";

interface Actor {
  id: number;
  name: string;
  type: ActorType;
  location: string;
  certification: "red" | "yellow" | "green";
  description: string;
  products: string[];
  capacity: string;
}

const typeConfig: Record<ActorType, { label: string; icon: typeof Sprout }> = {
  producer: { label: "Productor", icon: Sprout },
  cooperative: { label: "Cooperativa", icon: Users },
  social_kitchen: { label: "Comedor", icon: Heart },
  restaurant: { label: "Restaurante", icon: UtensilsCrossed },
  retail: { label: "Comercio", icon: Store },
  institution: { label: "Institución", icon: Building2 },
  logistics: { label: "Logística", icon: Truck },
  processing: { label: "Procesamiento", icon: Factory },
};

const certConfig = {
  red: { label: "Básico", classes: "bg-destructive/10 text-destructive" },
  yellow: { label: "En proceso", classes: "bg-wheat/20 text-wheat-foreground" },
  green: { label: "Certificado", classes: "bg-primary/10 text-primary" },
};

const actors: Actor[] = [
  { id: 1, name: "Finca La Esperanza", type: "producer", location: "La Plata, Buenos Aires", certification: "green", description: "Producción agroecológica familiar en 5 hectáreas con rotación de cultivos y manejo integrado.", products: ["Tomate", "Lechuga", "Acelga"], capacity: "2 ton/mes" },
  { id: 2, name: "Cooperativa Del Sol", type: "cooperative", location: "Florencio Varela", certification: "green", description: "15 familias productoras asociadas para comercialización conjunta.", products: ["Miel", "Frutas", "Conservas"], capacity: "5 ton/mes" },
  { id: 3, name: "Comedor Los Pibes", type: "social_kitchen", location: "La Matanza", certification: "yellow", description: "Comedor comunitario que sirve 200 raciones diarias.", products: ["Verduras", "Legumbres"], capacity: "200 raciones/día" },
  { id: 4, name: "Restaurante Raíz", type: "restaurant", location: "CABA, Palermo", certification: "yellow", description: "Restaurante de autor con menú 100% origen local.", products: ["Verduras de hoja", "Huevos"], capacity: "80 cubiertos/día" },
  { id: 5, name: "Almacén Natural", type: "retail", location: "CABA, Caballito", certification: "green", description: "Dietética y almacén de productos agroecológicos.", products: ["Harinas", "Conservas", "Lácteos"], capacity: "Retail" },
  { id: 6, name: "Escuela N°42", type: "institution", location: "Quilmes", certification: "red", description: "Comedor escolar para 350 alumnos.", products: ["Frutas", "Verduras"], capacity: "350 raciones/día" },
  { id: 7, name: "Transporte El Surco", type: "logistics", location: "Avellaneda", certification: "yellow", description: "Fletes refrigerados para alimentos frescos.", products: [], capacity: "3 camiones" },
  { id: 8, name: "Molino Agroeco", type: "processing", location: "Luján", certification: "green", description: "Molienda artesanal de cereales agroecológicos.", products: ["Harina de trigo", "Harina de maíz"], capacity: "2 ton/día" },
  { id: 9, name: "Granja El Retiro", type: "producer", location: "San Vicente", certification: "green", description: "Granja integral con animales a campo y huerta.", products: ["Huevos", "Pollo", "Cerdos"], capacity: "500 docenas/mes" },
  { id: 10, name: "Coop. Tierra Viva", type: "cooperative", location: "Cañuelas", certification: "green", description: "Cooperativa de la agricultura familiar periurbana.", products: ["Verduras", "Plantines", "Semillas"], capacity: "8 ton/mes" },
];

const ActorsPage = () => {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ActorType | "all">("all");

  const filtered = useMemo(() => {
    return actors.filter((a) => {
      if (activeType !== "all" && a.type !== activeType) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeType]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-earth py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-earth-foreground mb-2">Red de Actores</h1>
            <p className="text-earth-foreground/70 max-w-xl">
              Directorio de productores, compradores, logística e infraestructura del ecosistema agroecológico.
            </p>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar actor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveType("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeType === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              Todos
            </button>
            {(Object.entries(typeConfig) as [ActorType, typeof typeConfig.producer][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeType === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                <cfg.icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((a, i) => {
              const cfg = typeConfig[a.type];
              const cert = certConfig[a.certification];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <cfg.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg text-card-foreground">{a.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{cfg.label}</Badge>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cert.classes}`}>
                          <ShieldCheck className="h-3 w-3" />
                          {cert.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-3">{a.description}</p>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                    <MapPin className="h-3 w-3" /> {a.location}
                  </div>

                  {a.products.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {a.products.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">Cap: {a.capacity}</span>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" /> Contactar
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ActorsPage;
