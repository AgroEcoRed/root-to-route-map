import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import comarca1 from "@/assets/foto-comarca-1.jpg";
import trigo from "@/assets/foto-trigo-atardecer.jpg";
import ganaderia from "@/assets/foto-ganaderia.jpg";
import papas from "@/assets/foto-papas.jpg";
import rutasSanasLogo from "@/assets/rutas-sanas-logo.jpeg.asset.json";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
// Logos institucionales ocultos temporalmente hasta obtener autorización
// import conicetLogo from "@/assets/logo-conicet.png";
// import unsamLogo from "@/assets/logo-unsam.png";
// import ubaLogo from "@/assets/logo-uba.png";


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

const heroPhotos = [
  { src: comarca1, alt: "Chacra agroecológica de montaña en la Comarca Andina", position: "50% 78%" },
  { src: trigo, alt: "Trigo agroecológico al atardecer", position: "50% 60%" },
  { src: ganaderia, alt: "Ganadería sobre pastizal manejado agroecológicamente", position: "50% 55%" },
  { src: papas, alt: "Variedades de papas nativas sobre la tierra", position: "50% 50%" },
];

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const { t } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhotoIndex((i) => (i + 1) % heroPhotos.length), 7000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { num: "1,200+", label: t("hero.stat_producers") },
    { num: "340", label: t("hero.stat_points") },
    { num: "85", label: t("hero.stat_kitchens") },
    { num: "12", label: t("hero.stat_regions") },
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden grain-overlay">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <div className="relative w-full h-[120%]">
          {heroPhotos.map((p, i) => (
            <motion.img
              key={p.src}
              src={p.src}
              alt={p.alt}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: p.position }}
              initial={false}
              animate={{ opacity: i === photoIndex ? 1 : 0, scale: i === photoIndex ? 1.04 : 1 }}
              transition={{ opacity: { duration: 1.6 }, scale: { duration: 8, ease: "linear" } }}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/55 to-forest/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-forest/25" />
      </motion.div>

      {[...Array(5)].map((_, i) => (
        <motion.div key={i} custom={i} variants={floatingVariants} animate="animate"
          className="absolute rounded-full opacity-10 bg-wheat"
          style={{ width: 60 + i * 30, height: 60 + i * 30, top: `${15 + i * 15}%`, right: `${5 + i * 8}%`, filter: "blur(1px)" }}
        />
      ))}

      <motion.div className="container relative z-10 pt-28 pb-20" style={{ y: textY }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="absolute top-24 right-4 sm:right-8 flex items-center gap-3 rounded-lg border border-white/30 bg-background/85 p-2.5 pr-4 shadow-lg backdrop-blur-md"
          aria-label="Red integrada: Rutas Sanas del Alimento"
        >
          <img
            src={rutasSanasLogo.url}
            alt="Logo de la Red Interregional de Nodos de Consumo Agroecológico Las Rutas Sanas del Alimento"
            className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
          />
          <div className="hidden max-w-40 sm:block">
            <p className="text-xs font-semibold leading-tight text-foreground">Rutas Sanas del Alimento</p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">Red integrada al mapa</p>
          </div>
        </motion.div>
        {/* Logos institucionales ocultos temporalmente hasta obtener autorización
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-20 right-4 sm:right-8 flex items-center gap-4 sm:gap-6 opacity-70"
          aria-label="Instituciones impulsoras"
        >
          <img src={conicetLogo} alt="CONICET" className="h-10 sm:h-12 w-auto object-contain brightness-0 invert opacity-80" loading="lazy" />
          <img src={unsamLogo} alt="UNSAM" className="h-10 sm:h-12 w-auto object-contain brightness-0 invert opacity-80" loading="lazy" />
          <img src={ubaLogo} alt="UBA" className="h-10 sm:h-12 w-auto object-contain brightness-0 invert opacity-80" loading="lazy" />
        </motion.div>
        */}
        <div className="max-w-3xl">

          <motion.div initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-wheat/20 text-wheat text-sm font-medium mb-6 backdrop-blur-sm border border-wheat/10">
              <ShieldCheck className="h-4 w-4" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.15 }}
            className="text-[2.75rem] sm:text-6xl lg:text-7xl font-display leading-[1.05] tracking-tight text-white mb-6 text-balance">
            {t("hero.title_1")}
            <span className="relative inline-block font-display-italic text-wheat">
              {t("hero.title_highlight")}
              <motion.span className="absolute -bottom-1 left-0 h-1 bg-wheat rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, delay: 1 }} />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/85 mb-10 max-w-xl leading-relaxed text-pretty">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="bg-wheat text-wheat-foreground hover:bg-wheat/90 font-semibold text-base group" asChild>
              <Link to="/mapa"><MapPin className="h-5 w-5 mr-2 group-hover:animate-bounce" />{t("hero.cta_map")}</Link>
            </Button>
            <Button size="lg" className="bg-white/20 border border-white/40 text-white hover:bg-white/30 backdrop-blur-sm font-semibold group" asChild>
              <Link to="/mercado">{t("hero.cta_market")}<ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-14 pt-8 border-t border-white/15 bg-white/10 sm:bg-transparent rounded-lg sm:rounded-none overflow-hidden">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                variants={counterVariants}
                initial="hidden"
                animate="visible"
                className="bg-transparent sm:border-l sm:first:border-l-0 border-white/15 px-4 sm:px-6 py-2"
              >
                <div className="text-3xl sm:text-4xl font-display text-wheat tracking-tight">{s.num}</div>
                <div className="text-[0.7rem] sm:text-xs text-white/55 uppercase tracking-[0.18em] mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-wheat" animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
