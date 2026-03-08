import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Layers, X } from "lucide-react";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type ActorType =
  | "producer"
  | "cooperative"
  | "social_kitchen"
  | "restaurant"
  | "retail"
  | "institution"
  | "logistics"
  | "processing";

interface MapActor {
  id: number;
  name: string;
  type: ActorType;
  lat: number;
  lng: number;
  products: string[];
  certification: "red" | "yellow" | "green";
  description: string;
}

const actorTypeLabels: Record<ActorType, string> = {
  producer: "Productor",
  cooperative: "Cooperativa",
  social_kitchen: "Comedor Comunitario",
  restaurant: "Restaurante",
  retail: "Comercio",
  institution: "Institución",
  logistics: "Logística",
  processing: "Procesamiento",
};

const actorTypeColors: Record<ActorType, string> = {
  producer: "#2d6a4f",
  cooperative: "#40916c",
  social_kitchen: "#e07a5f",
  restaurant: "#f2cc8f",
  retail: "#81b29a",
  institution: "#3d405b",
  logistics: "#f4a261",
  processing: "#264653",
};

const certColors = {
  red: "bg-destructive text-destructive-foreground",
  yellow: "bg-wheat text-wheat-foreground",
  green: "bg-primary text-primary-foreground",
};

const certLabels = { red: "Básico", yellow: "En proceso", green: "Certificado" };

// Mock data - Argentina-centered
const mockActors: MapActor[] = [
  { id: 1, name: "Finca La Esperanza", type: "producer", lat: -34.61, lng: -58.38, products: ["Tomate", "Lechuga", "Acelga"], certification: "green", description: "Producción agroecológica familiar, 5 hectáreas." },
  { id: 2, name: "Cooperativa Del Sol", type: "cooperative", lat: -34.65, lng: -58.50, products: ["Miel", "Frutas", "Hierbas"], certification: "green", description: "15 familias productoras asociadas." },
  { id: 3, name: "Comedor Los Pibes", type: "social_kitchen", lat: -34.58, lng: -58.42, products: ["Verduras", "Legumbres"], certification: "yellow", description: "Comedor comunitario, 200 raciones diarias." },
  { id: 4, name: "Restaurante Raíz", type: "restaurant", lat: -34.60, lng: -58.37, products: ["Verduras de hoja", "Huevos"], certification: "yellow", description: "Restaurante orgánico de autor." },
  { id: 5, name: "Almacén Natural", type: "retail", lat: -34.62, lng: -58.44, products: ["Harinas", "Conservas", "Lácteos"], certification: "green", description: "Dietética y productos naturales." },
  { id: 6, name: "Escuela N°42", type: "institution", lat: -34.57, lng: -58.46, products: ["Frutas", "Verduras"], certification: "red", description: "Comedor escolar, 350 alumnos." },
  { id: 7, name: "Transporte El Surco", type: "logistics", lat: -34.70, lng: -58.30, products: [], certification: "yellow", description: "Fletes refrigerados para alimentos frescos." },
  { id: 8, name: "Molino Agroeco", type: "processing", lat: -34.55, lng: -58.52, products: ["Harina de trigo", "Harina de maíz"], certification: "green", description: "Molienda artesanal, 2 ton/día." },
  { id: 9, name: "Huerta Don Pedro", type: "producer", lat: -34.68, lng: -58.55, products: ["Zapallo", "Choclo", "Papa"], certification: "yellow", description: "Producción en transición agroecológica." },
  { id: 10, name: "Granja El Retiro", type: "producer", lat: -34.50, lng: -58.60, products: ["Huevos", "Pollo", "Cerdos"], certification: "green", description: "Granja integral, animales a campo." },
  { id: 11, name: "Coop. Tierra Viva", type: "cooperative", lat: -34.72, lng: -58.35, products: ["Verduras", "Plantines", "Semillas"], certification: "green", description: "Cooperativa de la agricultura familiar." },
  { id: 12, name: "Bar Cosecha", type: "restaurant", lat: -34.59, lng: -58.40, products: ["Frutas", "Verduras"], certification: "red", description: "Bar con carta de origen local." },
];

const createIcon = (type: ActorType) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${actorTypeColors[type]};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const MapPage = () => {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<ActorType>>(new Set(Object.keys(actorTypeLabels) as ActorType[]));
  const [showFilters, setShowFilters] = useState(true);

  const toggleType = (type: ActorType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return mockActors.filter((a) => {
      if (!activeTypes.has(a.type)) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.products.some((p) => p.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [activeTypes, search]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col lg:flex-row">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? "w-full lg:w-80" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border bg-card flex-shrink-0`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-card-foreground">Filtros</h2>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto o actor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de actor</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(actorTypeLabels) as [ActorType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleType(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeTypes.has(key)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span style={{ background: actorTypeColors[key] }} className="w-2.5 h-2.5 rounded-full inline-block" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Certificación</p>
              <div className="flex gap-2">
                {(["green", "yellow", "red"] as const).map((c) => (
                  <span key={c} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${certColors[c]}`}>
                    {certLabels[c]}
                  </span>
                ))}
              </div>
            </div>

            {/* Actor list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground">{filtered.length} resultados</p>
              {filtered.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{actorTypeLabels[a.type]}</p>
                    </div>
                    <span className={`inline-flex w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                      a.certification === "green" ? "bg-primary" : a.certification === "yellow" ? "bg-wheat" : "bg-destructive"
                    }`} />
                  </div>
                  {a.products.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.products.slice(0, 3).map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          {!showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 left-4 z-[1000] bg-card shadow-card"
              onClick={() => setShowFilters(true)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
          )}
          <MapContainer
            center={[-34.61, -58.44]}
            zoom={12}
            className="h-[calc(100vh-4rem)] w-full z-0"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((a) => (
              <Marker key={a.id} position={[a.lat, a.lng]} icon={createIcon(a.type)}>
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-bold text-sm">{a.name}</p>
                    <p className="text-xs text-gray-500">{actorTypeLabels[a.type]}</p>
                    <p className="text-xs mt-1">{a.description}</p>
                    {a.products.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.products.map((p) => (
                          <span key={p} className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        a.certification === "green" ? "bg-green-500" : a.certification === "yellow" ? "bg-yellow-400" : "bg-red-500"
                      }`} />
                      <span className="text-[10px]">{certLabels[a.certification]}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
