import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Leaf } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Try to get session - if user got here via recovery link, session should exist
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("¡Contraseña actualizada!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16 py-12">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-hero mb-4">
              <Leaf className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display text-foreground">Nueva contraseña</h1>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            {ready ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" minLength={6} required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </form>
            ) : (
              <p className="text-center text-muted-foreground">Link de recuperación inválido o expirado.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
