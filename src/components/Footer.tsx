import { Link } from "react-router-dom";
import { Github, Twitter, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AnimatedLogo from "@/components/AnimatedLogo";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-forest text-forest-foreground py-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

      <div className="container relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="group-hover:scale-110 transition-transform">
                <AnimatedLogo size={36} />
              </div>
              <span className="font-display text-xl">AgroEco<span className="text-wheat">.Red</span></span>
            </Link>
            <p className="text-forest-foreground/70 text-sm max-w-sm leading-relaxed mb-6">{t("footer.description")}</p>
            <div className="flex gap-3">
              {[Github, Twitter, Mail].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ y: -3, scale: 1.1 }}
                  className="w-9 h-9 rounded-lg bg-forest-foreground/10 flex items-center justify-center hover:bg-wheat/20 hover:text-wheat transition-colors">
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm mb-4 text-forest-foreground/90">{t("footer.platform")}</h4>
            <ul className="space-y-2.5 text-sm text-forest-foreground/60">
              {[
                { to: "/mapa", labelKey: "footer.interactive_map" },
                { to: "/mercado", labelKey: "footer.marketplace" },
                { to: "/actores", labelKey: "footer.actor_network" },
                { to: "/registro", labelKey: "footer.register" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-wheat transition-colors hover:translate-x-1 inline-block">{t(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm mb-4 text-forest-foreground/90">{t("footer.resources")}</h4>
            <ul className="space-y-2.5 text-sm text-forest-foreground/60">
              <li>
                <Link to="/biblioteca" className="hover:text-wheat transition-colors hover:translate-x-1 inline-block">
                  {t("footer.api_docs")}
                </Link>
              </li>
              <li>
                <Link to="/actores?tab=spg" className="hover:text-wheat transition-colors hover:translate-x-1 inline-block">
                  {t("footer.participatory_cert")}
                </Link>
              </li>
              <li>
                <a href="mailto:apsosa@unsam.edu.ar" className="hover:text-wheat transition-colors hover:translate-x-1 inline-block">
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-forest-foreground/10 flex flex-col items-center gap-4 text-xs text-forest-foreground/40">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <span>{t("footer.copyright")}</span>
            <div className="flex items-center gap-4">
              <Link to="/licencias" className="hover:text-wheat transition-colors">
                Licencias · CC BY-SA 4.0
              </Link>
              <span>{t("footer.tagline")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
