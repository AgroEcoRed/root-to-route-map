import { Link } from "react-router-dom";
import { Leaf, Github, Twitter, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-forest text-forest-foreground py-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

      <div className="container relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wheat to-earth flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl">Mercado<span className="text-wheat">Agroecológico</span></span>
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
              {["footer.api_docs", "footer.participatory_cert", "footer.contact"].map((key) => (
                <li key={key}>
                  <span className="hover:text-wheat transition-colors cursor-pointer hover:translate-x-1 inline-block">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-forest-foreground/10 flex flex-col items-center gap-4 text-xs text-forest-foreground/40">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <span>{t("footer.copyright")}</span>
            <span>{t("footer.tagline")}</span>
          </div>
          <div className="pt-4 border-t border-forest-foreground/10 w-full text-center">
            <span className="text-forest-foreground/50 text-xs">
              Página creada y gestionada por{" "}
              <a
                href="https://agenciaequinoxia.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold tracking-wide hover:opacity-80 transition-opacity"
                style={{ color: "#00e5a0", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}
              >
                equinoxia
              </a>
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-3 text-forest-foreground/50 text-xs">
              <a href="mailto:info@agenciaequinoxia.com" className="inline-flex items-center gap-1.5 hover:text-forest-foreground/80 transition-colors">
                <Mail className="h-3.5 w-3.5" />
                info@agenciaequinoxia.com
              </a>
              <a href="https://wa.me/5491170849509" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-forest-foreground/80 transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                +54 9 11 7084 9509
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
