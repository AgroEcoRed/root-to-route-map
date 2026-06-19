import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search, MapPin, Calendar, ShoppingBasket,
  TrendingUp, DollarSign, Navigation, ShieldCheck, Star, SlidersHorizontal, Store, Users, AlertTriangle, MessageSquare, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDataSources } from "@/hooks/useDataSources";
import { DataSourceToggle } from "@/components/admin/DataSourceToggle";
import { toast } from "sonner";
import elClickData from "@/data/elClick.json";
import elBroteData from "@/data/elBrote.json";

type SortOption = "relevance" | "price_asc" | "price_desc" | "proximity" | "best_seller" | "cert_green" | "seasonal";
type ListingType = "oferta" | "demanda";
type ProductSource = "mock" | "mercado_territorial" | "agroeco" | "rutas_sanas" | "el_click" | "el_brote";

interface Product {
  id: number;
  name: string;
  producer: string;
  location: string;
  category: string;
  subcategory?: string;
  price: number;
  priceDisplay: string;
  unit: string;
  available: string;
  certification: "red" | "yellow" | "green";
  image: string;
  seasonal: string;
  soldCount: number;
  distanceKm: number;
  listingType: ListingType;
  imageUrl?: string;
  sellos?: { code: string; name: string }[];
  source?: ProductSource;
  sourceUrl?: string;
  description?: string;
}

// Main categories (intermediate approach)
const mainCategories = [
  "Todos", "Verduras", "Frutas", "Lácteos", "Huevos", "Carnes",
  "Almacén", "Panificados", "Bebidas", "Cosmética Natural",
  "Plantines y Semillas", "Bio-insumos", "Salud Natural", "Mercado Híbrido"
];

// Almacén subcategories
const almacenSubcategories = [
  "all_almacen", "yerba_mate", "cereales", "conservas", "miel",
  "mermeladas", "productos_secos", "aceites", "azucar"
];

const eggSubcategories = ["all_eggs", "gallina_pastoril", "pato", "codorniz"];

