import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import rutasSanas from "@/data/rutasSanas.json";
import mercadoTerritorial from "@/data/mercadoTerritorial.json";
import elClickData from "@/data/elClick.json";
import elBroteData from "@/data/elBrote.json";
import uttNodesData from "@/data/uttNodes.json";
import { getLicense } from "@/lib/licenses";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, ArrowUp, ArrowDown, Minus, CalendarPlus, Network, Sparkles, Plus } from "lucide-react";
import { DataSourceToggle } from "@/components/admin/DataSourceToggle";
import { useDataSources } from "@/hooks/useDataSources";
import { useLayerActors } from "@/hooks/useLayerActors";
import { useEvents, glowIntensity, eventBucket } from "@/hooks/useEvents";
import { useActorConnections } from "@/hooks/useActorConnections";
import { useAuth } from "@/contexts/AuthContext";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { EventsSidebar } from "@/components/events/EventsSidebar";
import { AddMapPointDialog } from "@/components/AddMapPointDialog";
import { EndorseDialog } from "@/components/actors/EndorseDialog";
import { DeclareConnectionDialog } from "@/components/actors/DeclareConnectionDialog";
import { toast } from "sonner";
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
  source: "rutas_sanas" | "mercado_territorial" | "agroeco" | "el_click" | "el_brote" | "utt_nodos" | "user_points";
  contentLicense?: string | null;
  /** ISO date of last update of this actor's data. Null = never updated since import (inherited). */
  lastUpdated?: string | null;
  /** true when the actor itself confirmed/updated the data on AgroEco.Red. */
  verified?: boolean;
  /** Days / schedule when the actor receives, opens, delivers, or runs the feria. */
  deliveryInfo?: string;
  /** UUID of the layer_actors row (when the actor lives in the DB) — used for endorsements. */
  layerActorId?: string;
  /** Who confirmed this actor: 'platform' (AgroEco.Red admin) | 'layer' (layer manager) | null. */
  verifiedByRole?: "platform" | "layer" | null;
}

// Approximate import dates for inherited datasets (used until each actor claims their record).
const SOURCE_IMPORT_DATE: Record<MapActor["source"], string> = {
  rutas_sanas: "2023-06-01",
  mercado_territorial: "2024-09-01",
  agroeco: new Date().toISOString().slice(0, 10),
  el_click: "2026-06-19",
  el_brote: "2026-06-19",
  utt_nodos: "2022-05-02",
  user_points: new Date().toISOString().slice(0, 10),
};

function formatUpdateDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

/** Human-readable label of the dataset a layer-verified actor was endorsed by. */
const sourceShortLabel: Record<MapActor["source"], string> = {
  rutas_sanas: "Rutas Sanas",
  mercado_territorial: "Mercado Territorial",
  agroeco: "AgroEco.Red",
  el_click: "El Click",
  el_brote: "El Brote",
  utt_nodos: "UTT",
  user_points: "AgroEco.Red",
};

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

// Fallback while DB rows are loading (or for legacy reference). Rutas Sanas is now served from `layer_actors`.
const fallbackRutasSanasActors: MapActor[] = (rutasSanas as Array<{n:string;lat:number;lng:number;t:string;f:string;d:string}>).map((p, i) => ({
  id: i + 1,
  name: p.n,
  type: p.t as ActorType,
  lat: p.lat,
  lng: p.lng,
  products: [],
  certification: "yellow",
  description: p.d || p.f,
  source: "rutas_sanas",
  verified: false,
  lastUpdated: SOURCE_IMPORT_DATE.rutas_sanas,
}));

const mercadoTerritorialActors: MapActor[] = (mercadoTerritorial as Array<{n:string;lat:number;lng:number;t:string;f:string;d:string}>).map((p, i) => ({
  id: 50000 + i,
  name: p.n,
  type: "consumer_node" as ActorType,
  lat: p.lat,
  lng: p.lng,
  products: [],
  certification: "yellow",
  description: p.d ? `${p.d} — ${p.f}` : p.f,
  source: "mercado_territorial",
  verified: false,
  lastUpdated: SOURCE_IMPORT_DATE.mercado_territorial,
}));

