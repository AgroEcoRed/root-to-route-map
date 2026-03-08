import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sprout, Users, Heart, UtensilsCrossed, Store,
  Building2, Truck, Factory, ShoppingCart, ArrowRight, ArrowLeft, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const actorTypes = [
  { key: "producer", label: "Productor Agroecológico", icon: Sprout, desc: "Cultivo, cría o producción de alimentos agroecológicos" },
  { key: "cooperative", label: "Cooperativa / Asociación", icon: Users, desc: "Organización de productores para comercialización conjunta" },
  { key: "social_kitchen", label: "Comedor Comunitario", icon: Heart, desc: "Comedor social, merendero o espacio comunitario" },
  { key: "restaurant", label: "Restaurante / Bar", icon: UtensilsCrossed, desc: "Gastronomía que busca insumos agroecológicos" },
  { key: "retail", label: "Comercio / Feria", icon: Store, desc: "Punto de venta de alimentos" },
  { key: "consumer", label: "Consumidor Individual", icon: ShoppingCart, desc: "Persona que busca comprar directo a productores" },
  { key: "institution", label: "Institución Pública", icon: Building2, desc: "Escuela, hospital, municipio u oficina pública" },
  { key: "logistics", label: "Proveedor Logístico", icon: Truck, desc: "Transporte, distribución o almacenamiento" },
  { key: "processing", label: "Planta de Procesamiento", icon: Factory, desc: "Molino, frigorífico, acopio o biofábrica" },
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
      <main className="flex-1 pt-16">
        <div className="container max-w-3xl py-12">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-3xl font-display text-foreground text-center mb-2">¿Qué tipo de actor sos?</h1>
                <p className="text-center text-muted-foreground mb-8">Seleccioná el perfil que mejor te represente en la red agroecológica.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actorTypes.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => { setSelectedType(a.key); setStep(2); }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 text-center hover:shadow-card ${
                        selectedType === a.key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <a.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-sm text-card-foreground">{a.label}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-3xl font-display text-foreground text-center mb-2">Datos de contacto</h1>
                <p className="text-center text-muted-foreground mb-8">Completá tu información básica para registrarte.</p>
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="name">Nombre / Organización</Label>
                    <Input id="name" placeholder="Ej: Finca La Esperanza" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+54 11 1234-5678" />
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" placeholder="Ciudad, Provincia" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-hero text-primary-foreground">
                      Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-3xl font-display text-foreground text-center mb-2">Tu actividad</h1>
                <p className="text-center text-muted-foreground mb-8">Contanos sobre tu producción o necesidades de compra.</p>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="products">Productos que ofrecés o necesitás</Label>
                    <Input id="products" placeholder="Ej: Tomate, Lechuga, Miel" />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacidad / Volumen</Label>
                    <Input id="capacity" placeholder="Ej: 500 kg/mes" />
                  </div>
                  <div>
                    <Label htmlFor="methods">Métodos de producción</Label>
                    <Input id="methods" placeholder="Ej: Agroecológico, en transición" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" placeholder="Contanos más sobre tu actividad..." rows={3} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={() => setStep(2)} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Button>
                    <Button type="submit" className="flex-1 bg-gradient-hero text-primary-foreground">
                      <Check className="h-4 w-4 mr-1" /> Registrarme
                    </Button>
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