const mockProducts: Product[] = [
  // ── OFERTA ──
  { id: 1, name: "Tomate Platense", producer: "Finca La Esperanza", location: "La Plata", category: "Verduras", price: 1200, priceDisplay: "$1.200", unit: "kg", available: "500 kg", certification: "green", image: "🍅", seasonal: "Oct - Mar", soldCount: 340, distanceKm: 12, listingType: "oferta" },
  { id: 2, name: "Lechuga Criolla", producer: "Finca La Esperanza", location: "La Plata", category: "Verduras", price: 800, priceDisplay: "$800", unit: "kg", available: "200 kg", certification: "green", image: "🥬", seasonal: "Todo el año", soldCount: 280, distanceKm: 12, listingType: "oferta" },
  { id: 3, name: "Miel Multifloral", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Almacén", subcategory: "miel", price: 4500, priceDisplay: "$4.500", unit: "kg", available: "150 kg", certification: "green", image: "🍯", seasonal: "Feb - May", soldCount: 150, distanceKm: 25, listingType: "oferta" },
  { id: 4, name: "Huevos Pastoril Colorados", producer: "Granja El Retiro", location: "San Vicente", category: "Huevos", subcategory: "gallina_pastoril", price: 3200, priceDisplay: "$3.200", unit: "docena", available: "80 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 420, distanceKm: 45, listingType: "oferta" },
  { id: 5, name: "Zapallo Anco", producer: "Huerta Don Pedro", location: "Moreno", category: "Verduras", price: 900, priceDisplay: "$900", unit: "kg", available: "800 kg", certification: "yellow", image: "🎃", seasonal: "Mar - Jul", soldCount: 190, distanceKm: 35, listingType: "oferta" },
  { id: 6, name: "Harina Integral", producer: "Molino Agroeco", location: "Luján", category: "Almacén", subcategory: "cereales", price: 2100, priceDisplay: "$2.100", unit: "kg", available: "1.000 kg", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 310, distanceKm: 60, listingType: "oferta" },
  { id: 7, name: "Dulce de Durazno", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Almacén", subcategory: "mermeladas", price: 3800, priceDisplay: "$3.800", unit: "frasco 500g", available: "120 uds", certification: "green", image: "🍑", seasonal: "Ene - Mar", soldCount: 95, distanceKm: 25, listingType: "oferta" },
  { id: 8, name: "Pollo Pastoril", producer: "Granja El Retiro", location: "San Vicente", category: "Carnes", price: 5500, priceDisplay: "$5.500", unit: "kg", available: "50 uds/sem", certification: "green", image: "🍗", seasonal: "Todo el año", soldCount: 220, distanceKm: 45, listingType: "oferta" },
  { id: 9, name: "Naranjas de Quinta", producer: "Huerta Don Pedro", location: "Moreno", category: "Frutas", price: 1500, priceDisplay: "$1.500", unit: "kg", available: "300 kg", certification: "yellow", image: "🍊", seasonal: "Jun - Oct", soldCount: 175, distanceKm: 35, listingType: "oferta" },
  { id: 10, name: "Queso Criollo", producer: "Coop. Tierra Viva", location: "Cañuelas", category: "Lácteos", price: 6200, priceDisplay: "$6.200", unit: "kg", available: "40 kg/sem", certification: "green", image: "🧀", seasonal: "Todo el año", soldCount: 130, distanceKm: 55, listingType: "oferta" },
  { id: 11, name: "Acelga de Hoja", producer: "Coop. Tierra Viva", location: "Cañuelas", category: "Verduras", price: 700, priceDisplay: "$700", unit: "atado", available: "300 atados", certification: "green", image: "🥗", seasonal: "Mar - Nov", soldCount: 260, distanceKm: 55, listingType: "oferta" },
  { id: 12, name: "Choclo Fresco", producer: "Huerta Don Pedro", location: "Moreno", category: "Verduras", price: 600, priceDisplay: "$600", unit: "unidad", available: "1.000 uds", certification: "yellow", image: "🌽", seasonal: "Dic - Mar", soldCount: 380, distanceKm: 35, listingType: "oferta" },
  { id: 13, name: "Huevos Pastoril Blancos", producer: "Granja El Retiro", location: "San Vicente", category: "Huevos", subcategory: "gallina_pastoril", price: 3000, priceDisplay: "$3.000", unit: "docena", available: "60 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 310, distanceKm: 45, listingType: "oferta" },
  { id: 14, name: "Huevos Araucanos (Verdes)", producer: "Finca La Esperanza", location: "La Plata", category: "Huevos", subcategory: "gallina_pastoril", price: 4200, priceDisplay: "$4.200", unit: "docena", available: "20 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 85, distanceKm: 12, listingType: "oferta" },
  { id: 15, name: "Huevos Doble Yema", producer: "Granja El Retiro", location: "San Vicente", category: "Huevos", subcategory: "gallina_pastoril", price: 4500, priceDisplay: "$4.500", unit: "docena", available: "15 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 60, distanceKm: 45, listingType: "oferta" },
  { id: 16, name: "Huevos de Pato", producer: "Coop. Tierra Viva", location: "Cañuelas", category: "Huevos", subcategory: "pato", price: 5800, priceDisplay: "$5.800", unit: "docena", available: "10 doc/sem", certification: "green", image: "🦆", seasonal: "Ago - Feb", soldCount: 40, distanceKm: 55, listingType: "oferta" },
  { id: 17, name: "Huevos de Codorniz", producer: "Huerta Don Pedro", location: "Moreno", category: "Huevos", subcategory: "codorniz", price: 2800, priceDisplay: "$2.800", unit: "30 uds", available: "25 packs/sem", certification: "yellow", image: "🐣", seasonal: "Todo el año", soldCount: 120, distanceKm: 35, listingType: "oferta" },
  { id: 18, name: "Nodo La Plata - Bolsón Mixto", producer: "Nodo Agroeco La Plata", location: "La Plata", category: "Verduras", price: 5000, priceDisplay: "$5.000", unit: "bolsón", available: "100 bolsones/sem", certification: "green", image: "🧺", seasonal: "Todo el año", soldCount: 500, distanceKm: 10, listingType: "oferta" },
  // Salud Natural (ex Hierbas + Tinturas)
  { id: 19, name: "Manzanilla Orgánica", producer: "Herbario Del Monte", location: "Marcos Paz", category: "Salud Natural", price: 2800, priceDisplay: "$2.800", unit: "100g", available: "50 packs", certification: "green", image: "🌼", seasonal: "Oct - Feb", soldCount: 90, distanceKm: 40, listingType: "oferta" },
  { id: 20, name: "Menta Piperita Seca", producer: "Herbario Del Monte", location: "Marcos Paz", category: "Salud Natural", price: 2500, priceDisplay: "$2.500", unit: "100g", available: "80 packs", certification: "green", image: "🌿", seasonal: "Todo el año", soldCount: 120, distanceKm: 40, listingType: "oferta" },
  { id: 21, name: "Tintura Madre de Valeriana", producer: "Lab. Natural Raíz", location: "La Plata", category: "Salud Natural", price: 5500, priceDisplay: "$5.500", unit: "60ml", available: "30 uds", certification: "green", image: "💧", seasonal: "Todo el año", soldCount: 45, distanceKm: 15, listingType: "oferta" },
  { id: 22, name: "Tintura Madre de Equinácea", producer: "Lab. Natural Raíz", location: "La Plata", category: "Salud Natural", price: 6000, priceDisplay: "$6.000", unit: "60ml", available: "25 uds", certification: "green", image: "💧", seasonal: "Todo el año", soldCount: 55, distanceKm: 15, listingType: "oferta" },
  // Almacén: Yerba Mate
  { id: 23, name: "Yerba Mate Agroecológica", producer: "Coop. Tierra Roja", location: "Misiones", category: "Almacén", subcategory: "yerba_mate", price: 4200, priceDisplay: "$4.200", unit: "kg", available: "500 kg", certification: "green", image: "🧉", seasonal: "Todo el año", soldCount: 680, distanceKm: 1000, listingType: "oferta" },
  { id: 24, name: "Yerba Mate con Hierbas Serranas", producer: "Coop. Tierra Roja", location: "Misiones", category: "Almacén", subcategory: "yerba_mate", price: 4800, priceDisplay: "$4.800", unit: "kg", available: "200 kg", certification: "green", image: "🧉", seasonal: "Todo el año", soldCount: 320, distanceKm: 1000, listingType: "oferta" },
  // Almacén: Productos secos, aceites, etc.
  { id: 25, name: "Arroz Integral Agroecológico", producer: "Coop. Arroceros del Litoral", location: "Entre Ríos", category: "Almacén", subcategory: "cereales", price: 2200, priceDisplay: "$2.200", unit: "kg", available: "1.000 kg", certification: "green", image: "🍚", seasonal: "Todo el año", soldCount: 250, distanceKm: 300, listingType: "oferta" },
  { id: 26, name: "Fideos Artesanales Integrales", producer: "Molino Agroeco", location: "Luján", category: "Almacén", subcategory: "productos_secos", price: 1800, priceDisplay: "$1.800", unit: "500g", available: "200 packs", certification: "green", image: "🍝", seasonal: "Todo el año", soldCount: 180, distanceKm: 60, listingType: "oferta" },
  { id: 27, name: "Aceite de Oliva Extra Virgen", producer: "Finca Del Olivo", location: "Mendoza", category: "Almacén", subcategory: "aceites", price: 8500, priceDisplay: "$8.500", unit: "500ml", available: "100 botellas", certification: "green", image: "🫒", seasonal: "Mar - Jun", soldCount: 95, distanceKm: 1100, listingType: "oferta" },
  { id: 28, name: "Azúcar Mascabo Orgánica", producer: "Ingenio Agroeco", location: "Tucumán", category: "Almacén", subcategory: "azucar", price: 3200, priceDisplay: "$3.200", unit: "kg", available: "300 kg", certification: "green", image: "🍬", seasonal: "Todo el año", soldCount: 210, distanceKm: 1200, listingType: "oferta" },
  { id: 29, name: "Burrito / Poleo Seco", producer: "Herbario Del Monte", location: "Marcos Paz", category: "Salud Natural", price: 2200, priceDisplay: "$2.200", unit: "100g", available: "60 packs", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 75, distanceKm: 40, listingType: "oferta" },
  // Almacén: Conservas
  { id: 30, name: "Salsa de Tomate Casera", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Almacén", subcategory: "conservas", price: 2800, priceDisplay: "$2.800", unit: "frasco 500g", available: "80 uds", certification: "green", image: "🍅", seasonal: "Ene - Abr", soldCount: 110, distanceKm: 25, listingType: "oferta" },
  // Almacén: Mermeladas
  { id: 31, name: "Mermelada de Naranja Amarga", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Almacén", subcategory: "mermeladas", price: 3500, priceDisplay: "$3.500", unit: "frasco 450g", available: "60 uds", certification: "green", image: "🍊", seasonal: "Jun - Ago", soldCount: 70, distanceKm: 25, listingType: "oferta" },
  // Panificados
  { id: 32, name: "Pan Integral de Masa Madre", producer: "Panadería La Miga", location: "La Plata", category: "Panificados", price: 3500, priceDisplay: "$3.500", unit: "kg", available: "30 kg/día", certification: "green", image: "🍞", seasonal: "Todo el año", soldCount: 400, distanceKm: 12, listingType: "oferta" },
  { id: 33, name: "Galletitas de Avena y Miel", producer: "Panadería La Miga", location: "La Plata", category: "Panificados", price: 2800, priceDisplay: "$2.800", unit: "300g", available: "50 packs/sem", certification: "green", image: "🍪", seasonal: "Todo el año", soldCount: 230, distanceKm: 12, listingType: "oferta" },
  // Bebidas
  { id: 34, name: "Jugo de Manzana Natural", producer: "Finca Del Olivo", location: "Mendoza", category: "Bebidas", price: 3200, priceDisplay: "$3.200", unit: "litro", available: "200 litros", certification: "green", image: "🧃", seasonal: "Mar - Jun", soldCount: 140, distanceKm: 1100, listingType: "oferta" },
  // Cosmética Natural
  { id: 35, name: "Jabón Agroecológico de Lavanda", producer: "Herbario Del Monte", location: "Marcos Paz", category: "Cosmética Natural", price: 2500, priceDisplay: "$2.500", unit: "unidad", available: "100 uds", certification: "green", image: "🧼", seasonal: "Todo el año", soldCount: 85, distanceKm: 40, listingType: "oferta" },
  { id: 36, name: "Crema de Caléndula", producer: "Lab. Natural Raíz", location: "La Plata", category: "Cosmética Natural", price: 4500, priceDisplay: "$4.500", unit: "100g", available: "40 uds", certification: "green", image: "🌻", seasonal: "Todo el año", soldCount: 60, distanceKm: 15, listingType: "oferta" },
  // Plantines y Semillas
  { id: 37, name: "Plantines de Tomate (bandeja x12)", producer: "Vivero Raíces", location: "La Plata", category: "Plantines y Semillas", price: 3000, priceDisplay: "$3.000", unit: "bandeja", available: "50 bandejas", certification: "green", image: "🌱", seasonal: "Ago - Nov", soldCount: 150, distanceKm: 12, listingType: "oferta" },
  { id: 38, name: "Semillas de Lechuga Criolla", producer: "Vivero Raíces", location: "La Plata", category: "Plantines y Semillas", price: 1200, priceDisplay: "$1.200", unit: "sobre 5g", available: "200 sobres", certification: "green", image: "🌿", seasonal: "Todo el año", soldCount: 200, distanceKm: 12, listingType: "oferta" },
  // Bio-insumos
  { id: 50, name: "Compost Orgánico Premium", producer: "Compostar BA", location: "CABA", category: "Bio-insumos", price: 1500, priceDisplay: "$1.500", unit: "20kg", available: "5.000 kg/mes", certification: "green", image: "🌱", seasonal: "Todo el año", soldCount: 320, distanceKm: 15, listingType: "oferta" },
  { id: 51, name: "Humus de Lombriz", producer: "Lombricultura del Sur", location: "Florencio Varela", category: "Bio-insumos", price: 2200, priceDisplay: "$2.200", unit: "10kg", available: "1.500 kg", certification: "green", image: "🪱", seasonal: "Todo el año", soldCount: 180, distanceKm: 28, listingType: "oferta" },
  { id: 52, name: "Biopreparado Sulfocálcico", producer: "Bio-insumos La Tierra", location: "La Plata", category: "Bio-insumos", price: 3500, priceDisplay: "$3.500", unit: "5L", available: "200 bidones", certification: "green", image: "🧪", seasonal: "Todo el año", soldCount: 95, distanceKm: 12, listingType: "oferta" },
  { id: 53, name: "Trichoderma (controlador biológico)", producer: "Bio-insumos La Tierra", location: "La Plata", category: "Bio-insumos", price: 4800, priceDisplay: "$4.800", unit: "1kg", available: "120 kg", certification: "green", image: "🦠", seasonal: "Todo el año", soldCount: 60, distanceKm: 12, listingType: "oferta" },
  { id: 54, name: "Caldo Bordelés Casero", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Bio-insumos", price: 2800, priceDisplay: "$2.800", unit: "5L", available: "100 bidones", certification: "green", image: "🌿", seasonal: "Todo el año", soldCount: 75, distanceKm: 25, listingType: "oferta" },
  // Plantines y Semillas — más variedad
  { id: 55, name: "Semillas Criollas de Maíz", producer: "Semillero Nativo", location: "Marcos Paz", category: "Plantines y Semillas", price: 1800, priceDisplay: "$1.800", unit: "sobre 50g", available: "150 sobres", certification: "green", image: "🌽", seasonal: "Ago - Nov", soldCount: 130, distanceKm: 40, listingType: "oferta" },
  { id: 56, name: "Kit Huerta Criolla (12 variedades)", producer: "Semillero Nativo", location: "Marcos Paz", category: "Plantines y Semillas", price: 6500, priceDisplay: "$6.500", unit: "kit", available: "80 kits", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 210, distanceKm: 40, listingType: "oferta" },
  { id: 57, name: "Plantines Aromáticas Surtidos", producer: "Vivero Raíces", location: "La Plata", category: "Plantines y Semillas", price: 2500, priceDisplay: "$2.500", unit: "bandeja x6", available: "100 bandejas", certification: "green", image: "🌿", seasonal: "Sep - Mar", soldCount: 165, distanceKm: 12, listingType: "oferta" },

  // ── DEMANDA ──
  { id: 101, name: "Verduras de Hoja (variadas)", producer: "Restaurante Raíz", location: "CABA", category: "Verduras", price: 1000, priceDisplay: "$1.000", unit: "kg", available: "Necesita 50 kg/sem", certification: "green", image: "🥬", seasonal: "Todo el año", soldCount: 0, distanceKm: 20, listingType: "demanda" },
  { id: 102, name: "Huevos Pastoriles", producer: "Comedor Comunitario Sol", location: "Quilmes", category: "Huevos", subcategory: "gallina_pastoril", price: 3000, priceDisplay: "$3.000", unit: "docena", available: "Necesita 30 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 0, distanceKm: 18, listingType: "demanda" },
  { id: 103, name: "Frutas de Estación", producer: "Dietética Vida Sana", location: "CABA", category: "Frutas", price: 1800, priceDisplay: "$1.800", unit: "kg", available: "Necesita 40 kg/sem", certification: "yellow", image: "🍎", seasonal: "Todo el año", soldCount: 0, distanceKm: 22, listingType: "demanda" },
  { id: 104, name: "Harina Integral a Granel", producer: "Nodo Consumo Almagro", location: "CABA", category: "Almacén", subcategory: "cereales", price: 2000, priceDisplay: "$2.000", unit: "kg", available: "Necesita 100 kg/mes", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 0, distanceKm: 15, listingType: "demanda" },
  { id: 105, name: "Lácteos Artesanales", producer: "Escuela Rural N°5", location: "San Vicente", category: "Lácteos", price: 5000, priceDisplay: "$5.000", unit: "kg", available: "Necesita 20 kg/sem", certification: "green", image: "🧀", seasonal: "Todo el año", soldCount: 0, distanceKm: 48, listingType: "demanda" },
  { id: 106, name: "Conservas y Dulces", producer: "Banco de Alimentos BA", location: "CABA", category: "Almacén", subcategory: "conservas", price: 3500, priceDisplay: "$3.500", unit: "frasco", available: "Necesita 200 uds/mes", certification: "green", image: "🍯", seasonal: "Todo el año", soldCount: 0, distanceKm: 25, listingType: "demanda" },
  { id: 107, name: "Yerba Mate y Hierbas", producer: "Dietética Raíces", location: "CABA", category: "Almacén", subcategory: "yerba_mate", price: 4000, priceDisplay: "$4.000", unit: "kg", available: "Necesita 50 kg/mes", certification: "green", image: "🧉", seasonal: "Todo el año", soldCount: 0, distanceKm: 20, listingType: "demanda" },
  { id: 108, name: "Tinturas y Hierbas Medicinales", producer: "Dietética Vida Sana", location: "CABA", category: "Salud Natural", price: 5000, priceDisplay: "$5.000", unit: "60ml", available: "Necesita 20 uds/mes", certification: "green", image: "💧", seasonal: "Todo el año", soldCount: 0, distanceKm: 22, listingType: "demanda" },
  { id: 109, name: "Alimentos Mixtos (conv./agroeco.)", producer: "Almacén Natural y Más", location: "CABA", category: "Mercado Híbrido", price: 2000, priceDisplay: "$2.000", unit: "kg", available: "Necesita variado/mes", certification: "yellow", image: "🔄", seasonal: "Todo el año", soldCount: 0, distanceKm: 18, listingType: "demanda" },
];

const isInSeason = (seasonal: string): boolean => {
  if (seasonal === "Todo el año") return true;
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentMonth = new Date().getMonth();
  const parts = seasonal.split(" - ");
  if (parts.length !== 2) return false;
  const start = months.indexOf(parts[0]);
  const end = months.indexOf(parts[1]);
  if (start === -1 || end === -1) return false;
  if (start <= end) return currentMonth >= start && currentMonth <= end;
  return currentMonth >= start || currentMonth <= end;
};

interface SellerReview {
  id: string;
  seller_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const MarketplacePage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isEnabled } = useDataSources();
  const sourceParam = searchParams.get("source") as ProductSource | null;
  const nodeParam = searchParams.get("node");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeAlmacenSub, setActiveAlmacenSub] = useState("all_almacen");
  const [activeEggSub, setActiveEggSub] = useState("all_eggs");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filterProducer, setFilterProducer] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterType, setFilterType] = useState<"all" | ListingType>("all");
  const [mtrProducts, setMtrProducts] = useState<Product[]>([]);

  // Static catalogs from integrated layers (El Click & El Brote)
  const elClickProducts = useMemo<Product[]>(() => {
    const sellos = (elClickData.certifications || []).map((c: any) => ({ code: c.code, name: c.name }));
    return (elClickData.products || []).map((p: any, i: number) => ({
      id: 2_000_000 + i,
      name: p.name,
      producer: elClickData.store.name,
      location: elClickData.store.location,
      category: p.category,
      price: p.price,
      priceDisplay: `$${p.price.toLocaleString("es-AR")}`,
      unit: p.unit,
      available: "Disponible",
      certification: "yellow" as const,
      image: p.image,
      seasonal: "Estacional",
      soldCount: 0,
      distanceKm: 0,
      listingType: "oferta" as const,
      sellos,
      source: "el_click" as ProductSource,
      sourceUrl: elClickData.store.url,
      description: p.description,
    }));
  }, []);

  const elBroteProducts = useMemo<Product[]>(() => {
    const sellos = (elBroteData.certifications || []).map((c: any) => ({ code: c.code, name: c.name }));
    return (elBroteData.products || []).map((p: any, i: number) => ({
      id: 3_000_000 + i,
      name: p.name,
      producer: elBroteData.store.name,
      location: elBroteData.store.location,
      category: p.category,
      price: p.price,
      priceDisplay: `$${p.price.toLocaleString("es-AR")}`,
      unit: p.unit,
      available: "Disponible",
      certification: "yellow" as const,
      image: p.image,
      seasonal: "Estacional",
      soldCount: 0,
      distanceKm: 0,
      listingType: "oferta" as const,
      sellos,
      source: "el_brote" as ProductSource,
      sourceUrl: elBroteData.store.url,
      description: p.description,
    }));
  }, []);

  // Reviews state
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [reviewSeller, setReviewSeller] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase.from("seller_reviews").select("*").order("created_at", { ascending: false });
      if (data) setReviews(data as SellerReview[]);
    };
    fetchReviews();
  }, []);

  // Fetch MTR catalog (cached from tiendaschasqui.ar/mtr/catalogo)
  useEffect(() => {
    (async () => {
      const [facetsRes, productsRes] = await Promise.all([
        (supabase as any).from("mtr_facets").select("code,name,facet_code"),
        (supabase as any).from("mtr_products").select("*").order("name"),
      ]);
      const fmap = new Map<string, { name: string; group: string | null }>();
      (facetsRes.data || []).forEach((f: any) =>
        fmap.set(f.code, { name: f.name, group: f.facet_code })
      );
      const mapped: Product[] = (productsRes.data || []).map((p: any, idx: number) => {
        const sellos = (p.facet_value_ids || [])
          .map((id: string) => {
            const f = fmap.get(id);
            return f && f.group === "sello_producto" ? { code: id, name: f.name } : null;
          })
          .filter(Boolean) as { code: string; name: string }[];
        const price = (p.price_cents ?? 0) / 100;
        return {
          id: 1_000_000 + idx,
          name: p.name,
          producer: "Mercado Territorial",
          location: "Red MTR",
          category: "Mercado Híbrido",
          price,
          priceDisplay: `$${price.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`,
          unit: "u",
          available: p.in_stock ? "Disponible" : "Sin stock",
          certification: "green" as const,
          image: "🛒",
          seasonal: "Todo el año",
          soldCount: 0,
          distanceKm: 0,
          listingType: "oferta" as const,
          imageUrl: p.image_url || undefined,
          sellos,
          source: "mercado_territorial",
          sourceUrl: p.source_url || `https://tiendaschasqui.ar/mtr/catalogo/${p.slug || ""}`,
          description: p.description || undefined,
        };
      });
      setMtrProducts(mapped);
    })();
  }, []);

  const getSellerRating = (sellerName: string) => {
    const sellerReviews = reviews.filter(r => r.seller_name === sellerName);
    if (sellerReviews.length === 0) return { avg: 0, count: 0 };
    const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
    return { avg: Math.round(avg * 10) / 10, count: sellerReviews.length };
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewSeller) return;
    setReviewSubmitting(true);
    const { error } = await supabase.from("seller_reviews").insert({
      reviewer_id: user.id,
      seller_name: reviewSeller,
      rating: reviewRating,
      comment: reviewComment || null,
    } as any);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("market.review_thanks"));
      // Refresh reviews
      const { data } = await supabase.from("seller_reviews").select("*").order("created_at", { ascending: false });
      if (data) setReviews(data as SellerReview[]);
      setReviewSeller(null);
      setReviewRating(5);
      setReviewComment("");
    }
    setReviewSubmitting(false);
  };

  // Read URL params from map links
  useEffect(() => {
    const producerParam = searchParams.get("producer");
    const searchParam = searchParams.get("search");
    if (producerParam) setFilterProducer(producerParam);
    if (searchParam) setSearch(searchParam);
  }, [searchParams]);

  const certLabels = { red: t("cert.red"), yellow: t("cert.yellow"), green: t("cert.green") };

  const producers = useMemo(() => [...new Set(mockProducts.map(p => p.producer))].sort(), []);
  const zones = useMemo(() => [...new Set(mockProducts.map(p => p.location))].sort(), []);

  const sortOptions: { value: SortOption; label: string; icon: typeof Star }[] = [
    { value: "relevance", label: t("market.sort.relevance"), icon: Star },
    { value: "price_asc", label: t("market.sort.price_asc"), icon: DollarSign },
    { value: "price_desc", label: t("market.sort.price_desc"), icon: DollarSign },
    { value: "proximity", label: t("market.sort.proximity"), icon: Navigation },
    { value: "best_seller", label: t("market.sort.best_seller"), icon: TrendingUp },
    { value: "cert_green", label: t("market.sort.cert_green"), icon: ShieldCheck },
    { value: "seasonal", label: t("market.sort.seasonal"), icon: Calendar },
  ];

  const filtered = useMemo(() => {
    const baseMock: Product[] = mockProducts.map(p => ({ ...p, source: (p as Product).source || "mock" }));
    const merged: Product[] = [
      ...baseMock,
      ...(isEnabled("mercado_territorial") ? mtrProducts : []),
    ];
    const sourceScoped = sourceParam
      ? merged.filter(p => p.source === sourceParam)
      : merged;
    let results = sourceScoped.filter((p) => {
      const isMtr = p.source === "mercado_territorial";
      if (activeCategory !== "Todos" && p.category !== activeCategory) return false;
      if (activeCategory === "Huevos" && activeEggSub !== "all_eggs" && p.subcategory !== activeEggSub) return false;
      if (activeCategory === "Almacén" && activeAlmacenSub !== "all_almacen" && p.subcategory !== activeAlmacenSub) return false;
      if (!isMtr && filterProducer !== "all" && p.producer !== filterProducer) return false;
      if (!isMtr && filterZone !== "all" && p.location !== filterZone) return false;
      if (filterType !== "all" && p.listingType !== filterType) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.producer.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    const sorted = [...results];
    switch (sortBy) {
      case "price_asc": sorted.sort((a, b) => a.price - b.price); break;
      case "price_desc": sorted.sort((a, b) => b.price - a.price); break;
      case "proximity": sorted.sort((a, b) => a.distanceKm - b.distanceKm); break;
      case "best_seller": sorted.sort((a, b) => b.soldCount - a.soldCount); break;
      case "cert_green":
        const certOrder = { green: 0, yellow: 1, red: 2 };
        sorted.sort((a, b) => certOrder[a.certification] - certOrder[b.certification]); break;
      case "seasonal":
        sorted.sort((a, b) => (isInSeason(a.seasonal) ? 0 : 1) - (isInSeason(b.seasonal) ? 0 : 1)); break;
    }
    return sorted;
  }, [search, activeCategory, activeEggSub, activeAlmacenSub, sortBy, filterProducer, filterZone, filterType, mtrProducts, isEnabled, sourceParam]);

  const hasActiveFilters = filterProducer !== "all" || filterZone !== "all" || filterType !== "all" || sortBy !== "relevance";

  const getCategoryLabel = (cat: string) => {
    if (cat === "Todos") return t("market.all");
    return t(`cat.${cat}`) || cat;
  };

  const clearAllFilters = () => {
    setFilterProducer("all");
    setFilterZone("all");
    setFilterType("all");
    setSortBy("relevance");
    setSearch("");
    setActiveCategory("Todos");
    setActiveEggSub("all_eggs");
    setActiveAlmacenSub("all_almacen");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-hero py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-white mb-2">{t("market.title")}</h1>
            <p className="text-white/70 max-w-xl">{t("market.subtitle")}</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Source banner (from map MTR node clicks) */}
          {sourceParam === "mercado_territorial" && (
            <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
              <ShoppingBasket className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-sm text-amber-900">
                  Catálogo del Mercado Territorial
                  {nodeParam && <> · Nodo: <span className="font-bold">{decodeURIComponent(nodeParam)}</span></>}
                </h3>
                <p className="text-xs text-amber-800/80 mt-1">
                  Productos sincronizados desde{" "}
                  <a href="https://tiendaschasqui.ar/mtr/catalogo" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    tiendaschasqui.ar/mtr/catalogo
                  </a>. La compra se gestiona en el sitio original.
                </p>
              </div>
              <a
                href={window.location.pathname}
                className="text-xs text-amber-900 underline whitespace-nowrap"
              >
                Ver todos
              </a>
            </div>
          )}

          {/* Trust warning - moved to bottom */}
          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("market.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-56">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-3.5 w-3.5 text-muted-foreground" />{opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter row: Type, Producer, Zone */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | ListingType)}>
              <SelectTrigger className="w-full sm:w-52">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("market.filter.type_all")}</SelectItem>
                <SelectItem value="oferta">
                  <span className="flex items-center gap-2">🟢 {t("market.filter.oferta")}</span>
                </SelectItem>
                <SelectItem value="demanda">
                  <span className="flex items-center gap-2">🔴 {t("market.filter.demanda")}</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProducer} onValueChange={setFilterProducer}>
              <SelectTrigger className="w-full sm:w-52">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("market.filter.producer_all")}</SelectItem>
                {producers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("market.filter.zone_all")}</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {mainCategories.map((cat) => (
              <button key={cat} onClick={() => {
                setActiveCategory(cat);
                if (cat !== "Huevos") setActiveEggSub("all_eggs");
                if (cat !== "Almacén") setActiveAlmacenSub("all_almacen");
              }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}>{getCategoryLabel(cat)}</button>
            ))}
          </div>

          {/* Almacén subcategory filter */}
          <AnimatePresence>
            {activeCategory === "Almacén" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-4 overflow-hidden">
                {almacenSubcategories.map((sub) => (
                  <button key={sub} onClick={() => setActiveAlmacenSub(sub)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeAlmacenSub === sub ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:border-secondary/40"
                    }`}>{t(`almacen.${sub}`)}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Egg subcategory filter */}
          <AnimatePresence>
            {activeCategory === "Huevos" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-4 overflow-hidden">
                {eggSubcategories.map((sub) => (
                  <button key={sub} onClick={() => setActiveEggSub(sub)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeEggSub === sub ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card text-muted-foreground hover:border-secondary/40"
                    }`}>{t(`egg.${sub}`)}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count + clear */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{filtered.length} {t("market.products_available")}</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-xs text-primary hover:text-primary/80 transition-colors underline">
                {t("market.clear_filters")}
              </button>
            )}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`rounded-xl border overflow-hidden hover:shadow-elevated transition-all duration-300 group ${
                    p.listingType === "demanda" ? "border-destructive/30 bg-card" : "border-border bg-card"
                  }`}>
                  <div className="h-36 bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl">{p.image}</span>
                    )}
                    <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.listingType === "oferta"
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}>
                      {p.listingType === "oferta" ? t("market.badge_oferta") : t("market.badge_demanda")}
                    </span>
                    {p.source === "mercado_territorial" && (
                      <span className="absolute top-2 right-2 bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-300 uppercase tracking-wide shadow-sm">
                        Mercado Territorial
                      </span>
                    )}
                    {isInSeason(p.seasonal) && p.listingType === "oferta" && (
                      <span className={`absolute ${p.source === "mercado_territorial" ? "top-9" : "top-2"} right-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                        {t("market.in_season")}
                      </span>
                    )}
                    {p.soldCount >= 300 && (
                      <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {t("market.popular")}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-base text-card-foreground">{p.name}</h3>
                      <span className={`inline-flex w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                        p.certification === "green" ? "bg-primary" : p.certification === "yellow" ? "bg-wheat" : "bg-destructive"
                      }`} title={certLabels[p.certification]} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilterProducer(p.producer); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors text-left font-medium"
                      >
                        {p.producer}
                      </button>
                      {p.subcategory && (
                        <Badge variant="outline" className="text-[10px]">
                          {activeCategory === "Almacén" ? t(`almacen.${p.subcategory}`) : t(`egg.${p.subcategory}`)}
                        </Badge>
                      )}
                    </div>
                    {p.sellos && p.sellos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.sellos.map((s) => (
                          <Badge key={s.code} variant="secondary" className="text-[9px] bg-primary/10 text-primary border border-primary/20">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Seller rating */}
                    {(() => {
                      const { avg, count } = getSellerRating(p.producer);
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReviewSeller(p.producer); }}
                          className="flex items-center gap-1 mb-1 group/stars"
                        >
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${count > 0 && s <= Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground group-hover/stars:text-primary transition-colors">
                            {count > 0 ? `${avg} (${count})` : t("market.no_reviews")}
                          </span>
                          <MessageSquare className="h-2.5 w-2.5 text-muted-foreground/40 group-hover/stars:text-primary transition-colors" />
                        </button>
                      );
                    })()}
                    {/* More from this seller / nearby sellers */}
                    {(() => {
                      const sellerOtherCount = mockProducts.filter(pp => pp.producer === p.producer && pp.id !== p.id).length;
                      const nearbyCount = mockProducts.filter(pp => pp.producer !== p.producer && pp.location === p.location).length;
                      return (sellerOtherCount > 0 || nearbyCount > 0) ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {sellerOtherCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setFilterProducer(p.producer); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Store className="h-2.5 w-2.5" />
                              {sellerOtherCount} más de este vendedor
                            </button>
                          )}
                          {nearbyCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setFilterZone(p.location); setFilterProducer("all"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <MapPin className="h-2.5 w-2.5" />
                              {nearbyCount} en {p.location}
                            </button>
                          )}
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {p.location}
                        <span className="text-muted-foreground/60">· {p.distanceKm} km</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBasket className="h-3 w-3" /> {p.available}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> {p.seasonal}
                      </div>
                      {p.listingType === "oferta" && p.soldCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3" /> {p.soldCount} {t("market.sold")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg text-foreground">
                        {p.priceDisplay}<span className="text-sm text-muted-foreground font-body">/{p.unit}</span>
                      </span>
                      {p.source === "mercado_territorial" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-amber-400 text-amber-900 hover:bg-amber-50"
                          asChild
                        >
                          <a href={p.sourceUrl || "https://tiendaschasqui.ar/mtr/catalogo"} target="_blank" rel="noopener noreferrer">
                            Comprar en MTR <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" className={`text-xs ${
                          p.listingType === "oferta"
                            ? "bg-gradient-hero text-primary-foreground"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        }`}
                          onClick={() => addItem({ id: p.id, name: p.name, producer: p.producer, location: p.location, price: p.price, priceDisplay: p.priceDisplay, unit: p.unit, image: p.image })}>
                          {p.listingType === "oferta" ? t("market.add_cart") : t("market.contact")}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

           {/* Disclaimer - prominent warning */}
          <div className="mt-12 mb-4 border-2 border-destructive/30 rounded-xl bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-display text-sm text-foreground">{t("market.disclaimer_title")}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t("market.disclaimer_text")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t("market.disclaimer_categories")}</p>
              </div>
            </div>
          </div>

          {/* Review dialog */}
          <Dialog open={!!reviewSeller} onOpenChange={(open) => { if (!open) setReviewSeller(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t("market.write_review")}: {reviewSeller}
                </DialogTitle>
              </DialogHeader>
              {user ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Calificación</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setReviewRating(s)} className="transition-transform hover:scale-110">
                          <Star className={`h-7 w-7 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t("market.review_placeholder")}
                    rows={3}
                  />
                  <Button onClick={handleSubmitReview} disabled={reviewSubmitting} className="w-full bg-gradient-hero text-primary-foreground">
                    {reviewSubmitting ? "Enviando..." : t("market.review_submit")}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("market.review_login")}</p>
              )}

              {/* Existing reviews for this seller */}
              {reviews.filter(r => r.seller_name === reviewSeller).length > 0 && (
                <div className="border-t border-border pt-4 mt-2 space-y-3 max-h-60 overflow-y-auto">
                  {reviews.filter(r => r.seller_name === reviewSeller).map((r) => (
                    <div key={r.id} className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
      <DataSourceToggle position="bottom-6 right-6" />
    </div>
  );
};

export default MarketplacePage;