const elClickActors: MapActor[] = [{
  id: 60000,
  name: elClickData.store.name,
  type: (elClickData.store.type as ActorType) || "retail",
  lat: elClickData.store.lat,
  lng: elClickData.store.lng,
  products: [],
  certification: "yellow",
  description: `${elClickData.store.description} — ${elClickData.store.location}`,
  source: "el_click",
  verified: true,
  lastUpdated: elClickData.store.lastUpdated || SOURCE_IMPORT_DATE.el_click,
  deliveryInfo: (elClickData.store as any).deliveryInfo,
}];

const elBroteActors: MapActor[] = [{
  id: 70000,
  name: elBroteData.store.name,
  type: (elBroteData.store.type as ActorType) || "retail",
  lat: elBroteData.store.lat,
  lng: elBroteData.store.lng,
  products: [],
  certification: "yellow",
  description: `${elBroteData.store.description} — ${elBroteData.store.location}`,
  source: "el_brote",
  verified: true,
  lastUpdated: elBroteData.store.lastUpdated || SOURCE_IMPORT_DATE.el_brote,
  deliveryInfo: (elBroteData.store as any).deliveryInfo,
}];

const uttNodesActors: MapActor[] = (uttNodesData.nodes as any[]).map((n, i) => {
  const contactBits: string[] = [];
  if (n.address) contactBits.push(n.address);
  if (n.phone) contactBits.push(`Tel/WhatsApp: ${n.phone}`);
  if (n.url) contactBits.push(n.url);
  if (n.notes) contactBits.push(n.notes);
  const desc = [`${n.barrio} — ${n.zone}`, contactBits.join(" · ")].filter(Boolean).join(" · ");
  const deliveryBits: string[] = [];
  if (n.deliveryDays) deliveryBits.push(n.deliveryDays);
  if (n.openNode) deliveryBits.push("Nodo abierto");
  return {
    id: 80000 + i,
    name: n.name || "Nodo UTT",
    type: "consumer_node" as ActorType,
    lat: n.lat,
    lng: n.lng,
    products: [],
    certification: "yellow",
    description: desc,
    source: "utt_nodos",
    verified: Boolean(n.verified),
    lastUpdated: n.lastUpdated || SOURCE_IMPORT_DATE.utt_nodos,
    deliveryInfo: deliveryBits.length ? deliveryBits.join(" · ") : undefined,
  };
});

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
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);
  const networkLayerRef = useRef<L.LayerGroup | null>(null);
  const profileIdByCoordsRef = useRef<Map<string, { id: string; lat: number; lng: number; name: string }>>(new Map());
  const [dbActors, setDbActors] = useState<MapActor[]>([]);
  const [dbProfilesById, setDbProfilesById] = useState<Map<string, { id: string; lat: number; lng: number; name: string }>>(new Map());
  const { isEnabled } = useDataSources();
  const { user } = useAuth();
  const { events } = useEvents();
  const { connections } = useActorConnections();
  const [showNetwork, setShowNetwork] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [addPointOpen, setAddPointOpen] = useState(false);
  const [endorseTarget, setEndorseTarget] = useState<{ id: string; name: string } | null>(null);
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null);
  const [endorsements, setEndorsements] = useState<Map<string, { count: number; last_at: string }>>(new Map());
  const [endorsementsTick, setEndorsementsTick] = useState(0);

  // Load aggregated endorsement counts (no PII) for every layer actor.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("actor_endorsement_counts")
        .select("layer_actor_id, count, last_at");
      if (cancelled || !data) return;
      const m = new Map<string, { count: number; last_at: string }>();
      (data as any[]).forEach((r) => m.set(r.layer_actor_id, { count: r.count, last_at: r.last_at }));
      setEndorsements(m);
    })();
    return () => { cancelled = true; };
  }, [endorsementsTick]);

  // Rutas Sanas is now served from the layer_actors DB table (editable by layer managers).
  const { actors: rutasSanasDb } = useLayerActors("rutas_sanas");
  const { actors: userPointsDb } = useLayerActors("user_points");
  const rutasSanasActors = useMemo<MapActor[]>(() => {
    if (!rutasSanasDb || rutasSanasDb.length === 0) return fallbackRutasSanasActors;
    return rutasSanasDb.map((p, i) => ({
      id: 1 + i,
      layerActorId: p.id,
      name: p.name,
      type: (p.actor_type as ActorType) || "consumer_node",
      lat: p.lat,
      lng: p.lng,
      products: [],
      certification: "yellow",
      description: p.description || p.family || "",
      source: "rutas_sanas",
      verified: !!p.verified_at,
      verifiedByRole: (p.verified_by_role as any) || (p.verified_at ? "layer" : null),
      lastUpdated: p.verified_at || p.updated_at || SOURCE_IMPORT_DATE.rutas_sanas,
      deliveryInfo: (p.delivery_days && p.delivery_days.length > 0)
        ? p.delivery_days.join(", ")
        : ((p.extra as any) || {}).deliveryInfo,
    }));
  }, [rutasSanasDb]);

  const userPointActors = useMemo<MapActor[]>(() => {
    return (userPointsDb || []).map((p, i) => ({
      id: 90000 + i,
      layerActorId: p.id,
      name: p.name,
      type: (p.actor_type as ActorType) || "agroecological_node",
      lat: p.lat,
      lng: p.lng,
      products: [],
      certification: "yellow",
      description: p.description || p.address || "",
      source: "user_points",
      verified: !!p.verified_at,
      verifiedByRole: (p.verified_by_role as any) || (p.verified_at ? "platform" : null),
      lastUpdated: p.verified_at || p.updated_at || null,
      deliveryInfo: (p.delivery_days && p.delivery_days.length > 0) ? p.delivery_days.join(", ") : undefined,
    }));
  }, [userPointsDb]);

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
          verified: true,
          lastUpdated: p.updated_at || p.created_at || null,
        }));
      setDbActors(realActors);
      const m = new Map<string, { id: string; lat: number; lng: number; name: string }>();
      (data as any[]).forEach((p: any) => {
        if (p.id && p.lat && p.lng) m.set(p.id as string, { id: p.id, lat: p.lat, lng: p.lng, name: p.display_name || "" });
      });
      setDbProfilesById(m);
    };
    fetchProfiles();
  }, []);

  const allActors = useMemo(() => {
    const out: MapActor[] = [];
    if (isEnabled("rutas_sanas")) out.push(...rutasSanasActors);
    if (isEnabled("mercado_territorial")) out.push(...mercadoTerritorialActors);
    if (isEnabled("agroeco")) out.push(...dbActors);
    if (isEnabled("el_click")) out.push(...elClickActors);
    if (isEnabled("el_brote")) out.push(...elBroteActors);
    if (isEnabled("utt_nodos")) out.push(...uttNodesActors);
    if (isEnabled("user_points")) out.push(...userPointActors);
    return out;
  }, [dbActors, isEnabled, rutasSanasActors, userPointActors]);

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
    eventsLayerRef.current = L.layerGroup().addTo(mapRef.current);
    networkLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
      eventsLayerRef.current = null;
      networkLayerRef.current = null;
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
        : a.source === "mercado_territorial"
        ? "border:2px dotted white;opacity:0.9;"
        : a.source === "utt_nodos"
        ? "border:2px solid #fde047;opacity:0.95;"
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

      const licenseHtml = a.contentLicense
        ? (() => {
            const lic = getLicense(a.contentLicense);
            const link = lic.url
              ? `<a href="${lic.url}" target="_blank" rel="noopener noreferrer" style="color:#15803d;text-decoration:underline">${lic.short}</a>`
              : `<span style="color:#6b7280">${lic.short}</span>`;
            return `<p style="font-size:10px;color:#6b7280;margin:8px 0 0">Datos compartidos bajo ${link}</p>`;
          })()
        : "";

      const roleBadgeColor = role === "oferta" ? "#2563eb" : role === "demanda" ? "#9333ea" : "#ea580c";

      const sourceBadge = a.source === "rutas_sanas"
        ? `<span style="display:inline-block;background:#f3f4f6;color:#6b7280;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px dashed #9ca3af;letter-spacing:0.3px;text-transform:uppercase">Rutas Sanas</span>`
        : a.source === "mercado_territorial"
        ? `<a href="https://mercadoterritorial.com.ar/buscador-de-nodos/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#fef3c7;color:#92400e;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px dotted #d97706;letter-spacing:0.3px;text-transform:uppercase;text-decoration:none">Mercado Territorial</a>`
        : a.source === "el_click"
        ? `<a href="https://elclick.com.ar/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#e0f2fe;color:#075985;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #7dd3fc;letter-spacing:0.3px;text-transform:uppercase;text-decoration:none">El Click</a>`
        : a.source === "el_brote"
        ? `<a href="https://elbrotetienda.com/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#d1fae5;color:#065f46;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #6ee7b7;letter-spacing:0.3px;text-transform:uppercase;text-decoration:none">El Brote</a>`
        : a.source === "utt_nodos"
        ? `<a href="https://uniondetrabajadoresdelatierra.com.ar/comercializacion-2/" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#fef9c3;color:#854d0e;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #fde047;letter-spacing:0.3px;text-transform:uppercase;text-decoration:none">Nodo UTT</a>`
        : a.source === "user_points"
        ? `<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #fcd34d;letter-spacing:0.3px;text-transform:uppercase">Comunidad</span>`
        : `<span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #86efac;letter-spacing:0.3px;text-transform:uppercase">AgroEco.Red</span>`;

      // Verification tier (highest to lowest):
      //   1. Platform-verified (AgroEco.Red admin)
      //   2. Layer-verified (admin of the source layer, e.g. Rutas Sanas)
      //   3. Network-endorsed (X votos de confianza de miembros)
      //   4. Imported (just a record from the source, no confirmation yet)
      const dateLabel = a.lastUpdated ? formatUpdateDate(a.lastUpdated) : "";
      const endorseInfo = a.layerActorId ? endorsements.get(a.layerActorId) : undefined;
      const endorseDateLabel = endorseInfo?.last_at ? formatUpdateDate(endorseInfo.last_at) : "";
      const verificationBadge = (() => {
        if (a.verifiedByRole === "platform") {
          return `<span title="Verificado por el equipo de AgroEco.Red el ${dateLabel}" style="display:inline-flex;align-items:center;gap:3px;background:#dcfce7;color:#14532d;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #4ade80;letter-spacing:0.2px">✓ Verificado por AgroEco.Red · ${dateLabel}</span>`;
        }
        if (a.verifiedByRole === "layer") {
          const label = sourceShortLabel[a.source] || "el equipo de la capa";
          return `<span title="Verificado por ${label} el ${dateLabel}" style="display:inline-flex;align-items:center;gap:3px;background:#e0e7ff;color:#3730a3;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #a5b4fc;letter-spacing:0.2px">✓ Verificado por ${label} · ${dateLabel}</span>`;
        }
        if (endorseInfo && endorseInfo.count > 0) {
          const label = endorseInfo.count === 1 ? "1 voto de confianza" : `${endorseInfo.count} votos de confianza`;
          return `<span title="Miembros de la red dieron su voto de confianza. Último: ${endorseDateLabel}" style="display:inline-flex;align-items:center;gap:3px;background:#fef3c7;color:#854d0e;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px solid #fcd34d;letter-spacing:0.2px">🤝 ${label} · último ${endorseDateLabel}</span>`;
        }
        return dateLabel
          ? `<span title="Registro importado de la fuente original — todavía no verificado por la red." style="display:inline-flex;align-items:center;gap:3px;background:#f3f4f6;color:#6b7280;font-size:9px;font-weight:600;padding:2px 6px;border-radius:6px;border:1px dashed #9ca3af;letter-spacing:0.2px">Importado · ${dateLabel}</span>`
          : "";
      })();

      const endorseButton = (user && a.layerActorId && a.verifiedByRole !== "platform")
        ? `<button class="map-endorse-btn" data-actor-id="${a.layerActorId}" data-actor-name="${encodeURIComponent(a.name)}" style="margin-top:6px;background:#fef3c7;color:#854d0e;border:1px solid #fcd34d;font-size:10px;font-weight:600;padding:4px 8px;border-radius:6px;cursor:pointer">🤝 Dar voto de confianza</button>`
        : "";

      const connectButton = (user && a.layerActorId)
        ? `<button class="map-connect-btn" data-actor-id="${a.layerActorId}" data-actor-name="${encodeURIComponent(a.name)}" style="margin-top:6px;margin-left:6px;background:#e0e7ff;color:#3730a3;border:1px solid #a5b4fc;font-size:10px;font-weight:600;padding:4px 8px;border-radius:6px;cursor:pointer">🔗 Declarar vínculo</button>`
        : "";

      const deliveryHtml = a.deliveryInfo
        ? `<div style="display:flex;align-items:center;gap:6px;margin:8px 0 4px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 10px">
              <span style="font-size:14px;line-height:1">🗓️</span>
              <div style="font-size:11px;line-height:1.3">
                <span style="font-weight:600;color:#1e3a8a">Entrega / apertura:</span>
                <span style="color:#1e40af">&nbsp;${a.deliveryInfo}</span>
              </div>
            </div>`
        : "";

      const marker = L.marker([a.lat, a.lng], { icon })
        .bindPopup(`
          <div style="min-width:240px;font-family:DM Sans,sans-serif;padding:4px">
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${sourceBadge}${verificationBadge}</div>
            <a href="#" class="map-actor-link" data-producer="${encodeURIComponent(a.name)}" data-source="${a.source}" style="display:block;background:${roleBadgeColor};color:white;font-weight:700;font-size:14px;margin:0 0 8px;padding:8px 12px;border-radius:8px;text-decoration:none;cursor:pointer;text-align:center;transition:opacity 0.2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
              ${a.name}
              <span style="display:block;font-size:10px;font-weight:400;opacity:0.85;margin-top:2px">${a.source === 'mercado_territorial' ? 'Ver catálogo Mercado Territorial →' : 'Ver todos sus productos →'}</span>
            </a>
            <p style="font-size:12px;color:#666;margin:0">${actorTypeLabels[a.type]}</p>
            <p style="font-size:12px;margin:4px 0">${a.description}</p>
            ${deliveryHtml}
            ${productsHtml}
            ${certHtml}
            ${licenseHtml}
            ${endorseButton}
            ${connectButton}
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
              const source = (el as HTMLElement).dataset.source || "";
              if (source === "mercado_territorial") {
                navigate(`/mercado?source=mercado_territorial&node=${encodeURIComponent(producer)}`);
              } else {
                navigate(`/mercado?producer=${encodeURIComponent(producer)}`);
              }
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
          // Endorse-actor button → open dialog
          document.querySelectorAll(".map-endorse-btn").forEach((el) => {
            el.addEventListener("click", (e) => {
              e.preventDefault();
              const id = (el as HTMLElement).dataset.actorId || "";
              const name = decodeURIComponent((el as HTMLElement).dataset.actorName || "");
              if (id) setEndorseTarget({ id, name });
            });
          });
          // Declare-connection button → open dialog
          document.querySelectorAll(".map-connect-btn").forEach((el) => {
            el.addEventListener("click", (e) => {
              e.preventDefault();
              const id = (el as HTMLElement).dataset.actorId || "";
              const name = decodeURIComponent((el as HTMLElement).dataset.actorName || "");
              if (id) setConnectTarget({ id, name });
            });
          });
        }, 50);
      });

      clusterRef.current!.addLayer(marker);
    });
  }, [filtered, navigate, endorsements, user]);

  // Render upcoming events as confetti markers
  useEffect(() => {
    if (!mapRef.current || !eventsLayerRef.current) return;
    eventsLayerRef.current.clearLayers();
    if (!isEnabled("eventos")) return;

    events.forEach((ev) => {
      if (ev.lat == null || ev.lng == null) return;
      if (eventBucket(ev) !== "upcoming") return; // past or undated → only sidebar
      const intensity = glowIntensity(ev.starts_at); // 0..1
      const size = 14 + Math.round(intensity * 22);   // 14 → 36 px halo
      const spread = 2 + Math.round(intensity * 10);
      const speed = (2.6 - intensity * 1.4).toFixed(2);
      const glowColor = intensity > 0.75 ? "#ec4899" : intensity > 0.45 ? "#d946ef" : "#a855f7";
      const shadow = intensity > 0.75 ? "rgba(236,72,153,0.75)" : intensity > 0.45 ? "rgba(217,70,239,0.55)" : "rgba(168,85,247,0.4)";
      const icon = L.divIcon({
        className: "",
        html: `<div class="event-glow" style="--glow-color:${glowColor};--glow-size:${size}px;--glow-spread:${spread}px;--glow-shadow:${shadow};--glow-speed:${speed}s">★</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const date = new Date(ev.starts_at);
      const dateStr = date.toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const typeLabels: Record<string, string> = { feria: "Feria", intercambio: "Intercambio", formacion: "Formación", otro: "Actividad" };
      const typeColor: Record<string, string> = { feria: "#E94560", intercambio: "#22C55E", formacion: "#3B82F6", otro: "#F5C518" };
      const linkHtml = ev.link ? `<a href="${ev.link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;background:#F5C518;color:#1a1a1a;padding:6px 12px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px">Más info / inscripción →</a>` : "";
      const contactBits: string[] = [];
      if ((ev as any).contact_email) contactBits.push(`<a href="mailto:${(ev as any).contact_email}" style="color:#0f766e;text-decoration:underline">✉ ${(ev as any).contact_email}</a>`);
      if ((ev as any).contact_phone) contactBits.push(`<a href="tel:${(ev as any).contact_phone}" style="color:#0f766e;text-decoration:underline">📞 ${(ev as any).contact_phone}</a>`);
      if (ev.contact && !contactBits.length) contactBits.push(`📞 ${ev.contact}`);
      const contactHtml = contactBits.length ? `<p style="font-size:11px;color:#444;margin:6px 0 0">Confirmar info: ${contactBits.join(" · ")}</p>` : "";
      const descHtml = ev.description ? `<p style="font-size:12px;color:#444;margin:6px 0">${ev.description}</p>` : "";
      const locHtml = ev.location_name ? `<p style="font-size:11px;color:#666;margin:4px 0">📍 ${ev.location_name}</p>` : "";
      const flyerHtml = (ev as any).flyer_url
        ? `<img src="${(ev as any).flyer_url}" alt="Flyer" style="width:100%;border-radius:8px;margin-top:6px;border:1px solid #e5e7eb" />`
        : "";
      const orgs = ((ev as any).extra_organizer_names || []) as string[];
      const orgsHtml = orgs.length ? `<p style="font-size:11px;color:#444;margin:6px 0 0"><b>Co-organizan:</b> ${orgs.join(", ")}</p>` : "";
      L.marker([ev.lat, ev.lng], { icon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="min-width:240px;font-family:DM Sans,sans-serif;padding:4px">
            <span style="display:inline-block;background:${typeColor[ev.event_type]};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.4px">${typeLabels[ev.event_type]}</span>
            <h3 style="font-family:Playfair Display,serif;font-size:16px;margin:8px 0 4px;color:#1a1a1a">${ev.title}</h3>
            <p style="font-size:12px;color:#444;margin:0;font-weight:600">🗓️ ${dateStr}</p>
            ${locHtml}${descHtml}${flyerHtml}${orgsHtml}${contactHtml}${linkHtml}
          </div>
        `)
        .addTo(eventsLayerRef.current!);
    });
  }, [events, isEnabled]);

  // Render actor network (lines + halos) — declared + inferred (same MTR node coord)
  useEffect(() => {
    if (!mapRef.current || !networkLayerRef.current) return;
    networkLayerRef.current.clearLayers();
    if (!showNetwork) return;

    // Build position lookup
    const posById = new Map<string, [number, number]>();
    dbProfilesById.forEach((p) => posById.set(p.id, [p.lat, p.lng]));

    // Declared edges
    const edges: { from: [number, number]; to: [number, number]; type: string; declared: boolean; strength: number }[] = [];
    connections.forEach((c) => {
      const a = posById.get(c.source_profile_id);
      const b = posById.get(c.target_profile_id);
      if (a && b) edges.push({ from: a, to: b, type: c.connection_type, declared: c.declared, strength: c.strength });
    });

    // Inferred edges: actors within ~5km share a "red" edge (light)
    const ids = Array.from(posById.keys());
    const km = (a: [number, number], b: [number, number]) => {
      const R = 6371;
      const dLat = (b[0] - a[0]) * Math.PI / 180;
      const dLng = (b[1] - a[1]) * Math.PI / 180;
      const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI/180) * Math.cos(b[0] * Math.PI/180) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(s));
    };
    const seen = new Set<string>();
    connections.forEach(c => seen.add([c.source_profile_id, c.target_profile_id].sort().join("|")));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = [ids[i], ids[j]].sort().join("|");
        if (seen.has(k)) continue;
        const a = posById.get(ids[i])!;
        const b = posById.get(ids[j])!;
        if (km(a, b) < 5) {
          edges.push({ from: a, to: b, type: "red", declared: false, strength: 1 });
          seen.add(k);
        }
      }
    }

    const typeColor: Record<string, string> = {
      proveedor: "#2563eb", comprador: "#9333ea", colaboracion: "#16a34a",
      spg: "#d97706", intercambio: "#0891b2", red: "#6b7280", otro: "#6b7280",
    };

    // Degree count for halos
    const degree = new Map<string, number>();
    connections.forEach(c => {
      degree.set(c.source_profile_id, (degree.get(c.source_profile_id) || 0) + 1);
      degree.set(c.target_profile_id, (degree.get(c.target_profile_id) || 0) + 1);
    });

    edges.forEach((e) => {
      L.polyline([e.from, e.to], {
        color: typeColor[e.type] || "#6b7280",
        weight: e.declared ? 1.5 + e.strength * 0.6 : 1,
        opacity: e.declared ? 0.7 : 0.3,
        dashArray: e.declared ? undefined : "4 6",
        interactive: false,
      }).addTo(networkLayerRef.current!);
    });

    // Event co-organization edges: events sharing extra_organizer_names → connect their map points.
    const orgIndex = new Map<string, { lat: number; lng: number; title: string }[]>();
    events.forEach((ev: any) => {
      if (ev.lat == null || ev.lng == null) return;
      const orgs: string[] = ev.extra_organizer_names || [];
      orgs.forEach((raw) => {
        const key = String(raw).trim().toLowerCase();
        if (!key) return;
        const arr = orgIndex.get(key) || [];
        arr.push({ lat: ev.lat, lng: ev.lng, title: ev.title });
        orgIndex.set(key, arr);
      });
    });
    orgIndex.forEach((nodes) => {
      if (nodes.length < 2) return;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          L.polyline([[nodes[i].lat, nodes[i].lng], [nodes[j].lat, nodes[j].lng]], {
            color: "#ec4899",
            weight: 2,
            opacity: 0.55,
            dashArray: "2 6",
            interactive: false,
          }).addTo(networkLayerRef.current!);
        }
      }
    });

    // Halos for actors with degree >= 2
    posById.forEach((pos, id) => {
      const d = degree.get(id) || 0;
      if (d < 2) return;
      const size = 32 + Math.min(d, 6) * 4;
      const haloIcon = L.divIcon({
        className: "",
        html: `<div class="network-halo" style="width:${size}px;height:${size}px;background:hsl(var(--primary)/0.08);border:2px solid hsl(var(--primary)/0.5)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker(pos, { icon: haloIcon, interactive: false, zIndexOffset: -500 }).addTo(networkLayerRef.current!);
    });
  }, [showNetwork, connections, dbProfilesById, events]);

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

          {/* Events sidebar (desktop inline + mobile drawer) */}
          <EventsSidebar
            events={events}
            onFlyTo={(la, ln) => mapRef.current?.flyTo([la, ln], 14, { duration: 0.8 })}
          />

          {/* Floating action buttons */}
          <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => setShowNetwork(s => !s)}
              className={`rounded-full shadow-elevated gap-2 ${showNetwork ? "bg-primary text-primary-foreground" : "bg-card text-foreground border-2 border-primary/30"}`}
              title="Mostrar/ocultar análisis de redes"
            >
              <Network className="h-4 w-4" />
              {showNetwork ? "Ocultar red" : "Ver red de vínculos"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!user) {
                  toast("Necesitás ingresar para agregar un punto", { action: { label: "Ingresar", onClick: () => navigate("/ingresar") } });
                  return;
                }
                setAddPointOpen(true);
              }}
              className="rounded-full shadow-elevated gap-2 bg-primary text-primary-foreground hover:opacity-90 ring-4 ring-primary/20"
              title="Sumar un nodo, huerta o cooperativa al mapa"
            >
              <Plus className="h-4 w-4" />
              + Agregar punto
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!user) {
                  toast("Necesitás ingresar para publicar una actividad", { action: { label: "Ingresar", onClick: () => navigate("/ingresar") } });
                  return;
                }
                setEventDialogOpen(true);
              }}
              className="rounded-full shadow-elevated gap-2 bg-gradient-to-r from-[#E94560] via-[#F5C518] to-[#3B82F6] text-white border-2 border-white/40 hover:opacity-90"
              title="Publicar feria, intercambio o formación"
            >
              <Sparkles className="h-4 w-4" />
              + Actividad futura
            </Button>
          </div>
        </div>
      </div>
      <DataSourceToggle position="bottom-6 right-6" />
      <EventFormDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
      <AddMapPointDialog open={addPointOpen} onOpenChange={setAddPointOpen} />
      <EndorseDialog
        open={!!endorseTarget}
        onOpenChange={(v) => { if (!v) setEndorseTarget(null); }}
        actorId={endorseTarget?.id || null}
        actorName={endorseTarget?.name || ""}
        onSubmitted={() => setEndorsementsTick((x) => x + 1)}
      />
      <DeclareConnectionDialog
        open={!!connectTarget}
        onOpenChange={(v) => { if (!v) setConnectTarget(null); }}
        targetActorId={connectTarget?.id || null}
        targetActorName={connectTarget?.name || ""}
      />
    </div>
  );
};

export default MapPage;
