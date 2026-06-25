import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sprout, Users, Heart, UtensilsCrossed, Store,
  Building2, Truck, Factory, ShoppingCart, ArrowRight, ArrowLeft, Check, Sparkles, Plus, X
} from "lucide-react";
import LocationPicker from "@/components/LocationPicker";
import CitySearch from "@/components/CitySearch";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { locationData } from "@/data/locations";
import PreliminaryImport from "@/components/PreliminaryImport";
import { Navigation as NavIcon, MapPin as MapPinIcon, Info } from "lucide-react";

type ActorType = Database["public"]["Enums"]["actor_type"];
type CertLevel = Database["public"]["Enums"]["certification_level"];

// Categories matching marketplace filters
const ofertaCategories = [
  "Verduras", "Frutas", "Lácteos", "Huevos", "Carnes",
  "Almacén", "Panificados", "Bebidas", "Cosmética Natural",
  "Plantines y Semillas", "Salud Natural",
];

const demandaCategories = [
  "Verduras", "Frutas", "Lácteos", "Huevos", "Carnes",
  "Almacén", "Panificados", "Bebidas", "Cosmética Natural",
  "Plantines y Semillas", "Salud Natural",
  "Mercado Híbrido (convencional/agroecológico)",
];

const servicioCategories = [
  "Transporte", "Distribución", "Almacenamiento", "Procesamiento",
  "Capacitación", "Certificación", "Asesoramiento técnico",
];

const certOptions: { value: CertLevel; label: string; color: string; desc: string }[] = [
  { value: "green", label: "Certificado SPG", color: "bg-primary", desc: "Certificación participativa vigente" },
  { value: "yellow", label: "En transición", color: "bg-wheat", desc: "En proceso de transición agroecológica" },
  { value: "red", label: "Básico / Inicio", color: "bg-destructive", desc: "Inicio del camino agroecológico" },
  { value: "none_spg", label: "Agroecológico sin SPG", color: "bg-muted-foreground", desc: "Producción agroecológica sin certificación formal" },
];

const actorTypes: { key: ActorType; label: string; icon: typeof Sprout; desc: string; color: string }[] = [
  { key: "producer", label: "Productor/a Agroecológico/a", icon: Sprout, desc: "Cultivo, cría o producción de alimentos agroecológicos", color: "from-primary to-leaf" },
  { key: "cooperative", label: "Cooperativa / Asociación", icon: Users, desc: "Organización de productores/as para comercialización conjunta", color: "from-earth to-secondary" },
  { key: "social_kitchen", label: "Comedor Comunitario", icon: Heart, desc: "Comedor social, merendero o espacio comunitario", color: "from-secondary to-earth" },
  { key: "restaurant", label: "Restaurante / Bar", icon: UtensilsCrossed, desc: "Gastronomía que busca insumos agroecológicos", color: "from-wheat to-earth" },
  { key: "retail", label: "Comercio / Feria", icon: Store, desc: "Punto de venta de alimentos", color: "from-leaf to-primary" },
  { key: "consumer", label: "Consumidor/a Individual", icon: ShoppingCart, desc: "Persona que busca comprar directo a productores/as", color: "from-primary to-forest" },
  { key: "institution", label: "Institución Pública", icon: Building2, desc: "Escuela, hospital, municipio u oficina pública", color: "from-forest to-primary" },
  { key: "logistics", label: "Proveedor/a Logístico/a", icon: Truck, desc: "Transporte, distribución o almacenamiento", color: "from-soil to-earth" },
  { key: "processing", label: "Planta de Procesamiento", icon: Factory, desc: "Molino, frigorífico, acopio o biofábrica", color: "from-wheat to-leaf" },
  { key: "bio_input_supplier", label: "Proveedor/a de Bio-insumos", icon: Sprout, desc: "Compost, biopreparados, controladores biológicos, lombricompuesto", color: "from-leaf to-primary" },
  { key: "seed_bank", label: "Banco de Semillas", icon: Sprout, desc: "Conservación e intercambio de semillas criollas y nativas", color: "from-wheat to-primary" },
  { key: "composting_center", label: "Centro de Compostaje", icon: Sprout, desc: "Procesamiento de orgánicos y producción de compost / humus", color: "from-soil to-leaf" },
];

