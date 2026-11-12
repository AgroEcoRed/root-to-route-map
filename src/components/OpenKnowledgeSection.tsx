import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  ArrowRight,
  CreativeCommons,
  Database,
  Code2,
  UserCheck,
  SlidersHorizontal,
  Trash2,
  ShieldOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LICENSES } from "@/lib/licenses";

const licenseCode = (code: string) => LICENSES.find((l) => l.code === code);

const OpenKnowledgeSection = () => {
  const { t } = useLanguage();

  const cards = [
    {
      code: "CC-BY-SA-4.0",
      icon: CreativeCommons,
      titleKey: "open.card_contents_title",
      textKey: "open.card_contents_text",
    },
    {
      code: "ODbL-1.0",
      icon: Database,
      titleKey: "open.card_data_title",
      textKey: "open.card_data_text",
    },
    {
      code: "AGPL",
      icon: Code2,
      titleKey: "open.card_code_title",
      textKey: "open.card_code_text",
    },
  ];

  const principles = [
    { icon: UserCheck, key: "open.p_owner" },
    { icon: SlidersHorizontal, key: "open.p_choose" },
    { icon: Trash2, key: "open.p_remove" },
    { icon: ShieldOff, key: "open.p_nosell" },
  ];

  const steps = ["open.step_1", "open.step_2", "open.step_3"];

  return (
    <section className="py-20 sm:py-24 relative overflow-hidden">
      <div className="absolute top-10 right-0 w-[420px] h-[420px] bg-leaf/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[340px] h-[340px] bg-wheat/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

      <div className="container relative">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="eyebrow text-secondary justify-center">
            {t("open.badge")}
          </span>
          <h2 className="text-4xl sm:text-5xl font-display text-foreground mt-5 mb-5 leading-[1.1] tracking-tight text-balance">
            {t("open.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
            {t("open.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {cards.map((card, i) => {
            const lic = licenseCode(card.code);
            const Icon = card.icon;
            return (
              <motion.div
                key={card.code}
                className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    {lic?.short ?? card.code}
                  </span>
                </div>
                <h3 className="font-display text-lg text-foreground mb-2">
                  {t(card.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(card.textKey)}
                </p>
                {lic?.url && (
                  <a
                    href={lic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-3 inline-block"
                  >
                    {t("open.read_license")} →
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.key}
                className="flex items-start gap-3 rounded-xl bg-muted/50 border border-border/60 p-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <Icon className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {t(p.key)}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-wheat/5 p-7 sm:p-9"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-7 items-center">
            <div>
              <h3 className="font-display text-xl text-foreground mb-4">
                {t("open.reuse_title")}
              </h3>
              <ol className="space-y-2.5">
                {steps.map((key, i) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Link
              to="/licencias"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm justify-center"
            >
              {t("open.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OpenKnowledgeSection;
