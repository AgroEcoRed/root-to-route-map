import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sprout, Users, Heart, UtensilsCrossed, Store,
  Building2, Truck, Factory, ShoppingCart, ArrowRight, ArrowLeft, Check, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const actorTypes = [
  { key: "producer", label: "Productor Agroecológico", icon: Sprout, desc: "Cultivo, cría o producción de alimentos agroecológicos", color: "from-primary to-leaf" },
  { key: "cooperative", label: "Cooperativa / Asociación", icon: Users, desc: "Organización de productores para comercialización conjunta", color: "from-earth to-secondary" },
  { key: "social_kitchen", label: "Comedor Comunitario", icon: Heart, desc: "Comedor social, merendero o espacio comunitario", color: "from-secondary to-earth" },
  { key: "restaurant", label: "Restaurante / Bar", icon: UtensilsCrossed, desc: "Gastronomía que busca insumos agroecológicos", color: "from-wheat to-earth" },
  { key: "retail", label: "Comercio / Feria", icon: Store, desc: "Punto de venta de alimentos", color: "from-leaf to-primary" },
  { key: "consumer", label: "Consumidor Individual", icon: ShoppingCart, desc: "Persona que busca comprar directo a productores", color: "from-primary to-forest" },
  { key: "institution", label: "Institución Pública", icon: Building2, desc: "Escuela, hospital, municipio u oficina pública", color: "from-forest to-primary" },
  { key: "logistics", label: "Proveedor Logístico", icon: Truck, desc: "Transporte, distribución o almacenamiento", color: "from-soil to-earth" },
  { key: "processing", label: "Planta de Procesamiento", icon: Factory, desc: "Molino, frigorífico, acopio o biofábrica", color: "from-wheat to-leaf" },
];

const RegistrationPage = () => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Registro enviado con éxito! Te contactaremos pronto.");
    setStep(1);
    setSelectedType(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative overflow-hidden">
        {/* Background decorations */}
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
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 60, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -60, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    Paso 1 de 3
                  </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">¿Qué tipo de actor sos?</h1>
                  <p className="text-muted-foreground">Seleccioná el perfil que mejor te represente en la red agroecológica.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actorTypes.map((a, i) => (
                    <motion.button
                      key={a.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedType(a.key); setStep(2); }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 text-center ${
                        selectedType === a.key ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card hover:border-primary/40 hover:shadow-card"
                      }`}
                    >
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
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 60, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -60, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">Paso 2 de 3</span>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Datos de contacto</h1>
                  <p className="text-muted-foreground">Completá tu información básica para registrarte.</p>
                </div>
                <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="space-y-4">
                    {[
                      { id: "name", label: "Nombre / Organización", placeholder: "Ej: Finca La Esperanza" },
                      { id: "email", label: "Email", placeholder: "tu@email.com", type: "email" },
                      { id: "phone", label: "Teléfono", placeholder: "+54 11 1234-5678" },
                      { id: "location", label: "Ubicación", placeholder: "Ciudad, Provincia" },
                    ].map((field, i) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input id={field.id} type={field.type || "text"} placeholder={field.placeholder} className="mt-1" />
                      </motion.div>
                    ))}
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                      <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-hero text-primary-foreground group">
                        Siguiente <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 60, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -60, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">Paso 3 de 3</span>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">Tu actividad</h1>
                  <p className="text-muted-foreground">Contanos sobre tu producción o necesidades de compra.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="space-y-4">
                    {[
                      { id: "products", label: "Productos que ofrecés o necesitás", placeholder: "Ej: Tomate, Lechuga, Miel" },
                      { id: "capacity", label: "Capacidad / Volumen", placeholder: "Ej: 500 kg/mes" },
                      { id: "methods", label: "Métodos de producción", placeholder: "Ej: Agroecológico, en transición" },
                    ].map((field, i) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input id={field.id} placeholder={field.placeholder} className="mt-1" />
                      </motion.div>
                    ))}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea id="description" placeholder="Contanos más sobre tu actividad..." rows={3} className="mt-1" />
                    </motion.div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" type="button" onClick={() => setStep(2)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-hero text-primary-foreground group">
                        <Check className="h-4 w-4 mr-1" /> Registrarme
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
