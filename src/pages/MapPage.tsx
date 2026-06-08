import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import rutasSanas from "@/data/rutasSanas.json";
import { getLicense } from "@/lib/licenses";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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
  | "agroecological_market"
  | "bio_input_supplier";

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
  source: "rutas_sanas" | "agroeco";
  contentLicense?: string | null;
}

const actorTypeLabels: Record<ActorType, string> = {
  producer: "Productor/a Agroecológico/a",
  cooperative: "Cooperativa / Asociación",
  social_kitchen: "Comedor Comunitario",
  restaurant: "Restaurante / Bar",
  retail: "Comercio / Feria",
  institution: "Institución Pública",
  logistics: "Proveedor/a Logístico/a",
  processing: "Planta de Procesamiento",
  agroecological_node: "Nodo Agroecológico",
  seed_bank: "Banco de Semillas",
  composting_center: "Centro de Compostaje",
  research_center: "Centro de Investigación",
  solidarity_intermediary: "Intermediario/a Solidario/a",
  community_garden: "Huerta Comunitaria",
  consumer_node: "Nodo de Consumidores/as",
  individual_consumer: "Consumidor/a Individual",
  food_bank: "Banco de Alimentos",
  consumer_cooperative: "Cooperativa de Consumo",
  community_org: "Org. Comunitaria",
  health_food_store: "Dietética",
  agroecological_store: "Almacén Agroecológico",
  agroecological_fair: "Feria Agroecológica",
  agroecological_market: "Mercado Agroecológico",
  bio_input_supplier: "Proveedor/a de Bio-insumos",
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
  bio_input_supplier: "oferta",
};

const roleLabels: Record<ActorRole, string> = {
  oferta: "Ofrece",
  demanda: "Demanda",
  servicio: "Servicio",
};

