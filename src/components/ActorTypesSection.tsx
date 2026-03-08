import { motion } from "framer-motion";
import {
  Sprout,
  Users,
  UtensilsCrossed,
  GraduationCap,
  Store,
  Building2,
  ShoppingCart,
  Truck,
  Factory,
  Heart,
} from "lucide-react";

const actors = [
  { icon: Sprout, label: "Productores Agroecológicos" },
  { icon: Users, label: "Cooperativas y Asociaciones" },
  { icon: Heart, label: "Comedores Comunitarios" },
  { icon: GraduationCap, label: "Escuelas y Universidades" },
  { icon: ShoppingCart, label: "Consumidores Individuales" },
  { icon: UtensilsCrossed, label: "Restaurantes y Bares" },
  { icon: Store, label: "Comercios y Ferias" },
  { icon: Building2, label: "Instituciones Públicas" },
  { icon: Truck, label: "Proveedores Logísticos" },
  { icon: Factory, label: "Plantas de Procesamiento" },
];

const ActorTypesSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-earth uppercase tracking-wider">Ecosistema multi-actor</span>
          <h2 className="text-3xl sm:text-4xl font-display text-foreground mt-3 mb-4">
            Todos los eslabones de la cadena, conectados
          </h2>
          <p className="text-muted-foreground">
            Desde el campo hasta la mesa, cada actor del sistema alimentario tiene su lugar en la red.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {actors.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <a.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-card-foreground">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActorTypesSection;
