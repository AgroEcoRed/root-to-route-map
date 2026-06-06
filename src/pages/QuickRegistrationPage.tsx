import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Link as LinkIcon, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Mail, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type ActorType = Database["public"]["Enums"]["actor_type"];

const actorTypeLabels: Record<string, string> = {
  producer: "Productor/a Agroecológico/a",
  cooperative: "Cooperativa / Asociación",
  social_kitchen: "Comedor Comunitario",
  restaurant: "Restaurante / Bar",
  retail: "Comercio / Feria",
  consumer: "Consumidor/a",
  institution: "Institución Pública",
  logistics: "Proveedor/a Logístico/a",
  processing: "Planta de Procesamiento",
  agroecological_node: "Nodo Agroecológico",
  seed_bank: "Banco de Semillas",
  composting_center: "Centro de Compostaje",
  research_center: "Centro de Investigación",
  solidarity_intermediary: "Intermediario/a Solidario/a",
  community_garden: "Huerta Comunitaria",
  consumer_node: "Nodo de Consumidores/as",
  individual_consumer: "Consumidor/a Individual",
  food_bank: "Banco de Alimentos",
  consumer_cooperative: "Cooperativa de Consumo",
  community_org: "Org. Comunitaria",
  health_food_store: "Dietética",
  agroecological_store: "Almacén Agroecológico",
  agroecological_fair: "Feria Agroecológica",
  agroecological_market: "Mercado Agroecológico",
  bio_input_supplier: "Proveedor/a de Bio-insumos",
};

type Stage = "input" | "extracting" | "preview" | "sent";

interface ExtractedProfile {
  display_name: string;
  actor_type: ActorType;
  description: string;
  location: string;
  products: string[];
  phone: string | null;
  confidence: "high" | "medium" | "low";
}

const QuickRegistrationPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !email.trim()) return;
    setLoading(true);
    setStage("extracting");
    try {
      const { data, error } = await supabase.functions.invoke("extract-profile-from-url", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setProfile(data.profile);
      setSourceUrl(data.sourceUrl || url);
      setStage("preview");
    } catch (err: any) {
      toast.error(err.message || "No pudimos extraer datos de esa URL.");
      setStage("input");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/mi-perfil`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: profile.display_name,
            actor_type: profile.actor_type,
            description: profile.description,
            location: profile.location,
            products: profile.products,
            phone: profile.phone || null,
            source_url: sourceUrl,
            registration_completed: true,
          },
        },
      });
      if (error) throw error;
      setStage("sent");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar el enlace de acceso.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (patch: Partial<ExtractedProfile>) =>
    setProfile((p) => (p ? { ...p, ...patch } : p));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-wheat/5 rounded-full blur-3xl" />

        <div className="container max-w-2xl py-12 relative">
          <AnimatePresence mode="wait">
            {stage === "input" && (
              <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                    <Wand2 className="h-4 w-4" /> Registro rápido
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-2">
                    Registrate en 30 segundos
                  </h1>
                  <p className="text-muted-foreground">
                    Pegá un enlace a tu sitio, Instagram, Linktree o documento público.
                    Nuestra IA arma tu perfil automáticamente; vos sólo confirmás.
                  </p>
                </div>

                <form
                  onSubmit={handleExtract}
                  className="rounded-2xl border border-border bg-white p-6 shadow-elevated space-y-5"
                >
                  <div>
                    <Label htmlFor="url" className="flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5" /> Enlace público con tu información
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://tu-sitio.com o instagram.com/tu-cuenta"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Sitio web, blog, perfil de Instagram público, Linktree, Google Docs público, etc.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Tu email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Te enviaremos un enlace mágico para entrar (sin contraseña).
                    </p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analizar enlace con IA
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    ¿Preferís llenar el formulario completo?{" "}
                    <Link to="/registro" className="text-primary hover:underline font-medium">
                      Registro detallado
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {stage === "extracting" && (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-display text-foreground mb-2">
                  Leyendo tu información...
                </h2>
                <p className="text-muted-foreground text-sm">
                  Estamos analizando el enlace y armando tu perfil. Esto puede tardar unos segundos.
                </p>
              </motion.div>
            )}

            {stage === "preview" && profile && (
              <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                    <CheckCircle2 className="h-4 w-4" /> Encontramos esto
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-2">
                    Revisá y ajustá tu perfil
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Editá lo que quieras antes de confirmar. Podés completar el resto más tarde desde tu perfil.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-white p-6 shadow-elevated space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      Confianza: {profile.confidence}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] truncate max-w-[260px]">
                      Fuente: {sourceUrl}
                    </Badge>
                  </div>

                  <div>
                    <Label>Nombre / Organización</Label>
                    <Input
                      value={profile.display_name}
                      onChange={(e) => updateProfile({ display_name: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Tipo de actor</Label>
                    <select
                      value={profile.actor_type}
                      onChange={(e) => updateProfile({ actor_type: e.target.value as ActorType })}
                      className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Object.entries(actorTypeLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={profile.description}
                      onChange={(e) => updateProfile({ description: e.target.value })}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Ubicación</Label>
                    <Input
                      value={profile.location}
                      onChange={(e) => updateProfile({ location: e.target.value })}
                      className="mt-1.5"
                      placeholder="Ciudad, provincia, país"
                    />
                  </div>

                  <div>
                    <Label>Productos / categorías detectadas</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {profile.products.length === 0 && (
                        <span className="text-xs text-muted-foreground">No detectamos productos. Podés agregarlos después.</span>
                      )}
                      {profile.products.map((p, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() =>
                            updateProfile({ products: profile.products.filter((_, j) => j !== i) })
                          }
                          title="Click para quitar"
                        >
                          {p} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={profile.phone || ""}
                      onChange={(e) => updateProfile({ phone: e.target.value })}
                      className="mt-1.5"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStage("input")}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                  </Button>
                  <Button onClick={handleConfirm} disabled={loading} className="flex-1" size="lg">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                    Confirmar y recibir enlace mágico
                  </Button>
                </div>
              </motion.div>
            )}

            {stage === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mb-6">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-display text-foreground mb-3">
                  ¡Revisá tu email!
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Te enviamos un enlace mágico a <span className="font-medium text-foreground">{email}</span>.
                  Hacé click y entrás directo a tu perfil con todos los datos pre-cargados.
                </p>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Volver al inicio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuickRegistrationPage;