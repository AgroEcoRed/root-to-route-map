import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Gate sign-in: only allow users who completed registration.
        // Runs for both email/password and OAuth (Google) sign-ins.
        if (_event === "SIGNED_IN" && session?.user) {
          setTimeout(async () => {
            try {
              await supabase.functions.invoke("claim-layer-invites");
            } catch { /* No bloquea el ingreso */ }
            // Claim referral link if one was stored during signup
            try {
              const refToken = localStorage.getItem("agrored-referral-token");
              if (refToken) {
                await (supabase as any).rpc("claim_referral", { _token: refToken });
                localStorage.removeItem("agrored-referral-token");
              }
            } catch { /* silent */ }
            const [{ data: profile }, { data: managedLayers }] = await Promise.all([
              supabase
                .from("profiles")
                .select("registration_completed")
                .eq("user_id", session.user.id)
                .maybeSingle(),
              (supabase as any)
                .from("layer_managers")
                .select("id")
                .eq("user_id", session.user.id)
                .limit(1),
            ]);
            // Una invitación aceptada para gestionar una capa ya constituye un
            // alta válida. No obligamos a esas cuentas institucionales a repetir
            // el registro general cada vez que ingresan con Google.
            const isLayerManager = Array.isArray(managedLayers) && managedLayers.length > 0;
            if (profile && profile.registration_completed === false && !isLayerManager) {
              await supabase.auth.signOut();
              toast.error(
                "Esta cuenta no está registrada en AgroEco.Red. Por favor registrate primero para poder ingresar.",
                { duration: 6000 }
              );
              window.location.href = "/registro";
            }
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
