import { motion } from "framer-motion";
import { MapPin, ShoppingBasket, ShieldCheck, Truck, MessageCircle, BarChart3, Leaf, Sprout } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import fotoComarca1 from "@/assets/foto-comarca-1.jpg";
import fotoVerduras from "@/assets/foto-verduras.jpg";
import fotoProductor from "@/assets/foto-productor.jpg";
import fotoPapas from "@/assets/foto-papas.jpg";
import fotoGanaderia from "@/assets/foto-ganaderia.jpg";
import fotoJornada from "@/assets/foto-jornada-campo.jpg";
import fotoTrigo from "@/assets/foto-trigo-atardecer.jpg";
import fotoGirasoles from "@/assets/foto-girasoles.jpg";

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.6, delay: i * 0.1, type: "spring" as const, stiffness: 80 },
  }),
};

const FeaturesSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    { icon: MapPin, titleKey: "features.map", descKey: "features.map_desc", color: "bg-primary text-primary-foreground", link: "/mapa", photo: fotoComarca1 },
    { icon: ShoppingBasket, titleKey: "features.marketplace", descKey: "features.marketplace_desc", color: "bg-secondary text-secondary-foreground", link: "/mercado", photo: fotoPapas },
    { icon: ShieldCheck, titleKey: "features.cert", descKey: "features.cert_desc", color: "bg-wheat text-wheat-foreground", link: "/actores", photo: fotoProductor },
    { icon: Sprout, titleKey: "features.services", descKey: "features.services_desc", color: "bg-earth text-earth-foreground", link: "/servicios", photo: fotoVerduras },
    { icon: Truck, titleKey: "features.logistics", descKey: "features.logistics_desc", color: "bg-soil text-soil-foreground", link: "/mapa", photo: fotoGanaderia },
    { icon: MessageCircle, titleKey: "features.comm", descKey: "features.comm_desc", color: "bg-forest text-forest-foreground", link: "/comunidad", photo: fotoJornada },
    { icon: BarChart3, titleKey: "features.dashboard", descKey: "features.dashboard_desc", color: "bg-primary text-primary-foreground", link: null, photo: fotoTrigo },
    { icon: Leaf, titleKey: "features.scalable", descKey: "features.scalable_desc", color: "bg-secondary text-secondary-foreground", link: null, photo: fotoGirasoles },
  ];

  return (
    <section className="py-28 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-wheat/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container relative">
        <motion.div className="text-center max-w-2xl mx-auto mb-20" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="eyebrow text-secondary justify-center">{t("features.badge")}</span>
          <h2 className="text-4xl sm:text-5xl font-display text-foreground mt-5 mb-5 leading-[1.1] tracking-tight text-balance">{t("features.title")}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">{t("features.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.titleKey} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              onClick={() => f.link && navigate(f.link)}
              className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:shadow-elevated hover:border-primary/20 transition-all duration-300 ${f.link ? "cursor-pointer" : "cursor-default"}`}>
              <img src={f.photo} alt="" aria-hidden="true" loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-card/45" />
              <div className="relative">
              <motion.div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.color} mb-4`}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                <f.icon className="h-5 w-5" />
              </motion.div>
              <h3 className="font-display text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">{t(f.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              <motion.div className="h-0.5 bg-gradient-hero mt-4 rounded-full origin-left" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
