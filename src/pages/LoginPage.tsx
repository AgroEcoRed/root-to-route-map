import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Leaf, Mail, Lock, ArrowRight, Sprout, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Revisá tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido/a!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Ingresá tu email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Te enviamos un email para restablecer tu contraseña.");
      setShowForgot(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sprout, text: "Conectá directo con productores agroecológicos" },
    { icon: MapPin, text: "Encontrá puntos de venta cercanos en el mapa" },
    { icon: ShieldCheck, text: "Trazabilidad y certificación participativa" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center pt-16">
        <div className="container flex flex-col lg:flex-row items-center gap-12 py-12">
          {/* Left - Branding */}
          <motion.div
            className="flex-1 hidden lg:block max-w-lg"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-4xl font-display text-foreground mb-4 leading-tight">
                  Tu puerta de entrada a la{" "}
                  <span className="text-gradient-hero">red agroecológica</span>
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Accedé al marketplace, mapa interactivo y herramientas de trazabilidad para fortalecer cadenas cortas de comercialización.
                </p>
                <div className="space-y-4">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{f.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center mb-6 lg:hidden">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-hero mb-4">
                <Leaf className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-display text-foreground">
                {showForgot ? "Restablecer contraseña" : isSignUp ? "Crear cuenta" : "Ingresar a AgroEco.Red"}
              </h1>
            </div>

            <div className="hidden lg:block text-center mb-6">
              <h1 className="text-2xl font-display text-foreground">
                {showForgot ? "Restablecer contraseña" : isSignUp ? "Crear cuenta" : "Ingresar"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {showForgot ? "Te enviaremos un link a tu email" : isSignUp ? "Unite a la red agroecológica" : "Conectá con productores y compradores"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-elevated">
              {showForgot ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-9" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link de recuperación"}
                  </Button>
                  <button type="button" onClick={() => setShowForgot(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Volver al login
                  </button>
                </form>
              ) : (
                <>
                  <Button variant="outline" className="w-full mb-4 h-11 group" onClick={handleGoogleSignIn} disabled={loading}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar con Google
                  </Button>

                  <div className="relative mb-4">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
                      o con email
                    </span>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-9" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" minLength={6} required />
                      </div>
                    </div>

                    {!isSignUp && (
                      <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}

                    <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground h-11 group" disabled={loading}>
                      {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Ingresar"}
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
                      {isSignUp ? "Ingresar" : "Registrate"}
                    </button>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
