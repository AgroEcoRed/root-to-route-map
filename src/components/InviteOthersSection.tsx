import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Copy, Send, Mail, Trash2, CheckCircle2, Clock } from "lucide-react";

interface Referral {
  id: string;
  invitee_name: string;
  invitee_contact_type: "email" | "whatsapp";
  invitee_contact: string;
  token: string;
  status: "pending" | "joined" | "declined";
  personal_message: string | null;
  joined_at: string | null;
  created_at: string;
}

/**
 * Lets a registered user invite other experiences (people/orgs) into the network.
 * Generates a unique referral link `/registro?ref=<token>` and one-tap share via
 * WhatsApp / email / copy.
 */
export default function InviteOthersSection() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referrerName, setReferrerName] = useState<string>("");
  const [name, setName] = useState("");
  const [contactType, setContactType] = useState<"whatsapp" | "email">("whatsapp");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: refs }, { data: prof }] = await Promise.all([
      (supabase as any)
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    ]);
    setReferrals((refs as Referral[]) || []);
    setReferrerName((prof as any)?.display_name || "");
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const linkFor = (token: string) =>
    `${window.location.origin}/registro?ref=${token}`;

  const buildMessage = (r: Referral) => {
    const link = linkFor(r.token);
    const from = referrerName || "alguien de la red";
    const custom = r.personal_message?.trim();
    return (
      `Hola ${r.invitee_name}! ${custom ? custom + "\n\n" : ""}` +
      `Te invito a sumarte a AgroEco.Red, el mapa de sistemas alimentarios agroecológicos. ` +
      `Te escribe ${from}. Registrate desde este link para que quede vinculada tu experiencia con la mía: ${link}`
    );
  };

  const shareWhatsApp = (r: Referral) => {
    const phone = r.invitee_contact.replace(/[^\d]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(r))}`;
    window.open(url, "_blank");
  };

  const shareEmail = (r: Referral) => {
    const subject = encodeURIComponent(`Te invito a AgroEco.Red`);
    const body = encodeURIComponent(buildMessage(r));
    window.open(`mailto:${r.invitee_contact}?subject=${subject}&body=${body}`, "_blank");
  };

  const copyLink = async (r: Referral) => {
    await navigator.clipboard.writeText(buildMessage(r));
    toast.success("Mensaje con link copiado");
  };

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !contact.trim()) {
      toast.error("Nombre y contacto son obligatorios");
      return;
    }
    if (contactType === "email" && !/^\S+@\S+\.\S+$/.test(contact.trim())) {
      toast.error("Email no válido");
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("referrals")
      .insert({
        referrer_user_id: user.id,
        invitee_name: name.trim(),
        invitee_contact_type: contactType,
        invitee_contact: contact.trim(),
        personal_message: message.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("No se pudo crear la invitación: " + error.message);
      return;
    }
    setName(""); setContact(""); setMessage("");
    setReferrals((prev) => [data as Referral, ...prev]);
    toast.success("Invitación creada. Compartila por WhatsApp o email.");
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta invitación?")) return;
    const { error } = await (supabase as any).from("referrals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setReferrals((prev) => prev.filter((r) => r.id !== id));
  };

  if (!user) return null;

  return (
    <section className="rounded-2xl border-2 border-wheat/40 bg-gradient-to-br from-wheat/5 to-primary/5 p-6 mb-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-full bg-wheat/20 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl mb-1">Sumá a otras experiencias a la red</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Invitá a productoras, ferias, comedores o nodos que conocés. Cada invitación
            genera un link único a tu nombre — cuando se registran quedan vinculadas con
            vos en la red.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <Label className="text-xs">Nombre de la experiencia o persona *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Huerta La Semilla / María" />
        </div>
        <div className="grid grid-cols-[130px_1fr] gap-2">
          <div>
            <Label className="text-xs">Por</Label>
            <Select value={contactType} onValueChange={(v) => setContactType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{contactType === "whatsapp" ? "Número (con código país)" : "Email"} *</Label>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={contactType === "whatsapp" ? "+54 9 11 5555 5555" : "persona@correo.com"}
            />
          </div>
        </div>
      </div>
      <div className="mb-3">
        <Label className="text-xs">Mensaje personal (opcional)</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Ej: Me encantaría que tu huerta esté en el mapa 💚"
        />
      </div>
      <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
        <UserPlus className="h-4 w-4 mr-1.5" /> {saving ? "Creando…" : "Crear invitación"}
      </Button>

      {referrals.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            Invitaciones enviadas ({referrals.length})
          </h3>
          <ul className="space-y-2">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 flex-wrap p-3 bg-background rounded-lg border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{r.invitee_name}</span>
                    {r.status === "joined" ? (
                      <Badge className="bg-primary/15 text-primary border-primary/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Se sumó
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" /> Pendiente
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.invitee_contact_type === "whatsapp" ? "WhatsApp" : "Email"}: {r.invitee_contact}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.status === "pending" && r.invitee_contact_type === "whatsapp" && (
                    <Button size="sm" variant="outline" onClick={() => shareWhatsApp(r)} title="Enviar por WhatsApp">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {r.status === "pending" && r.invitee_contact_type === "email" && (
                    <Button size="sm" variant="outline" onClick={() => shareEmail(r)} title="Enviar por email">
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => copyLink(r)} title="Copiar mensaje con link">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}