import { motion } from "framer-motion";
import { Plus, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import conicetLogo from "@/assets/logo-conicet.png";
import unsamLogo from "@/assets/logo-unsam.png";

const partners = [
  { name: "CONICET", logo: conicetLogo, url: "https://www.conicet.gov.ar" },
  { name: "UNSAM", logo: unsamLogo, url: "https://www.unsam.edu.ar" },
];

const PartnersSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-wheat/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="container relative">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="eyebrow text-secondary justify-center">{t("partners.badge")}</span>
          <h2 className="text-4xl sm:text-5xl font-display text-foreground mt-5 mb-5 leading-[1.1] tracking-tight text-balance">
            {t("partners.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">{t("partners.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 items-center justify-items-center mb-12">
          {partners.map((partner, i) => (
            <motion.a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-full h-28 px-6 py-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-h-16 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                loading="lazy"
              />
            </motion.a>
          ))}

          {/* Placeholder slots for future partners */}
          {[0, 1, 2].map((slot) => (
            <motion.div
              key={`placeholder-${slot}`}
              className="flex flex-col items-center justify-center w-full h-28 px-4 py-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 text-muted-foreground/50 hover:border-primary/30 hover:text-primary/60 transition-all duration-300 cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (partners.length + slot) * 0.1 }}
            >
              <Plus className="h-6 w-6 mb-1" />
              <span className="text-xs text-center leading-tight">{t("partners.placeholder")}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-wheat/5 border border-border p-8 sm:p-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="max-w-xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-display text-foreground mb-3">
              {t("partners.cta_title")}
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t("partners.cta_text")}
            </p>
            <a
              href="mailto:contacto@agroeco.red"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Mail className="h-4 w-4" />
              {t("partners.cta_button")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
