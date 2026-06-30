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
            const { data: profile } = await supabase
              .from("profiles")
              .select("registration_completed")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (profile && profile.registration_completed === false) {
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
