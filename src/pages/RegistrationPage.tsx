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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sprout, Users, Heart, UtensilsCrossed, Store,
  Building2, Truck, Factory, ShoppingCart, ArrowRight, ArrowLeft, Check, Sparkles, Plus, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { locationData } from "@/data/locations";

type ActorType = Database["public"]["Enums"]["actor_type"];

interface ActivityItem {
  id: string;
  product: string;
  type: "ofrece" | "necesita";
}

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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [newType, setNewType] = useState<"ofrece" | "necesita">("ofrece");
  const [capacity, setCapacity] = useState("");
  const [methods, setMethods] = useState("");
  const [description, setDescription] = useState("");

  const selectedCountry = locationData.countries.find(c => c.code === country);
  const selectedRegion = selectedCountry?.regions.find(r => r.code === region);
  const locationString = [city, selectedRegion?.name, selectedCountry?.name].filter(Boolean).join(", ");

  const addActivity = () => {
    if (!newProduct.trim()) return;
    setActivities(prev => [...prev, { id: crypto.randomUUID(), product: newProduct.trim(), type: newType }]);
    setNewProduct("");
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const toggleActivityType = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, type: a.type === "ofrece" ? "necesita" : "ofrece" } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          actor_type: selectedType,
          display_name: name,
          phone,
          location: locationString,
          products: activities.length > 0 ? activities.map(a => `${a.type === "ofrece" ? "🟢" : "🔴"} ${a.product}`) : null,
          capacity,
          production_methods: methods,
          description,
        })
        .eq("user_id", authData.user.id);

      if (profileError) throw profileError;

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

                    {/* Cascading location selects */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3">
                      <Label>Ubicación</Label>
                      <Select value={country} onValueChange={(v) => { setCountry(v); setRegion(""); setCity(""); }}>
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
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRegion?.cities.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
