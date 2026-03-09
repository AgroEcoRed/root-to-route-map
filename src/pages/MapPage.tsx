import { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ArrowUp, ArrowDown, Minus } from "lucide-react";

type ActorType =
  | "producer"
  | "cooperative"
  | "social_kitchen"
  | "restaurant"
  | "retail"
  | "institution"
  | "logistics"
  | "processing"
  | "agroecological_node"
  | "seed_bank"
  | "composting_center"
  | "research_center"
  | "solidarity_intermediary"
  | "community_garden"
  | "consumer_node"
  | "individual_consumer"
  | "food_bank"
  | "consumer_cooperative"
  | "community_org"
  | "health_food_store"
  | "agroecological_store"
  | "agroecological_fair"
  | "agroecological_market";

type ActorRole = "oferta" | "demanda" | "servicio";

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
  agroecological_node: "Nodo Agroecológico",
  seed_bank: "Banco de Semillas",
  composting_center: "Centro de Compostaje",
  research_center: "Centro de Investigación",
  solidarity_intermediary: "Intermediario Solidario",
  community_garden: "Huerta Comunitaria",
  consumer_node: "Nodo de Consumidores",
  individual_consumer: "Consumidor Individual",
  food_bank: "Banco de Alimentos",
  consumer_cooperative: "Cooperativa de Consumo",
  community_org: "Org. Comunitaria",
  health_food_store: "Dietética",
  agroecological_store: "Almacén Agroecológico",
  agroecological_fair: "Feria Agroecológica",
  agroecological_market: "Mercado Agroecológico",
};

const actorRole: Record<ActorType, ActorRole> = {
  producer: "oferta",
  cooperative: "oferta",
  processing: "oferta",
  agroecological_node: "oferta",
  seed_bank: "oferta",
  composting_center: "oferta",
  research_center: "oferta",
  solidarity_intermediary: "oferta",
  community_garden: "oferta",
  restaurant: "demanda",
  social_kitchen: "demanda",
  institution: "demanda",
  retail: "demanda",
  consumer_node: "demanda",
  individual_consumer: "demanda",
  food_bank: "demanda",
  consumer_cooperative: "demanda",
  community_org: "demanda",
  health_food_store: "demanda",
  agroecological_store: "demanda",
  agroecological_fair: "demanda",
  agroecological_market: "demanda",
  logistics: "servicio",
};

const roleLabels: Record<ActorRole, string> = {
  oferta: "Ofrece",
  demanda: "Demanda",
  servicio: "Servicio",
};

const roleColors: Record<ActorRole, string> = {
  oferta: "#2d6a4f",
  demanda: "#c0392b",
  servicio: "#f4a261",
};

const roleBgClasses: Record<ActorRole, string> = {
  oferta: "bg-primary",
  demanda: "bg-destructive",
  servicio: "bg-wheat",
};

const roleBorderClasses: Record<ActorRole, string> = {
  oferta: "border-primary",
  demanda: "border-destructive",
  servicio: "border-wheat",
};

const certLabels = { red: "Básico", yellow: "En transición", green: "Certificado" };

