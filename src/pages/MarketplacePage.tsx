import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, ShoppingBasket, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  producer: string;
  location: string;
  category: string;
  price: string;
  unit: string;
  available: string;
  certification: "red" | "yellow" | "green";
  image: string;
  seasonal: string;
}

const categories = ["Todos", "Verduras", "Frutas", "Lácteos", "Huevos", "Cereales", "Conservas", "Miel", "Carnes"];

const certLabels = { red: "Básico", yellow: "En proceso", green: "Certificado" };

const mockProducts: Product[] = [
  { id: 1, name: "Tomate Platense", producer: "Finca La Esperanza", location: "La Plata, Buenos Aires", category: "Verduras", price: "$1.200", unit: "kg", available: "500 kg", certification: "green", image: "🍅", seasonal: "Oct - Mar" },
  { id: 2, name: "Lechuga Criolla", producer: "Finca La Esperanza", location: "La Plata, Buenos Aires", category: "Verduras", price: "$800", unit: "kg", available: "200 kg", certification: "green", image: "🥬", seasonal: "Todo el año" },
  { id: 3, name: "Miel Multifloral", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Miel", price: "$4.500", unit: "kg", available: "150 kg", certification: "green", image: "🍯", seasonal: "Feb - May" },
  { id: 4, name: "Huevos de Campo", producer: "Granja El Retiro", location: "San Vicente", category: "Huevos", price: "$3.200", unit: "docena", available: "80 docenas/sem", certification: "green", image: "🥚", seasonal: "Todo el año" },
  { id: 5, name: "Zapallo Anco", producer: "Huerta Don Pedro", location: "Moreno", category: "Verduras", price: "$900", unit: "kg", available: "800 kg", certification: "yellow", image: "🎃", seasonal: "Mar - Jul" },
  { id: 6, name: "Harina de Trigo Integral", producer: "Molino Agroeco", location: "Luján", category: "Cereales", price: "$2.100", unit: "kg", available: "1.000 kg", certification: "green", image: "🌾", seasonal: "Todo el año" },
  { id: 7, name: "Dulce de Durazno", producer: "Cooperativa Del Sol", location: "Florencio Varela", category: "Conservas", price: "$3.800", unit: "frasco 500g", available: "120 unidades", certification: "green", image: "🍑", seasonal: "Ene - Mar" },
  { id: 8, name: "Pollo Entero Pastoril", producer: "Granja El Retiro", location: "San Vicente", category: "Carnes", price: "$5.500", unit: "kg", available: "50 unidades/sem", certification: "green", image: "🍗", seasonal: "Todo el año" },
  { id: 9, name: "Naranjas de Quinta", producer: "Huerta Don Pedro", location: "Moreno", category: "Frutas", price: "$1.500", unit: "kg", available: "300 kg", certification: "yellow", image: "🍊", seasonal: "Jun - Oct" },
  { id: 10, name: "Queso Criollo Artesanal", producer: "Coop. Tierra Viva", location: "Cañuelas", category: "Lácteos", price: "$6.200", unit: "kg", available: "40 kg/sem", certification: "green", image: "🧀", seasonal: "Todo el año" },
  { id: 11, name: "Acelga de Hoja", producer: "Coop. Tierra Viva", location: "Cañuelas", category: "Verduras", price: "$700", unit: "atado", available: "300 atados", certification: "green", image: "🥗", seasonal: "Mar - Nov" },
  { id: 12, name: "Choclo Fresco", producer: "Huerta Don Pedro", location: "Moreno", category: "Verduras", price: "$600", unit: "unidad", available: "1.000 unidades", certification: "yellow", image: "🌽", seasonal: "Dic - Mar" },
];

const MarketplacePage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      if (activeCategory !== "Todos" && p.category !== activeCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.producer.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="bg-gradient-hero py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-primary-foreground mb-2">
              Mercado Agroecológico
            </h1>
            <p className="text-primary-foreground/70 max-w-xl">
              Productos frescos directamente de productores agroecológicos certificados. Sin intermediarios, con trazabilidad completa.
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto o productor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} productos disponibles</p>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-elevated transition-all duration-300 group"
              >
                <div className="h-36 bg-muted flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                  {p.image}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display text-base text-card-foreground">{p.name}</h3>
                    <span className={`inline-flex w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                      p.certification === "green" ? "bg-primary" : p.certification === "yellow" ? "bg-wheat" : "bg-destructive"
                    }`} title={certLabels[p.certification]} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{p.producer}</p>

                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShoppingBasket className="h-3 w-3" /> {p.available}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {p.seasonal}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-foreground">
                      {p.price}<span className="text-sm text-muted-foreground font-body">/{p.unit}</span>
                    </span>
                    <Button size="sm" className="bg-gradient-hero text-primary-foreground text-xs">
                      Contactar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarketplacePage;
