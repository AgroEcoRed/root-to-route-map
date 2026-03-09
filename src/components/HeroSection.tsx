import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const floatingVariants = {
  animate: (i: number) => ({
    y: [0, -15, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" as const },
  }),
};

const counterVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, delay: 0.6 + i * 0.15, type: "spring" as const, stiffness: 100 },
  }),
};

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const { t } = useLanguage();

  const stats = [
    { num: "1,200+", label: t("hero.stat_producers") },
    { num: "340", label: t("hero.stat_points") },
    { num: "85", label: t("hero.stat_kitchens") },
    { num: "12", label: t("hero.stat_regions") },
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img src={heroImage} alt="Campo agroecológico" className="w-full h-[120%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/75 to-forest/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent" />
      </motion.div>

      {[...Array(5)].map((_, i) => (
        <motion.div key={i} custom={i} variants={floatingVariants} animate="animate"
          className="absolute rounded-full opacity-10 bg-wheat"
          style={{ width: 60 + i * 30, height: 60 + i * 30, top: `${15 + i * 15}%`, right: `${5 + i * 8}%`, filter: "blur(1px)" }}
        />
      ))}

      <motion.div className="container relative z-10 pt-24 pb-16" style={{ y: textY }}>
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-wheat/20 text-wheat text-sm font-medium mb-6 backdrop-blur-sm border border-wheat/10">
              <ShieldCheck className="h-4 w-4" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight text-white mb-6">
            {t("hero.title_1")}
            <span className="relative inline-block">
              {t("hero.title_highlight")}
              <motion.span className="absolute -bottom-1 left-0 h-1 bg-wheat rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 1 }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-wheat text-wheat-foreground hover:bg-wheat/90 font-semibold text-base group" asChild>
              <Link to="/mapa"><MapPin className="h-5 w-5 mr-2 group-hover:animate-bounce" />{t("hero.cta_map")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm group" asChild>
              <Link to="/mercado">{t("hero.cta_market")}<ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </motion.div>

          <div className="flex gap-8 mt-12 pt-8 border-t border-primary-foreground/20">
            {stats.map((s, i) => (
              <motion.div key={s.label} custom={i} variants={counterVariants} initial="hidden" animate="visible">
                <div className="text-2xl sm:text-3xl font-display text-wheat">{s.num}</div>
                <div className="text-sm text-primary-foreground/60">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-wheat" animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