const mockActors: MapActor[] = [
  // OFERTA — Productores
  { id: 1, name: "Finca La Esperanza", type: "producer", lat: -34.61, lng: -58.38, products: ["Tomate", "Lechuga", "Acelga"], certification: "green", description: "Producción agroecológica familiar, 5 hectáreas." },
  { id: 9, name: "Huerta Don Pedro", type: "producer", lat: -34.68, lng: -58.55, products: ["Zapallo", "Choclo", "Papa"], certification: "yellow", description: "Producción en transición agroecológica." },
  { id: 10, name: "Granja El Retiro", type: "producer", lat: -34.50, lng: -58.60, products: ["Huevos", "Pollo", "Cerdos"], certification: "green", description: "Granja integral, animales a campo." },
  // OFERTA — Cooperativas
  { id: 2, name: "Cooperativa Del Sol", type: "cooperative", lat: -34.65, lng: -58.50, products: ["Miel", "Frutas", "Hierbas"], certification: "green", description: "15 familias productoras asociadas." },
  { id: 11, name: "Coop. Tierra Viva", type: "cooperative", lat: -34.72, lng: -58.35, products: ["Verduras", "Plantines", "Semillas"], certification: "green", description: "Cooperativa de la agricultura familiar." },
  // OFERTA — Procesamiento
  { id: 8, name: "Molino Agroeco", type: "processing", lat: -34.55, lng: -58.52, products: ["Harina de trigo", "Harina de maíz"], certification: "green", description: "Molienda artesanal, 2 ton/día." },
  // OFERTA — Nodos Agroecológicos
  { id: 13, name: "Nodo Sur Agroecológico", type: "agroecological_node", lat: -34.73, lng: -58.42, products: ["Verduras", "Aromáticas", "Frutas"], certification: "green", description: "Red de 8 huertas comunitarias del sur." },
  { id: 14, name: "Nodo Oeste Productivo", type: "agroecological_node", lat: -34.63, lng: -58.62, products: ["Hortalizas", "Plantines"], certification: "yellow", description: "Articulación de productores periurbanos." },
  // OFERTA — Banco de Semillas
  { id: 15, name: "Semillero Nativo", type: "seed_bank", lat: -34.56, lng: -58.48, products: ["Semillas criollas", "Plantines nativos"], certification: "green", description: "Conservación de 200+ variedades criollas." },
  // OFERTA — Centro de Compostaje
  { id: 16, name: "Compostar BA", type: "composting_center", lat: -34.64, lng: -58.39, products: ["Compost", "Humus de lombriz"], certification: "yellow", description: "Procesamiento de residuos orgánicos urbanos." },
  // OFERTA — Centro de Investigación
  { id: 17, name: "INTA Agroecología", type: "research_center", lat: -34.52, lng: -58.45, products: ["Capacitación", "Asistencia técnica"], certification: "green", description: "Investigación en sistemas agroecológicos." },
  // DEMANDA — Restaurantes
  { id: 4, name: "Restaurante Raíz", type: "restaurant", lat: -34.60, lng: -58.37, products: ["Verduras de hoja", "Huevos"], certification: "yellow", description: "Restaurante orgánico de autor." },
  { id: 12, name: "Bar Cosecha", type: "restaurant", lat: -34.59, lng: -58.40, products: ["Frutas", "Verduras"], certification: "red", description: "Bar con carta de origen local." },
  // DEMANDA — Comedores
  { id: 3, name: "Comedor Los Pibes", type: "social_kitchen", lat: -34.58, lng: -58.42, products: ["Verduras", "Legumbres"], certification: "yellow", description: "Comedor comunitario, 200 raciones diarias." },
  // DEMANDA — Comercio
  { id: 5, name: "Almacén Natural", type: "retail", lat: -34.62, lng: -58.44, products: ["Harinas", "Conservas", "Lácteos"], certification: "green", description: "Dietética y productos naturales." },
  // DEMANDA — Instituciones
  { id: 6, name: "Escuela N°42", type: "institution", lat: -34.57, lng: -58.46, products: ["Frutas", "Verduras"], certification: "red", description: "Comedor escolar, 350 alumnos." },
  // DEMANDA — Nodos de Consumidores
  { id: 18, name: "Nodo Almagro Consume", type: "consumer_node", lat: -34.61, lng: -58.42, products: ["Bolsones", "Verduras", "Frutas"], certification: "green", description: "Grupo de 45 familias que compran juntas." },
  { id: 19, name: "Nodo Villa Crespo", type: "consumer_node", lat: -34.60, lng: -58.44, products: ["Verduras", "Lácteos", "Panificados"], certification: "yellow", description: "Nodo de consumo responsable, 30 familias." },
  // DEMANDA — Consumidores Individuales
  { id: 20, name: "María González", type: "individual_consumer", lat: -34.62, lng: -58.41, products: ["Verduras", "Huevos"], certification: "red", description: "Consumidora habitual de bolsones agroecológicos." },
  // DEMANDA — Banco de Alimentos
  { id: 21, name: "Banco de Alimentos BA", type: "food_bank", lat: -34.66, lng: -58.37, products: ["Verduras", "Frutas", "Secos"], certification: "yellow", description: "Redistribución a 150 comedores." },
  // DEMANDA — Cooperativa de Consumo
  { id: 22, name: "Coop. El Galpón", type: "consumer_cooperative", lat: -34.58, lng: -58.45, products: ["Verduras", "Lácteos", "Conservas"], certification: "green", description: "Cooperativa de consumo con 200 socios." },
  // DEMANDA — Org. Comunitaria
  { id: 23, name: "Centro Cultural Raíces", type: "community_org", lat: -34.67, lng: -58.48, products: ["Meriendas", "Viandas"], certification: "red", description: "Espacio cultural con merendero comunitario." },
  // DEMANDA — Dietética
  { id: 24, name: "Dietética Vida Sana", type: "health_food_store", lat: -34.60, lng: -58.43, products: ["Orgánicos", "Sin TACC", "Suplementos"], certification: "green", description: "Dietética especializada en productos agroecológicos." },
  // SERVICIO — Logística
  { id: 7, name: "Transporte El Surco", type: "logistics", lat: -34.70, lng: -58.30, products: [], certification: "yellow", description: "Fletes refrigerados para alimentos frescos." },
];

