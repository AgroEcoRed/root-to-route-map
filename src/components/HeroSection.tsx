import { motion } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Campo agroecológico"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/90 via-forest/70 to-forest/40" />
      </div>

      <div className="container relative z-10 pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-wheat/20 text-wheat text-sm font-medium mb-6">
              <ShieldCheck className="h-4 w-4" />
              Trazabilidad · Certificación Participativa · Cadenas Cortas
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight text-primary-foreground mb-6"
          >
            La red que conecta el campo agroecológico con tu mesa
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-primary-foreground/80 mb-8 max-w-xl"
          >
            Mapa interactivo, marketplace y trazabilidad para productores, cooperativas, comedores, restaurantes y consumidores. Construyamos juntos cadenas cortas de comercialización agroecológica.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button size="lg" className="bg-wheat text-wheat-foreground hover:bg-wheat/90 font-semibold text-base" asChild>
              <Link to="/mapa">
                <MapPin className="h-5 w-5 mr-2" />
                Explorar el Mapa
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/mercado">
                Ver Mercado
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex gap-8 mt-12 pt-8 border-t border-primary-foreground/20"
          >
            {[
              { num: "1,200+", label: "Productores" },
              { num: "340", label: "Puntos de venta" },
              { num: "85", label: "Comedores" },
              { num: "12", label: "Regiones" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-display text-wheat">{s.num}</div>
                <div className="text-sm text-primary-foreground/60">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
