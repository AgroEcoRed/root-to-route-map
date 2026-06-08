import { motion } from "framer-motion";
import { Sprout, Users, UtensilsCrossed, GraduationCap, Store, Building2, ShoppingCart, Truck, Factory, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ActorTypesSection = () => {
  const { t } = useLanguage();

  const actors = [
    { icon: Sprout, labelKey: "actors_section.producers", color: "from-primary to-leaf" },
    { icon: Users, labelKey: "actors_section.cooperatives", color: "from-earth to-secondary" },
    { icon: Heart, labelKey: "actors_section.kitchens", color: "from-secondary to-earth" },
    { icon: GraduationCap, labelKey: "actors_section.schools", color: "from-wheat to-earth" },
    { icon: ShoppingCart, labelKey: "actors_section.consumers", color: "from-leaf to-primary" },
    { icon: UtensilsCrossed, labelKey: "actors_section.restaurants", color: "from-earth to-wheat" },
    { icon: Store, labelKey: "actors_section.retail", color: "from-primary to-forest" },
    { icon: Building2, labelKey: "actors_section.institutions", color: "from-forest to-primary" },
    { icon: Truck, labelKey: "actors_section.logistics", color: "from-soil to-earth" },
    { icon: Factory, labelKey: "actors_section.processing", color: "from-wheat to-leaf" },
  ];

  return (
    <section className="py-28 bg-muted/40 relative overflow-hidden grain-overlay">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-primary/5" />
      </div>

      <div className="container relative z-10">
        <motion.div className="text-center max-w-2xl mx-auto mb-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="eyebrow text-earth justify-center">{t("actors_section.badge")}</span>
          <h2 className="text-4xl sm:text-5xl font-display text-foreground mt-5 mb-5 leading-[1.1] tracking-tight text-balance">{t("actors_section.title")}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">{t("actors_section.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {actors.map((a, i) => (
            <motion.div key={a.labelKey} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, type: "spring" }} whileHover={{ y: -6, scale: 1.03 }}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 text-center cursor-default">
              <motion.div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: "spring", stiffness: 200 }}>
                <a.icon className="h-6 w-6 text-primary-foreground" />
              </motion.div>
              <span className="text-sm font-medium text-card-foreground group-hover:text-primary transition-colors">{t(a.labelKey)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActorTypesSection;