const MapPage = () => {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<ActorType>>(new Set(Object.keys(actorTypeLabels) as ActorType[]));
  const [showFilters, setShowFilters] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current).setView([-34.61, -58.44], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((a) => {
      const role = actorRole[a.type];
      const color = roleColors[role];
      const arrowIcon = role === "oferta" ? "▲" : role === "demanda" ? "▼" : "●";
      const shape = role === "oferta"
        ? `border-radius:4px 4px 50% 50%;`
        : role === "demanda"
        ? `border-radius:50% 50% 4px 4px;`
        : `border-radius:50%;`;

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:30px;height:30px;${shape}border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:12px;font-weight:bold;line-height:1">${arrowIcon}</span>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const certColor = a.certification === "green" ? "#2d6a4f" : a.certification === "yellow" ? "#d4a017" : "#dc2626";
      const productLabel = role === "oferta" ? "🟢 Ofrece" : role === "demanda" ? "🔴 Demanda" : "Servicio";
      const productBg = role === "oferta" ? "#e8f5e9" : "#fce4ec";
      const productColor = role === "oferta" ? "#2d6a4f" : "#c0392b";

      const productsHtml = a.products.length > 0
        ? `<div style="margin-top:6px">
            <p style="font-size:11px;font-weight:600;color:${productColor};margin:0 0 4px">${productLabel}:</p>
            <div style="display:flex;flex-wrap:wrap;gap:4px">${a.products.map((p) => `<span style="background:${productBg};color:${productColor};font-size:10px;padding:2px 6px;border-radius:4px">${p}</span>`).join("")}</div>
          </div>`
        : "";

      const certHtml = (role === "oferta")
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:${certColor};display:inline-block"></span>
              <span style="font-size:11px">${certLabels[a.certification]}</span>
            </div>`
        : "";

      const roleBadgeColor = role === "oferta" ? "#2d6a4f" : role === "demanda" ? "#c0392b" : "#e67e22";

      const marker = L.marker([a.lat, a.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width:220px;font-family:DM Sans,sans-serif">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <p style="font-weight:700;font-size:14px;margin:0">${a.name}</p>
              <span style="background:${roleBadgeColor};color:white;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap">${roleLabels[role]}</span>
            </div>
            <p style="font-size:12px;color:#666;margin:0">${actorTypeLabels[a.type]}</p>
            <p style="font-size:12px;margin:4px 0">${a.description}</p>
            ${productsHtml}
            ${certHtml}
          </div>
        `);
      markersRef.current.push(marker);
    });
  }, [filtered]);

  // Group actor types by role for filter display
  const ofertaTypes: ActorType[] = ["producer", "cooperative", "processing", "agroecological_node", "seed_bank", "composting_center", "research_center"];
  const demandaTypes: ActorType[] = ["restaurant", "social_kitchen", "institution", "retail", "consumer_node", "individual_consumer", "food_bank", "consumer_cooperative", "community_org", "health_food_store"];
  const servicioTypes: ActorType[] = ["logistics"];

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

            {/* Legend */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leyenda</p>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">▲</span>
                <span className="text-xs text-foreground font-medium">Oferta</span>
                <span className="text-xs text-muted-foreground">— Vende productos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-sm bg-destructive flex items-center justify-center text-[10px] text-destructive-foreground font-bold">▼</span>
                <span className="text-xs text-foreground font-medium">Demanda</span>
                <span className="text-xs text-muted-foreground">— Compra productos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-wheat flex items-center justify-center text-[10px] text-wheat-foreground font-bold">●</span>
                <span className="text-xs text-foreground font-medium">Servicio</span>
                <span className="text-xs text-muted-foreground">— Logística</span>
              </div>
            </div>

            {/* Oferta types */}
            <div>
              <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1">
                <ArrowUp className="h-3.5 w-3.5" /> Oferta
              </p>
              <div className="flex flex-wrap gap-2">
                {ofertaTypes.map((key) => (
                  <button key={key} onClick={() => toggleType(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeTypes.has(key)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}>
                    {actorTypeLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Demanda types */}
            <div>
              <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5" /> Demanda
              </p>
              <div className="flex flex-wrap gap-2">
                {demandaTypes.map((key) => (
                  <button key={key} onClick={() => toggleType(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeTypes.has(key)
                        ? "border-destructive bg-destructive text-destructive-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-destructive/40"
                    }`}>
                    {actorTypeLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* Servicio types */}
            <div>
              <p className="text-sm font-medium text-wheat mb-2 flex items-center gap-1">
                <Minus className="h-3.5 w-3.5" /> Servicio
              </p>
              <div className="flex flex-wrap gap-2">
                {servicioTypes.map((key) => (
                  <button key={key} onClick={() => toggleType(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeTypes.has(key)
                        ? "border-wheat bg-wheat text-wheat-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-wheat/40"
                    }`}>
                    {actorTypeLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Certificación</p>
              <div className="flex gap-2">
                {(["green", "yellow", "red"] as const).map((c) => (
                  <span key={c} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    c === "green" ? "bg-primary text-primary-foreground" : c === "yellow" ? "bg-wheat text-wheat-foreground" : "bg-destructive text-destructive-foreground"
                  }`}>
                    {certLabels[c]}
                  </span>
                ))}
              </div>
            </div>

            {/* Actor list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground">{filtered.length} resultados</p>
              {filtered.map((a) => {
                const role = actorRole[a.type];
                return (
                  <div key={a.id}
                    className={`p-3 rounded-lg border-l-4 border border-border hover:border-primary/30 transition-colors bg-background cursor-pointer ${
                      role === "oferta" ? "border-l-primary" : role === "demanda" ? "border-l-destructive" : "border-l-wheat"
                    }`}
                    onClick={() => mapRef.current?.setView([a.lat, a.lng], 15)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{actorTypeLabels[a.type]}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            role === "oferta" ? "bg-primary/10 text-primary" : role === "demanda" ? "bg-destructive/10 text-destructive" : "bg-wheat/10 text-wheat"
                          }`}>
                            {roleLabels[role]}
                          </span>
                        </div>
                      </div>
                      {(role === "oferta") && (
                        <span className={`inline-flex w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                          a.certification === "green" ? "bg-primary" : a.certification === "yellow" ? "bg-wheat" : "bg-destructive"
                        }`} />
                      )}
                    </div>
                    {a.products.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`text-[9px] font-medium mr-1 ${role === "oferta" ? "text-primary" : "text-destructive"}`}>
                          {role === "oferta" ? "Ofrece:" : "Demanda:"}
                        </span>
                        {a.products.slice(0, 3).map((p) => (
                          <Badge key={p} variant={role === "oferta" ? "default" : "destructive"} className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
          <div ref={mapContainerRef} className="h-[calc(100vh-4rem)] w-full z-0" />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