const isProducerType = (type: ActorType | null) =>
  type === "producer" || type === "cooperative" || type === "processing" ||
  type === "bio_input_supplier" || type === "seed_bank" || type === "composting_center";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ActorType | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [preliminary, setPreliminary] = useState<{ url: string; notes: string; file: File | null }>({ url: "", notes: "", file: null });

  // Step 3: Categories
  const [selectedOferta, setSelectedOferta] = useState<string[]>([]);
  const [selectedDemanda, setSelectedDemanda] = useState<string[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryType, setCustomCategoryType] = useState<"oferta" | "demanda" | "servicio">("oferta");
  const [certification, setCertification] = useState<CertLevel>("red");
  const [description, setDescription] = useState("");
  // Per-category capacity & production methods (key = category name)
  const [capacityByCategory, setCapacityByCategory] = useState<Record<string, string>>({});
  const [methodsByCategory, setMethodsByCategory] = useState<Record<string, string>>({});
  // Verification request
  const [wantsVerification, setWantsVerification] = useState(false);

  /** Whether this actor is an "individual experience" (single point) — used to nudge geolocation. */
  const isIndividualExperience = (t: ActorType | null) =>
    t === "producer" || t === "consumer" || t === "restaurant" || t === "retail" ||
    t === "social_kitchen" || t === "community_garden" || t === "bio_input_supplier";

  const requestDeviceGeolocation = () => {
    if (!("geolocation" in navigator)) { toast.error("Tu navegador no soporta geolocalización"); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setGeoState("done"); toast.success("Ubicación obtenida del dispositivo"); },
      (err) => { setGeoState("error"); toast.error(err.message || "No pudimos obtener tu ubicación"); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectedCountry = locationData.countries.find(c => c.code === country);
  const selectedRegion2 = selectedCountry?.regions.find(r => r.code === region);
  const locationString = [city, selectedRegion2?.name, selectedCountry?.name].filter(Boolean).join(", ");

  const toggleCategory = (cat: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(cat) ? list.filter(c => c !== cat) : [...list, cat]);
  };

  const addCustomCategory = async () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    
    // Add to local selection
    if (customCategoryType === "oferta") {
      setSelectedOferta(prev => [...prev, trimmed]);
    } else if (customCategoryType === "demanda") {
      setSelectedDemanda(prev => [...prev, trimmed]);
    } else {
      setSelectedServicios(prev => [...prev, trimmed]);
    }
    
    setCustomCategory("");
  };

  // Build products array from selections
  const buildProducts = () => {
    const products: string[] = [];
    selectedOferta.forEach(p => products.push(`🟢 ${p}`));
    selectedDemanda.forEach(p => products.push(`🔴 ${p}`));
    selectedServicios.forEach(p => products.push(`🔵 ${p}`));
    return products.length > 0 ? products : null;
  };

  const descriptionWordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 15;
  const descriptionValid = descriptionWordCount >= minWords;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    if (!descriptionValid) {
      toast.error(`La descripción debe tener al menos ${minWords} palabras.`);
      return;
    }
    setLoading(true);

    try {
      // Build per-category capacity/methods strings
      const capacityStr = selectedOferta
        .filter((c) => capacityByCategory[c]?.trim())
        .map((c) => `${c}: ${capacityByCategory[c].trim()}`)
        .join(" | ");
      const methodsStr = isProducerType(selectedType)
        ? selectedOferta
            .filter((c) => methodsByCategory[c]?.trim())
            .map((c) => `${c}: ${methodsByCategory[c].trim()}`)
            .join(" | ")
        : "";

      const products = buildProducts();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: name,
            actor_type: selectedType,
            phone,
            location: locationString,
            lat: lat ?? null,
            lng: lng ?? null,
            products: products ?? [],
            capacity: capacityStr,
            production_methods: methodsStr,
            description,
            certification: isProducerType(selectedType) ? certification : null,
            registration_completed: true,
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Save preliminary import draft (link/file) for later verification by the user/team.
      try {
        const uid = authData.user.id;
        if (preliminary.url.trim()) {
          await (supabase as any).from("preliminary_imports").insert({
            user_id: uid, source_type: "link", url: preliminary.url.trim(), notes: preliminary.notes.trim() || null,
          });
        }
        if (preliminary.file) {
          const path = `${uid}/preliminary/${Date.now()}_${preliminary.file.name}`;
          const up = await supabase.storage.from("producer-media").upload(path, preliminary.file, { upsert: false });
          if (!up.error) {
            await (supabase as any).from("preliminary_imports").insert({
              user_id: uid, source_type: "file", file_path: path, notes: preliminary.notes.trim() || null,
            });
          }
        }
      } catch { /* silent — not critical */ }

      // Save custom categories globally
      const allCustomOferta = selectedOferta.filter(c => !ofertaCategories.includes(c));
      const allCustomDemanda = selectedDemanda.filter(c => !demandaCategories.includes(c));
      const allCustomServicios = selectedServicios.filter(c => !servicioCategories.includes(c));

      const customCats = [
        ...allCustomOferta.map(name => ({ name, type: "oferta" as const, created_by: authData.user!.id })),
        ...allCustomDemanda.map(name => ({ name, type: "demanda" as const, created_by: authData.user!.id })),
        ...allCustomServicios.map(name => ({ name, type: "servicio" as const, created_by: authData.user!.id })),
      ];

      if (customCats.length > 0) {
        // Insert ignoring duplicates
        for (const cat of customCats) {
          await supabase.from("custom_categories").insert(cat as any).select();
        }
      }

      // Profile data is now persisted automatically by the handle_new_user
      // trigger using the metadata passed above. No client-side UPDATE
      // needed (and it would fail under RLS while email is unconfirmed).

      // Verification request: open user's mail client with prefilled message
      if (wantsVerification) {
        const to = "andreapatriciasosa@gmail.com";
        const subject = encodeURIComponent(
          `Solicitud de verificación — ${name}`
        );
        const bodyText = `Hola,

Acabo de registrarme en AgroEco.Red y quiero solicitar la verificación de mi emprendimiento / organización.

Datos del registro:
- Nombre / Organización: ${name}
- Email: ${email}
- Rol: ${selectedType}
- Ubicación: ${locationString}
- Coordenadas: ${lat ?? "—"}, ${lng ?? "—"}
- Teléfono: ${phone}
- Oferta: ${selectedOferta.join(", ") || "—"}
- Demanda: ${selectedDemanda.join(", ") || "—"}
- Servicios: ${selectedServicios.join(", ") || "—"}
- Capacidad por categoría: ${capacityStr || "—"}
- Métodos por categoría: ${methodsStr || "—"}
- Nivel de certificación declarado: ${isProducerType(selectedType) ? certification : "—"}

Descripción:
${description}

Quedo a disposición para coordinar la verificación.

Gracias.`;
        const mailto = `mailto:${to}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        // Open in a new tab so the registration flow keeps going.
        window.open(mailto, "_blank");
      }

      toast.success("¡Registro exitoso! Revisá tu email para confirmar tu cuenta.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-wheat/5 rounded-full blur-3xl" />

        <div className="container max-w-3xl py-12 relative">
          {/* Progress bar */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: step === s ? 1.1 : 1,
                    backgroundColor: step >= s ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ color: step >= s ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </motion.div>
                {s < 3 && (
                  <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: step > s ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 60, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -60, filter: "blur(10px)" }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                    <Sparkles className="h-4 w-4" />Paso 1 de 3
                  </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">¿Cómo participás de la red?</h1>
                  <p className="text-muted-foreground">Elegí el rol que mejor te represente para conectarte con la comunidad agroecológica.</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 mx-auto max-w-2xl rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-wheat/10 to-primary/5 p-4 sm:p-5 shadow-elevated"
                >
                  <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        ¿Tenés un sitio, Instagram o Linktree?
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Registrate en 30 segundos: nuestra IA lee el enlace y arma tu perfil. Vos sólo confirmás.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => navigate("/registro-rapido")}
                      className="w-full sm:w-auto"
                    >
                      Registro rápido <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actorTypes.map((a, i) => (
                    <motion.button key={a.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedType(a.key); setStep(2); }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 text-center ${
                        selectedType === a.key ? "border-primary bg-primary/5 shadow-card" : "border-border bg-white hover:border-primary/40 hover:shadow-elevated"
                      }`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md`}>
                        <a.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span className="font-medium text-sm text-card-foreground">{a.label}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">{a.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 60, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -60, filter: "blur(10px)" }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">Paso 2 de 3</span>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Datos de contacto</h1>
                  <p className="text-muted-foreground">Completá tu información básica para registrarte.</p>
                </div>
                <div className="max-w-md mx-auto rounded-2xl border border-border bg-white p-6 shadow-elevated">
                  <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                      <Label htmlFor="name">Nombre / Organización</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Finca La Esperanza" className="mt-1" required />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="mt-1" required />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Label htmlFor="password">Contraseña</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" minLength={6} required />
                    </motion.div>

                    {/* Cascading location selects */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
                      <Label>Ubicación</Label>
                      <Select value={country} onValueChange={(v) => { setCountry(v); setRegion(""); setCity(""); setPhone(locationData.countries.find(c => c.code === v)?.phoneCode + " " || ""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationData.countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {country && (
                        <Select value={region} onValueChange={(v) => { setRegion(v); setCity(""); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Provincia / Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCountry?.regions.map((r) => (
                              <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {region && (
                        <CitySearch
                          cities={selectedRegion2?.cities || []}
                          value={city}
                          onChange={setCity}
                        />
                      )}
                    </motion.div>

                    {/* Geolocation picker */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                      <div className="flex items-center justify-between gap-2">
                        <Label>Georreferenciación</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={requestDeviceGeolocation}
                          disabled={geoState === "loading"}
                          className="text-xs h-8"
                        >
                          <NavIcon className="h-3.5 w-3.5 mr-1.5" />
                          {geoState === "loading" ? "Obteniendo..." : geoState === "done" ? "Volver a ubicar" : "Usar mi ubicación"}
                        </Button>
                      </div>
                      {isIndividualExperience(selectedType) && (
                        <div className="mt-1 mb-2 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-[11px] text-foreground/80">
                          <Info className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                          <span>
                            Si tu experiencia es individual, tocá <b>"Usar mi ubicación"</b> para autorizar el GPS de tu dispositivo.
                            ¿Tenés varios puntos (varios nodos, ferias, etc.)? Registrá uno acá y desde tu perfil podés sumar más con <b>+ Agregar punto</b>.
                          </span>
                        </div>
                      )}
                      <div className="mt-1">
                        <LocationPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={selectedCountry ? `${selectedCountry.phoneCode} ej: 11 1234-5678` : "Seleccioná un país primero"} className="mt-1" />
                    </motion.div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                      <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-hero text-primary-foreground group" disabled={!email || !password || !name}>
                        Siguiente <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 60, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -60, filter: "blur(10px)" }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">Paso 3 de 3</span>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Tu actividad</h1>
                  <p className="text-muted-foreground">Seleccioná las categorías de lo que ofrecés y/o necesitás.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-lg mx-auto rounded-2xl border border-border bg-white p-6 shadow-elevated">
                  <div className="space-y-5">
                    {/* Oferta categories */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                      <Label className="text-sm font-medium">🟢 ¿Qué ofrecés?</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Seleccioná las categorías de productos o servicios que ofrecés.</p>
                      <div className="flex flex-wrap gap-2">
                        {ofertaCategories.map((cat) => (
                          <button key={cat} type="button" onClick={() => toggleCategory(cat, selectedOferta, setSelectedOferta)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedOferta.includes(cat) ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/40"
                            }`}>
                            {cat}
                          </button>
                        ))}
                        {/* Show custom oferta categories */}
                        {selectedOferta.filter(c => !ofertaCategories.includes(c)).map((cat) => (
                          <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary bg-primary/10 text-primary flex items-center gap-1">
                            {cat}
                            <button type="button" onClick={() => setSelectedOferta(prev => prev.filter(c => c !== cat))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </motion.div>

                    {/* Demanda categories */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                      <Label className="text-sm font-medium">🔴 ¿Qué necesitás?</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Seleccioná las categorías de productos que buscás comprar.</p>
                      <div className="flex flex-wrap gap-2">
                        {demandaCategories.map((cat) => (
                          <button key={cat} type="button" onClick={() => toggleCategory(cat, selectedDemanda, setSelectedDemanda)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selectedDemanda.includes(cat) ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-white text-muted-foreground hover:border-destructive/40"
                            }`}>
                            {cat}
                          </button>
                        ))}
                        {selectedDemanda.filter(c => !demandaCategories.includes(c)).map((cat) => (
                          <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-medium border border-destructive bg-destructive/10 text-destructive flex items-center gap-1">
                            {cat}
                            <button type="button" onClick={() => setSelectedDemanda(prev => prev.filter(c => c !== cat))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </motion.div>

                    {/* Servicios categories (for logistics/processing types) */}
                    {(selectedType === "logistics" || selectedType === "processing" || selectedType === "cooperative") && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Label className="text-sm font-medium">🔵 Servicios que ofrecés</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {servicioCategories.map((cat) => (
                            <button key={cat} type="button" onClick={() => toggleCategory(cat, selectedServicios, setSelectedServicios)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                selectedServicios.includes(cat) ? "border-accent bg-accent/10 text-accent-foreground" : "border-border bg-white text-muted-foreground hover:border-accent/40"
                              }`}>
                              {cat}
                            </button>
                          ))}
                          {selectedServicios.filter(c => !servicioCategories.includes(c)).map((cat) => (
                            <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-medium border border-accent bg-accent/10 text-accent-foreground flex items-center gap-1">
                              {cat}
                              <button type="button" onClick={() => setSelectedServicios(prev => prev.filter(c => c !== cat))}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Custom category "Otra" */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <Label className="text-sm font-medium">➕ Agregar otra categoría</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Si no encontrás tu categoría, escribila acá. Quedará disponible para otros usuarios.</p>
                      <div className="flex gap-2">
                        <Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Ej: Fibras naturales, Apicultura..."
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                          className="flex-1" />
                        <Select value={customCategoryType} onValueChange={(v: "oferta" | "demanda" | "servicio") => setCustomCategoryType(v)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oferta">🟢 Oferta</SelectItem>
                            <SelectItem value="demanda">🔴 Demanda</SelectItem>
                            <SelectItem value="servicio">🔵 Servicio</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" size="icon" variant="outline" onClick={addCustomCategory} disabled={!customCategory.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>

                    {/* Certification level - only for producers */}
                    {isProducerType(selectedType) && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Label className="text-sm font-medium">🌱 Nivel de transición / certificación</Label>
                        <p className="text-[11px] text-muted-foreground mb-2">Indicá tu nivel actual en el camino agroecológico.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {certOptions.map((opt) => (
                            <button key={opt.value} type="button" onClick={() => setCertification(opt.value)}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                                certification === opt.value ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white hover:border-primary/30"
                              }`}>
                              <span className={`w-3 h-3 rounded-full ${opt.color} flex-shrink-0`} />
                              <div>
                                <p className="text-xs font-medium text-card-foreground">{opt.label}</p>
                                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Description - mandatory */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                      <Label htmlFor="description">Descripción <span className="text-destructive">*</span></Label>
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Contanos quiénes son y qué hacen. Esta descripción aparecerá en el mapa y en tu perfil. Mínimo {minWords} palabras.
                      </p>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Somos una familia productora de hortalizas agroecológicas en La Plata, Buenos Aires. Cultivamos tomates, lechugas, acelgas y morrones sin uso de agroquímicos desde 2018. Participamos del SPG local y entregamos en nodos de consumo semanales..."
                        rows={4} className="mt-1" required />
                      <p className={`text-[11px] mt-1 ${descriptionValid ? "text-primary" : "text-destructive"}`}>
                        {descriptionWordCount}/{minWords} palabras {descriptionValid ? "✓" : "(mínimo requerido)"}
                      </p>
                    </motion.div>

                    {/* Per-category capacity & production methods */}
                    {selectedOferta.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Label className="text-sm font-medium">📦 Capacidad / Volumen por categoría</Label>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Indicá cuánto producís de cada categoría seleccionada{isProducerType(selectedType) ? " y el método de producción correspondiente" : ""}.
                        </p>
                        <div className="space-y-3">
                          {selectedOferta.map((cat) => (
                            <div key={cat} className="rounded-lg border border-border p-3 bg-white/80">
                              <p className="text-xs font-medium text-card-foreground mb-2">🟢 {cat}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Input
                                  value={capacityByCategory[cat] || ""}
                                  onChange={(e) => setCapacityByCategory((p) => ({ ...p, [cat]: e.target.value }))}
                                  placeholder="Capacidad — ej: 500 kg/mes"
                                  className="text-xs"
                                />
                                {isProducerType(selectedType) && (
                                  <Input
                                    value={methodsByCategory[cat] || ""}
                                    onChange={(e) => setMethodsByCategory((p) => ({ ...p, [cat]: e.target.value }))}
                                    placeholder="Método — ej: Agroecológico, biodinámico"
                                    className="text-xs"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Verification request */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-lg border border-primary/30 bg-primary/5 p-3"
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={wantsVerification}
                          onCheckedChange={(v) => setWantsVerification(v === true)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            🌿 Quiero solicitar la verificación de mi emprendimiento
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Al finalizar el registro se abrirá tu cliente de email con un mensaje
                            prellenado dirigido al equipo de verificación de AgroEco.Red.
                          </p>
                        </div>
                      </label>
                    </motion.div>

                    {/* Preliminary import (link/file to bootstrap a list of nodes/actors) */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                      <PreliminaryImport draftMode draft={preliminary} onDraftChange={setPreliminary} />
                    </motion.div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" type="button" onClick={() => setStep(2)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-hero text-primary-foreground group" disabled={loading || !descriptionValid}>
                        {loading ? "Registrando..." : <><Check className="h-4 w-4 mr-1" /> Registrarme</>}
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegistrationPage;
