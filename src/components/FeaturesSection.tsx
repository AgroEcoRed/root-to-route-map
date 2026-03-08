import { motion } from "framer-motion";
import {
  MapPin, ShoppingBasket, QrCode, ShieldCheck,
  Truck, MessageCircle, BarChart3, Leaf,
} from "lucide-react";

const features = [
  { icon: MapPin, title: "Mapa Agroecológico", description: "Visualiza productores, cooperativas, comedores y puntos de venta geolocalizados con filtros por producto y certificación.", color: "bg-primary text-primary-foreground" },
  { icon: ShoppingBasket, title: "Marketplace", description: "Oferta y demanda de alimentos agroecológicos con matching automático por proximidad geográfica.", color: "bg-secondary text-secondary-foreground" },
  { icon: QrCode, title: "Trazabilidad QR", description: "Cada lote con código QR para rastrear origen, método de producción, fecha de cosecha y ruta de transporte.", color: "bg-leaf text-leaf-foreground" },
  { icon: ShieldCheck, title: "Certificación Participativa", description: "Sistema de garantía participativa con niveles de verificación y validación comunitaria.", color: "bg-wheat text-wheat-foreground" },
  { icon: Truck, title: "Logística Compartida", description: "Mapeo de rutas, camiones disponibles, centros de acopio y capacidad de distribución compartida.", color: "bg-earth text-earth-foreground" },
  { icon: MessageCircle, title: "Red de Comunicación", description: "Mensajería directa, grupos regionales y notificaciones de oferta y demanda en tiempo real.", color: "bg-soil text-soil-foreground" },
  { icon: BarChart3, title: "Dashboard Analítico", description: "Métricas de impacto, planificación de producción, pronóstico de demanda e indicadores ambientales.", color: "bg-forest text-forest-foreground" },
  { icon: Leaf, title: "Modular y Escalable", description: "Nuevas regiones e instituciones pueden incorporarse fácilmente al ecosistema de la plataforma.", color: "bg-primary text-primary-foreground" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.6, delay: i * 0.1, type: "spring" as const, stiffness: 80 },
  }),
};

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-wheat/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container relative">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.span
            className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider px-4 py-1 rounded-full bg-secondary/10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Módulos de la plataforma
          </motion.span>
          <h2 className="text-3xl sm:text-4xl font-display text-foreground mt-4 mb-4">
            Infraestructura digital para cadenas agroecológicas
          </h2>
          <p className="text-muted-foreground">
            Cada módulo está diseñado para conectar actores, reducir intermediarios y fortalecer la soberanía alimentaria.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group rounded-xl border border-border bg-card p-6 hover:shadow-elevated hover:border-primary/20 transition-all duration-300 cursor-default"
            >
              <motion.div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.color} mb-4`}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <f.icon className="h-5 w-5" />
              </motion.div>
              <h3 className="font-display text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              <motion.div
                className="h-0.5 bg-gradient-hero mt-4 rounded-full origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
