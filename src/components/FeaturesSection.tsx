import { motion } from "framer-motion";
import {
  MapPin,
  ShoppingBasket,
  QrCode,
  ShieldCheck,
  Truck,
  MessageCircle,
  BarChart3,
  Leaf,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Mapa Agroecológico",
    description: "Visualiza productores, cooperativas, comedores y puntos de venta geolocalizados con filtros por producto y certificación.",
    color: "bg-primary text-primary-foreground",
  },
  {
    icon: ShoppingBasket,
    title: "Marketplace",
    description: "Oferta y demanda de alimentos agroecológicos con matching automático por proximidad geográfica.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: QrCode,
    title: "Trazabilidad QR",
    description: "Cada lote con código QR para rastrear origen, método de producción, fecha de cosecha y ruta de transporte.",
    color: "bg-leaf text-leaf-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Certificación Participativa",
    description: "Sistema de garantía participativa con niveles de verificación y validación comunitaria.",
    color: "bg-wheat text-wheat-foreground",
  },
  {
    icon: Truck,
    title: "Logística Compartida",
    description: "Mapeo de rutas, camiones disponibles, centros de acopio y capacidad de distribución compartida.",
    color: "bg-earth text-earth-foreground",
  },
  {
    icon: MessageCircle,
    title: "Red de Comunicación",
    description: "Mensajería directa, grupos regionales y notificaciones de oferta y demanda en tiempo real.",
    color: "bg-soil text-soil-foreground",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico",
    description: "Métricas de impacto, planificación de producción, pronóstico de demanda e indicadores ambientales.",
    color: "bg-forest text-forest-foreground",
  },
  {
    icon: Leaf,
    title: "Modular y Escalable",
    description: "Nuevas regiones e instituciones pueden incorporarse fácilmente al ecosistema de la plataforma.",
    color: "bg-primary text-primary-foreground",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Módulos de la plataforma</span>
          <h2 className="text-3xl sm:text-4xl font-display text-foreground mt-3 mb-4">
            Infraestructura digital para cadenas agroecológicas
          </h2>
          <p className="text-muted-foreground">
            Cada módulo está diseñado para conectar actores, reducir intermediarios y fortalecer la soberanía alimentaria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-lg ${f.color} mb-4`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg text-card-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
