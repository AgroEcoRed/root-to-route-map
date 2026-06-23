import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Users, Loader2, ArrowLeft, ShieldCheck, ShieldOff, Search } from "lucide-react";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  actor_type: string | null;
  location: string | null;
  created_at: string;
}
interface RoleRow { user_id: string; role: string; }

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      (supabase as any).from("profiles")
        .select("user_id, display_name, actor_type, location, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      (supabase as any).from("user_roles").select("user_id, role"),
    ]);
    if (p.error) toast.error("Perfiles: " + p.error.message);
    if (r.error) toast.error("Roles: " + r.error.message);
    setProfiles((p.data as ProfileRow[]) || []);
    const map: Record<string, string[]> = {};
    ((r.data as RoleRow[]) || []).forEach(x => {
      map[x.user_id] = [...(map[x.user_id] || []), x.role];
    });
    setRoles(map);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/ingresar" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const toggleAdmin = async (uid: string, isCurrentlyAdmin: boolean) => {
    if (uid === user.id && isCurrentlyAdmin) {
      if (!confirm("¿Seguro que querés quitarte el rol de admin?")) return;
    }
    if (isCurrentlyAdmin) {
      const { error } = await (supabase as any).from("user_roles")
        .delete().eq("user_id", uid).eq("role", "admin");
      if (error) toast.error("Error: " + error.message);
      else { toast.success("Rol admin revocado"); load(); }
    } else {
      const { error } = await (supabase as any).from("user_roles")
        .insert({ user_id: uid, role: "admin" });
      if (error) toast.error("Error: " + error.message);
      else { toast.success("Rol admin asignado"); load(); }
    }
  };

  const visible = profiles.filter(p => {
    if (!q.trim()) return true;
    const blob = `${p.display_name ?? ""} ${p.actor_type ?? ""} ${p.location ?? ""} ${p.user_id}`.toLowerCase();
    return blob.includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Usuarios y roles</h1>
        </div>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Listado de personas registradas. Podés asignar o revocar el rol de
          administrador desde acá.
        </p>

        <div className="relative mb-4">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nombre, tipo, zona, UUID..."
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">Sin resultados.</Card>
        ) : (
          <div className="space-y-2">
            {visible.map(p => {
              const r = roles[p.user_id] || [];
              const isUserAdmin = r.includes("admin");
              return (
                <Card key={p.user_id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium truncate">{p.display_name || "Sin nombre"}</span>
                      {p.actor_type && <Badge variant="secondary">{p.actor_type}</Badge>}
                      {isUserAdmin && <Badge className="bg-primary/15 text-primary border-primary/30">admin</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.location || "—"} · <span className="font-mono">{p.user_id.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <Button size="sm" variant={isUserAdmin ? "outline" : "default"}
                    onClick={() => toggleAdmin(p.user_id, isUserAdmin)}>
                    {isUserAdmin ? (<><ShieldOff className="h-4 w-4 mr-1" /> Quitar admin</>)
                      : (<><ShieldCheck className="h-4 w-4 mr-1" /> Hacer admin</>)}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}