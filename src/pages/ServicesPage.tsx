import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Leaf, Sprout, CloudSun, Landmark, Warehouse, Factory, 
  ShoppingBasket, ExternalLink, BookOpen, Shield, CreditCard,
  Truck, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, type: "spring", stiffness: 80 },
  }),
};

// Weather widget using Open-Meteo (free, no API key)
const WeatherWidget = () => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Default: Buenos Aires area. In production, use user's profile location
    const lat = -34.6;
    const lng = -58.4;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=America/Argentina/Buenos_Aires&forecast_days=5`)
      .then(r => r.json())
      .then(data => { setWeather(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const weatherIcon = (code: number) => {
    if (code <= 3) return "☀️";
    if (code <= 48) return "🌤️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    return "⛈️";
  };

  const dayName = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-AR", { weekday: "short" });
  };

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  if (!weather?.current) return null;

  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-sky-200/50 dark:border-sky-800/30">
      <div className="flex items-center gap-3 mb-4">
        <CloudSun className="h-6 w-6 text-sky-600" />
        <h3 className="font-display text-lg text-foreground">{t("services.weather_title")}</h3>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl">{weatherIcon(weather.current.weather_code)}</span>
        <div>
          <p className="text-3xl font-bold text-foreground">{Math.round(weather.current.temperature_2m)}°C</p>
          <p className="text-sm text-muted-foreground">
            {t("services.humidity")}: {weather.current.relative_humidity_2m}% · {t("services.wind")}: {Math.round(weather.current.wind_speed_10m)} km/h
          </p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {weather.daily?.time?.slice(0, 5).map((day: string, i: number) => (
          <div key={day} className="text-center p-2 rounded-lg bg-white/60 dark:bg-white/5">
            <p className="text-xs font-medium text-muted-foreground capitalize">{dayName(day)}</p>
            <span className="text-lg">{weatherIcon(weather.daily.weather_code[i])}</span>
            <p className="text-xs text-foreground">
              {Math.round(weather.daily.temperature_2m_max[i])}° / {Math.round(weather.daily.temperature_2m_min[i])}°
            </p>
            {weather.daily.precipitation_probability_max[i] > 30 && (
              <p className="text-[10px] text-sky-600">💧 {weather.daily.precipitation_probability_max[i]}%</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 italic">{t("services.weather_note")}</p>
    </div>
  );
};

const ServicesPage = () => {
  const { t } = useLanguage();

  const serviceCategories = [
    {
      id: "inputs",
      icon: Sprout,
      titleKey: "services.inputs_title",
      descKey: "services.inputs_desc",
      color: "from-emerald-500/10 to-green-500/10 border-emerald-200/50 dark:border-emerald-800/30",
      iconColor: "text-emerald-600",
      items: [
        { label: t("services.bio_inputs"), desc: t("services.bio_inputs_desc"), icon: Leaf },
        { label: t("services.seed_bank"), desc: t("services.seed_bank_desc"), icon: Sprout },
      ],
    },
    {
      id: "knowledge",
      icon: BookOpen,
      titleKey: "services.knowledge_title",
      descKey: "services.knowledge_desc",
      color: "from-amber-500/10 to-yellow-500/10 border-amber-200/50 dark:border-amber-800/30",
      iconColor: "text-amber-600",
      items: [
        { label: t("services.library"), desc: t("services.library_desc"), icon: BookOpen },
        { label: t("services.advisory"), desc: t("services.advisory_desc"), icon: Shield },
      ],
    },
    {
      id: "finance",
      icon: CreditCard,
      titleKey: "services.finance_title",
      descKey: "services.finance_desc",
      color: "from-violet-500/10 to-purple-500/10 border-violet-200/50 dark:border-violet-800/30",
      iconColor: "text-violet-600",
      items: [
        { label: t("services.microcredit"), desc: t("services.microcredit_desc"), icon: CreditCard },
        { label: t("services.insurance"), desc: t("services.insurance_desc"), icon: Shield },
        { label: t("services.gov_programs"), desc: t("services.gov_programs_desc"), icon: Landmark },
      ],
      programs: [
        { name: "INTA - ProHuerta", url: "https://www.argentina.gob.ar/inta/prohuerta", desc: t("services.prog_prohuerta") },
        { name: "SENASA - Registro de Operadores", url: "https://www.argentina.gob.ar/senasa", desc: t("services.prog_senasa") },
        { name: "Secretaría de Agricultura Familiar", url: "https://www.argentina.gob.ar/agricultura/agricultura-familiar", desc: t("services.prog_saf") },
        { name: "Monotributo Social", url: "https://www.argentina.gob.ar/desarrollosocial/monotributosocial", desc: t("services.prog_monotributo") },
      ],
    },
    {
      id: "postharvest",
      icon: Warehouse,
      titleKey: "services.postharvest_title",
      descKey: "services.postharvest_desc",
      color: "from-orange-500/10 to-red-500/10 border-orange-200/50 dark:border-orange-800/30",
      iconColor: "text-orange-600",
      items: [
        { label: t("services.storage"), desc: t("services.storage_desc"), icon: Warehouse },
        { label: t("services.processing"), desc: t("services.processing_desc"), icon: Factory },
        { label: t("services.logistics"), desc: t("services.logistics_desc"), icon: Truck },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider px-4 py-1 rounded-full bg-secondary/10 mb-4">
              {t("services.badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-4">{t("services.title")}</h1>
            <p className="text-muted-foreground text-lg">{t("services.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Weather */}
      <section className="pb-8">
        <div className="container max-w-3xl">
          <WeatherWidget />
        </div>
      </section>

      {/* Service Categories */}
      <section className="pb-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceCategories.map((cat, ci) => (
              <motion.div
                key={cat.id}
                custom={ci}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`rounded-2xl border bg-gradient-to-br ${cat.color} p-6 sm:p-8`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl bg-white/80 dark:bg-white/10 ${cat.iconColor}`}>
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-foreground">{t(cat.titleKey)}</h2>
                    <p className="text-sm text-muted-foreground">{t(cat.descKey)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {cat.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5">
                      <item.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Government programs directory */}
                {cat.programs && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-semibold text-foreground mb-3">{t("services.available_programs")}</p>
                    <div className="space-y-2">
                      {cat.programs.map((prog) => (
                        <a
                          key={prog.name}
                          href={prog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{prog.name}</p>
                            <p className="text-xs text-muted-foreground">{prog.desc}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link to map for postharvest */}
                {cat.id === "postharvest" && (
                  <Link
                    to="/mapa"
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {t("services.view_on_map")} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Existing platform links */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-4">{t("services.also_explore")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/mercado" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors">
                <ShoppingBasket className="h-4 w-4" /> {t("nav.market")}
              </Link>
              <Link to="/mapa" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/10 text-secondary font-medium text-sm hover:bg-secondary/20 transition-colors">
                <CloudSun className="h-4 w-4" /> {t("nav.map")}
              </Link>
              <Link to="/actores" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-wheat/10 text-wheat font-medium text-sm hover:bg-wheat/20 transition-colors">
                <Shield className="h-4 w-4" /> {t("nav.actors")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