const roleColors: Record<ActorRole, string> = {
  oferta: "#2563eb",
  demanda: "#9333ea",
  servicio: "#ea580c",
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

// Real points imported from "Mapa de las Rutas Sanas del Alimento" (Red Interregional de Nodos Agroecológicos)
const mockActors: MapActor[] = (rutasSanas as Array<{n:string;lat:number;lng:number;t:string;f:string;d:string}>).map((p, i) => ({
  id: i + 1,
  name: p.n,
  type: p.t as ActorType,
  lat: p.lat,
  lng: p.lng,
  products: [],
  certification: "yellow",
  description: p.d || p.f,
  source: "rutas_sanas",
}));

type CertFilter = "green" | "yellow" | "red";

const MapPage = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [activeTypes, setActiveTypes] = useState<Set<ActorType>>(new Set(Object.keys(actorTypeLabels) as ActorType[]));
  const [activeCerts, setActiveCerts] = useState<Set<CertFilter>>(new Set(["green", "yellow", "red"]));
  const [showFilters, setShowFilters] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [dbActors, setDbActors] = useState<MapActor[]>([]);

  // Fetch real profiles from database
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await (supabase as any)
        .from("public_profiles")
        .select("*")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (error || !data) return;

      const realActors: MapActor[] = (data as any[])
        .filter((p: any) => p.lat && p.lng)
        .map((p: any, i: number) => ({
          id: 10000 + i,
          name: p.display_name || "Sin nombre",
          type: (p.actor_type as ActorType) || "producer",
          lat: p.lat!,
          lng: p.lng!,
          products: (p.products || []).map(pr => pr.replace(/^[🟢🔴]\s*/, "")),
          certification: (p.certification as "red" | "yellow" | "green") || "red",
          description: p.description || p.location || "",
          source: "agroeco",
          contentLicense: p.content_license || null,
        }));
      setDbActors(realActors);
    };
    fetchProfiles();
  }, []);

  const allActors = useMemo(() => [...mockActors, ...dbActors], [dbActors]);

  const toggleType = (type: ActorType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleCert = (cert: CertFilter) => {
    setActiveCerts((prev) => {
      const next = new Set(prev);
      if (next.has(cert)) next.delete(cert);
      else next.add(cert);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return allActors.filter((a) => {
      if (!activeTypes.has(a.type)) return false;
      if (!activeCerts.has(a.certification)) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.products.some((p) => p.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [activeTypes, activeCerts, search, allActors]);

  // Recalculate map size when surrounding layout changes
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [showFilters]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current).setView([-34.61, -58.44], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);
    clusterRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
    });
    mapRef.current.addLayer(clusterRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return;
    clusterRef.current.clearLayers();

    filtered.forEach((a) => {
      const role = actorRole[a.type];
      const color = roleColors[role];
      const arrowIcon = role === "oferta" ? "▲" : role === "demanda" ? "▼" : "●";
      const shape = role === "oferta"
        ? `border-radius:4px 4px 50% 50%;`
        : role === "demanda"
        ? `border-radius:50% 50% 4px 4px;`
        : `border-radius:50%;`;

      const borderStyle = a.source === "rutas_sanas"
        ? "border:2px dashed white;opacity:0.85;"
        : "border:3px solid white;";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:30px;height:30px;${shape}${borderStyle}box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:12px;font-weight:bold;line-height:1">${arrowIcon}</span>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const certColor = a.certification === "green" ? "#2d6a4f" : a.certification === "yellow" ? "#d4a017" : "#dc2626";
      const productLabel = role === "oferta" ? "🟢 Ofrece" : role === "demanda" ? "🔴 Demanda" : "Servicio";
      const productBg = role === "oferta" ? "#dbeafe" : "#f3e8ff";
      const productColor = role === "oferta" ? "#2563eb" : "#9333ea";

      const productsHtml = a.products.length > 0
        ? `<div style="margin-top:8px">
            <p style="font-size:11px;font-weight:600;color:${productColor};margin:0 0 6px">${productLabel}:</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px">${a.products.map((p) => `<a href="#" class="map-product-link" data-producer="${encodeURIComponent(a.name)}" data-product="${encodeURIComponent(p)}" style="display:inline-block;background:${productBg};color:${productColor};font-size:11px;padding:4px 10px;border-radius:12px;text-decoration:none;cursor:pointer;border:1.5px solid ${productColor}40;font-weight:600;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.08)" onmouseover="this.style.background='${productColor}';this.style.color='white';this.style.transform='scale(1.05)'" onmouseout="this.style.background='${productBg}';this.style.color='${productColor}';this.style.transform='scale(1)'">${p}</a>`).join("")}</div>
          </div>`
        : "";

      const certHtml = (role === "oferta")
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:${certColor};display:inline-block"></span>
              <span style="font-size:11px">${certLabels[a.certification]}</span>
            </div>`
        : "";

      const roleBadgeColor = role === "oferta" ? "#2563eb" : role === "demanda" ? "#9333ea" : "#ea580c";

      const sourceBadge = a.source === "rutas_sanas"
        ? `<span style="display:inline-block;background:#f3f4f6;color:#6b7280;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px dashed #9ca3af;letter-spacing:0.3px;text-transform:uppercase">Rutas Sanas</span>`
        : `<span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #86efac;letter-spacing:0.3px;text-transform:uppercase">AgroEco.Red</span>`;

      const marker = L.marker([a.lat, a.lng], { icon })
        .bindPopup(`
          <div style="min-width:240px;font-family:DM Sans,sans-serif;padding:4px">
            <div style="margin-bottom:6px">${sourceBadge}</div>
            <a href="#" class="map-actor-link" data-producer="${encodeURIComponent(a.name)}" style="display:block;background:${roleBadgeColor};color:white;font-weight:700;font-size:14px;margin:0 0 8px;padding:8px 12px;border-radius:8px;text-decoration:none;cursor:pointer;text-align:center;transition:opacity 0.2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
              ${a.name}
              <span style="display:block;font-size:10px;font-weight:400;opacity:0.85;margin-top:2px">Ver todos sus productos →</span>
            </a>
            <p style="font-size:12px;color:#666;margin:0">${actorTypeLabels[a.type]}</p>
            <p style="font-size:12px;margin:4px 0">${a.description}</p>
            ${productsHtml}
            ${certHtml}
          </div>
        `);

      // Handle clicks on popup links
      marker.on("popupopen", () => {
        setTimeout(() => {
          // Actor name click → marketplace filtered by producer
          document.querySelectorAll(".map-actor-link").forEach((el) => {
            el.addEventListener("click", (e) => {
              e.preventDefault();
              const producer = decodeURIComponent((el as HTMLElement).dataset.producer || "");
              navigate(`/mercado?producer=${encodeURIComponent(producer)}`);
            });
          });
          // Product click → marketplace filtered by producer + search for product
          document.querySelectorAll(".map-product-link").forEach((el) => {
            el.addEventListener("click", (e) => {
              e.preventDefault();
              const producer = decodeURIComponent((el as HTMLElement).dataset.producer || "");
              const product = decodeURIComponent((el as HTMLElement).dataset.product || "");
              navigate(`/mercado?producer=${encodeURIComponent(producer)}&search=${encodeURIComponent(product)}`);
            });
          });
        }, 50);
      });

      clusterRef.current!.addLayer(marker);
    });
  }, [filtered, navigate]);

  // Group actor types by role for filter display
  const ofertaTypes: ActorType[] = ["producer", "cooperative", "processing", "agroecological_node", "seed_bank", "composting_center", "research_center", "solidarity_intermediary", "community_garden", "bio_input_supplier"];
  const demandaTypes: ActorType[] = ["restaurant", "social_kitchen", "institution", "retail", "consumer_node", "individual_consumer", "food_bank", "consumer_cooperative", "community_org", "health_food_store", "agroecological_store", "agroecological_fair", "agroecological_market"];
  const servicioTypes: ActorType[] = ["logistics"];

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 min-h-0 pt-16 flex flex-col">
        {/* Top toolbar: search + filters toggle */}
        <div className="px-4 sm:px-6 pt-4 pb-3 bg-gradient-to-b from-card/80 to-background border-b border-border">
          <div className="max-w-5xl mx-auto space-y-3">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/70 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar producto, productor/a, cooperativa, banco de semillas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-14 pr-12 h-14 text-base rounded-2xl border-2 border-border bg-card shadow-md focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary placeholder:text-muted-foreground/70"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> actores encontrados
                {search && <> para "<span className="italic">{search}</span>"</>}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(s => !s)}
                className="rounded-full"
              >
                <Filter className="h-4 w-4 mr-1.5" />
                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { role: "oferta" as ActorRole, label: "Oferta", icon: <ArrowUp className="h-3 w-3" />, types: ofertaTypes, color: "map-oferta" },
                  { role: "demanda" as ActorRole, label: "Demanda", icon: <ArrowDown className="h-3 w-3" />, types: demandaTypes, color: "map-demanda" },
                  { role: "servicio" as ActorRole, label: "Servicio", icon: <Minus className="h-3 w-3" />, types: servicioTypes, color: "map-servicio" },
                ]).map(({ role, label, icon, types, color }) => {
                  const activeCount = types.filter(t => activeTypes.has(t)).length;
                  return (
                    <DropdownMenu key={role}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className={`rounded-full text-xs h-8 border-${color}/40 text-${color} hover:bg-${color}/10`}>
                          {icon}
                          <span className="ml-1.5">{label}</span>
                          <span className="ml-1.5 text-[10px] opacity-70">({activeCount}/{types.length})</span>
                          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto w-64 bg-popover z-[1000]">
                        <DropdownMenuLabel className="text-xs flex items-center justify-between">
                          <span>{label}</span>
                          <button
                            className="text-[10px] text-primary hover:underline font-normal"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTypes(prev => {
                                const next = new Set(prev);
                                const allOn = types.every(t => next.has(t));
                                types.forEach(t => allOn ? next.delete(t) : next.add(t));
                                return next;
                              });
                            }}
                          >
                            {types.every(t => activeTypes.has(t)) ? "Quitar todos" : "Seleccionar todos"}
                          </button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {types.map((key) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={activeTypes.has(key)}
                            onCheckedChange={() => toggleType(key)}
                            onSelect={(e) => e.preventDefault()}
                            className="text-xs"
                          >
                            {actorTypeLabels[key]}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full text-xs h-8">
                      Certificación
                      <span className="ml-1.5 text-[10px] opacity-70">({activeCerts.size}/3)</span>
                      <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover z-[1000]">
                    {(["green", "yellow", "red"] as const).map((c) => (
                      <DropdownMenuCheckboxItem
                        key={c}
                        checked={activeCerts.has(c)}
                        onCheckedChange={() => toggleCert(c)}
                        onSelect={(e) => e.preventDefault()}
                        className="text-xs"
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${c === "green" ? "bg-primary" : c === "yellow" ? "bg-wheat" : "bg-destructive"}`} />
                        {certLabels[c]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-map-oferta/15 text-map-oferta text-[10px] font-medium">▲ Oferta</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-map-demanda/15 text-map-demanda text-[10px] font-medium">▼ Demanda</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-map-servicio/15 text-map-servicio text-[10px] font-medium">● Servicio</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 min-h-0 relative flex flex-col">
          <div ref={mapContainerRef} className="w-full z-0 flex-1 min-h-[300px]" />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
