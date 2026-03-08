import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, MapPin, Calendar, ShoppingBasket,
  TrendingUp, DollarSign, Navigation, ShieldCheck, Star, SlidersHorizontal, Store, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

type SortOption = "relevance" | "price_asc" | "price_desc" | "proximity" | "best_seller" | "cert_green" | "seasonal";
type ListingType = "oferta" | "demanda";

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
}

const categoriesKeys = ["Todos", "Verduras", "Frutas", "Lácteos", "Huevos", "Cereales", "Conservas", "Miel", "Carnes"];

const mockProducts: Product[] = [
  // ── OFERTA (productores, cooperativas, nodos agroecológicos venden) ──
  { id: 1, name: "Tomate Platense", producer: "Finca La Esperanza", location: "La Plata", category: "Verduras", price: 1200, priceDisplay: "$1.200", unit: "kg", available: "500 kg", certification: "green", image: "🍅", seasonal: "Oct - Mar", soldCount: 340, distanceKm: 12, listingType: "oferta" },
  { id: 2, name: "Lechuga Criolla", producer: "Finca La Esperanza", location: "La Plata", category: "Verduras", price: 800, priceDisplay: "$800", unit: "kg", available: "200 kg", certification: "green", image: "🥬", seasonal: "Todo el año", soldCount: 280, distanceKm: 12, listingType: "oferta" },
  { id: 3, name: "Miel Multifloral", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Miel", price: 4500, priceDisplay: "$4.500", unit: "kg", available: "150 kg", certification: "green", image: "🍯", seasonal: "Feb - May", soldCount: 150, distanceKm: 25, listingType: "oferta" },
  { id: 4, name: "Huevos Pastoril Colorados", producer: "Granja El Retiro", location: "San Vicente", category: "Huevos", subcategory: "gallina_pastoril", price: 3200, priceDisplay: "$3.200", unit: "docena", available: "80 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 420, distanceKm: 45, listingType: "oferta" },
  { id: 5, name: "Zapallo Anco", producer: "Huerta Don Pedro", location: "Moreno", category: "Verduras", price: 900, priceDisplay: "$900", unit: "kg", available: "800 kg", certification: "yellow", image: "🎃", seasonal: "Mar - Jul", soldCount: 190, distanceKm: 35, listingType: "oferta" },
  { id: 6, name: "Harina Integral", producer: "Molino Agroeco", location: "Luján", category: "Cereales", price: 2100, priceDisplay: "$2.100", unit: "kg", available: "1.000 kg", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 310, distanceKm: 60, listingType: "oferta" },
  { id: 7, name: "Dulce de Durazno", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Conservas", price: 3800, priceDisplay: "$3.800", unit: "frasco 500g", available: "120 uds", certification: "green", image: "🍑", seasonal: "Ene - Mar", soldCount: 95, distanceKm: 25, listingType: "oferta" },
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

  // ── DEMANDA (restaurantes, comedores, dietéticas, nodos de consumo buscan) ──
  { id: 101, name: "Verduras de Hoja (variadas)", producer: "Restaurante Raíz", location: "CABA", category: "Verduras", price: 1000, priceDisplay: "$1.000", unit: "kg", available: "Necesita 50 kg/sem", certification: "green", image: "🥬", seasonal: "Todo el año", soldCount: 0, distanceKm: 20, listingType: "demanda" },
  { id: 102, name: "Huevos Pastoriles", producer: "Comedor Comunitario Sol", location: "Quilmes", category: "Huevos", subcategory: "gallina_pastoril", price: 3000, priceDisplay: "$3.000", unit: "docena", available: "Necesita 30 doc/sem", certification: "green", image: "🥚", seasonal: "Todo el año", soldCount: 0, distanceKm: 18, listingType: "demanda" },
  { id: 103, name: "Frutas de Estación", producer: "Dietética Vida Sana", location: "CABA", category: "Frutas", price: 1800, priceDisplay: "$1.800", unit: "kg", available: "Necesita 40 kg/sem", certification: "yellow", image: "🍎", seasonal: "Todo el año", soldCount: 0, distanceKm: 22, listingType: "demanda" },
  { id: 104, name: "Harina Integral a Granel", producer: "Nodo Consumo Almagro", location: "CABA", category: "Cereales", price: 2000, priceDisplay: "$2.000", unit: "kg", available: "Necesita 100 kg/mes", certification: "green", image: "🌾", seasonal: "Todo el año", soldCount: 0, distanceKm: 15, listingType: "demanda" },
  { id: 105, name: "Lácteos Artesanales", producer: "Escuela Rural N°5", location: "San Vicente", category: "Lácteos", price: 5000, priceDisplay: "$5.000", unit: "kg", available: "Necesita 20 kg/sem", certification: "green", image: "🧀", seasonal: "Todo el año", soldCount: 0, distanceKm: 48, listingType: "demanda" },
  { id: 106, name: "Conservas y Dulces", producer: "Banco de Alimentos BA", location: "CABA", category: "Conservas", price: 3500, priceDisplay: "$3.500", unit: "frasco", available: "Necesita 200 uds/mes", certification: "green", image: "🍯", seasonal: "Todo el año", soldCount: 0, distanceKm: 25, listingType: "demanda" },
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

const eggSubcategories = ["all_eggs", "gallina_pastoril", "pato", "codorniz"];

const MarketplacePage = () => {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeEggSub, setActiveEggSub] = useState("all_eggs");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filterProducer, setFilterProducer] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterType, setFilterType] = useState<"all" | ListingType>("all");

  const certLabels = { red: t("cert.red"), yellow: t("cert.yellow"), green: t("cert.green") };

  // Derive unique producers and zones from data
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
    let results = mockProducts.filter((p) => {
      if (activeCategory !== "Todos" && p.category !== activeCategory) return false;
      if (activeCategory === "Huevos" && activeEggSub !== "all_eggs" && p.subcategory !== activeEggSub) return false;
      if (filterProducer !== "all" && p.producer !== filterProducer) return false;
      if (filterZone !== "all" && p.location !== filterZone) return false;
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
  }, [search, activeCategory, activeEggSub, sortBy, filterProducer, filterZone, filterType]);

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
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-hero py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-primary-foreground mb-2">{t("market.title")}</h1>
            <p className="text-primary-foreground/70 max-w-xl">{t("market.subtitle")}</p>
          </div>
        </div>

        <div className="container py-8">
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
            {/* Oferta / Demanda */}
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

            {/* Producer */}
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

            {/* Zone */}
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
            {categoriesKeys.map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); if (cat !== "Huevos") setActiveEggSub("all_eggs"); }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}>{getCategoryLabel(cat)}</button>
            ))}
          </div>

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
                  <div className="h-36 bg-muted flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300 relative">
                    {p.image}
                    {/* Oferta / Demanda badge */}
                    <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.listingType === "oferta"
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}>
                      {p.listingType === "oferta" ? t("market.badge_oferta") : t("market.badge_demanda")}
                    </span>
                    {isInSeason(p.seasonal) && p.listingType === "oferta" && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
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
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm text-muted-foreground">{p.producer}</p>
                      {p.subcategory && (
                        <Badge variant="outline" className="text-[10px]">{t(`egg.${p.subcategory}`)}</Badge>
                      )}
                    </div>

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
                      <Button size="sm" className={`text-xs ${
                        p.listingType === "oferta"
                          ? "bg-gradient-hero text-primary-foreground"
                          : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      }`}
                        onClick={() => addItem({ id: p.id, name: p.name, producer: p.producer, location: p.location, price: p.price, priceDisplay: p.priceDisplay, unit: p.unit, image: p.image })}>
                        {p.listingType === "oferta" ? t("market.add_cart") : t("market.contact")}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarketplacePage;
