import { motion } from "framer-motion";
import {
  Sprout, Users, UtensilsCrossed, GraduationCap, Store,
  Building2, ShoppingCart, Truck, Factory, Heart,
} from "lucide-react";

const actors = [
  { icon: Sprout, label: "Productores Agroecológicos", color: "from-primary to-leaf" },
  { icon: Users, label: "Cooperativas y Asociaciones", color: "from-earth to-secondary" },
  { icon: Heart, label: "Comedores Comunitarios", color: "from-secondary to-earth" },
  { icon: GraduationCap, label: "Escuelas y Universidades", color: "from-wheat to-earth" },
  { icon: ShoppingCart, label: "Consumidores Individuales", color: "from-leaf to-primary" },
  { icon: UtensilsCrossed, label: "Restaurantes y Bares", color: "from-earth to-wheat" },
  { icon: Store, label: "Comercios y Ferias", color: "from-primary to-forest" },
  { icon: Building2, label: "Instituciones Públicas", color: "from-forest to-primary" },
  { icon: Truck, label: "Proveedores Logísticos", color: "from-soil to-earth" },
  { icon: Factory, label: "Plantas de Procesamiento", color: "from-wheat to-leaf" },
];

const ActorTypesSection = () => {
  return (
    <section className="py-24 bg-muted/50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5" />
      </div>

      <div className="container relative">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block text-sm font-semibold text-earth uppercase tracking-wider px-4 py-1 rounded-full bg-earth/10">
            Ecosistema multi-actor
          </span>
          <h2 className="text-3xl sm:text-4xl font-display text-foreground mt-4 mb-4">
            Todos los eslabones de la cadena, conectados
          </h2>
          <p className="text-muted-foreground">
            Desde el campo hasta la mesa, cada actor del sistema alimentario tiene su lugar en la red.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {actors.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, type: "spring" }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 text-center cursor-default"
            >
              <motion.div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <a.icon className="h-6 w-6 text-primary-foreground" />
              </motion.div>
              <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActorTypesSection;
