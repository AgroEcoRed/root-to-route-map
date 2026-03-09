import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import type { Database } from "@/integrations/supabase/types";

type ActorType = Database["public"]["Enums"]["actor_type"];

const actorTypes: { key: ActorType; label: string; icon: typeof Sprout; desc: string; color: string }[] = [
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
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ActorType | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Step 3 fields
  const [products, setProducts] = useState("");
  const [capacity, setCapacity] = useState("");
  const [methods, setMethods] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // 2. Update the auto-created profile with registration data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          actor_type: selectedType,
          display_name: name,
          phone,
          location,
          products: products ? products.split(",").map((p) => p.trim()) : null,
          capacity,
          production_methods: methods,
          description,
        })
        .eq("user_id", authData.user.id);

      if (profileError) throw profileError;

      toast.success("¡Registro exitoso! Ya podés usar la plataforma.");
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
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">¿Qué tipo de actor sos?</h1>
                  <p className="text-muted-foreground">Seleccioná el perfil que mejor te represente en la red agroecológica.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {actorTypes.map((a, i) => (
                    <motion.button key={a.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedType(a.key); setStep(2); }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all duration-200 text-center ${
                        selectedType === a.key ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card hover:border-primary/40 hover:shadow-card"
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
                <div className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-card">
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
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" className="mt-1" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Label htmlFor="location">Ubicación</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ciudad, Provincia" className="mt-1" />
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
                  <p className="text-muted-foreground">Contanos sobre tu producción o necesidades de compra.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                      <Label htmlFor="products">Productos que ofrecés o necesitás</Label>
                      <Input id="products" value={products} onChange={(e) => setProducts(e.target.value)} placeholder="Ej: Tomate, Lechuga, Miel" className="mt-1" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Label htmlFor="capacity">Capacidad / Volumen</Label>
                      <Input id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ej: 500 kg/mes" className="mt-1" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Label htmlFor="methods">Métodos de producción</Label>
                      <Input id="methods" value={methods} onChange={(e) => setMethods(e.target.value)} placeholder="Ej: Agroecológico, en transición" className="mt-1" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contanos más sobre tu actividad..." rows={3} className="mt-1" />
                    </motion.div>
                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" type="button" onClick={() => setStep(2)} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-hero text-primary-foreground group" disabled={loading}>
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
