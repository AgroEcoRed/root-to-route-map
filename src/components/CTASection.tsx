import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ctaPhoto from "@/assets/foto-girasoles.jpg.asset.json";

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24">
      <div className="container">
        <motion.div className="relative rounded-3xl overflow-hidden bg-gradient-hero p-12 sm:p-16 text-center"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, type: "spring" }}>
          <img src={ctaPhoto.url} alt="Encuentro de productorxs en un lote de girasoles" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-forest/85 via-forest/70 to-primary/70" />
          <motion.div className="absolute top-0 left-0 w-96 h-96 bg-wheat/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute bottom-0 right-0 w-80 h-80 bg-earth/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"
            animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-leaf/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-6 border border-primary-foreground/10">
              <Sparkles className="h-4 w-4 text-wheat" />
              {t("cta.badge")}
            </motion.div>

            <motion.h2 className="text-4xl sm:text-5xl lg:text-6xl font-display text-primary-foreground mb-5 leading-[1.05] tracking-tight text-balance"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              {t("cta.title")}
            </motion.h2>
            <motion.p className="text-primary-foreground/85 text-lg sm:text-xl mb-10 leading-relaxed text-pretty"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              {t("cta.subtitle")}
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
              <Button size="lg" className="bg-wheat text-wheat-foreground hover:bg-wheat/90 font-semibold group" asChild>
                <Link to="/registro">{t("cta.register")}<ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground backdrop-blur-sm font-semibold" asChild>
                <Link to="/mapa">{t("cta.explore")}</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
