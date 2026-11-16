import { useCallback, useEffect, useState } from "react";
import { Check, X, ShieldOff, RefreshCw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
type Request = { id: string; requester_name: string; purpose: string; status: string; created_at: string };
export default function LayerExportsPanel({ layerId }: { layerId: string }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Request[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("layer_export_requests").select("id,requester_name,purpose,status,created_at").eq("layer_id", layerId).order("created_at", { ascending: false });
    if (error) toast.error(t("export.error")); else setRows(data || []);
    setLoading(false);
  }, [layerId, t]);
  useEffect(() => { load(); }, [load]);
  const review = async (id: string, status: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("map-export", { body: { action: "review", layer_id: layerId, request_id: id, status } });
    if (error || data?.error) toast.error(t("export.error")); else { toast.success(t("export.saved")); await load(); }
    setBusy(false);
  };
  return <section className="py-6 space-y-4 border-t border-border">
    <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl flex items-center gap-2"><Download className="h-5 w-5 shrink-0" />{t("export.requests")}</h2><Button size="icon" variant="ghost" onClick={load} aria-label={t("export.refresh")} title={t("export.refresh")}><RefreshCw className="h-4 w-4" /></Button></div>
    {loading ? <p className="text-sm text-muted-foreground">{t("export.loading")}</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("export.empty")}</p> : <ul className="divide-y divide-border">{rows.map(row => <li key={row.id} className="py-4 space-y-3"><div className="flex flex-wrap gap-2 items-center"><span className="font-medium break-words">{row.requester_name}</span><Badge variant="secondary">{t(`export.${row.status}`)}</Badge></div><p className="text-sm whitespace-pre-wrap break-words">{row.purpose}</p><div className="flex flex-wrap gap-2">{row.status === "pending" && <><Button size="sm" disabled={busy} onClick={() => review(row.id, "approved")}><Check className="h-4 w-4" />{t("export.approve")}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => review(row.id, "rejected")}><X className="h-4 w-4" />{t("export.reject")}</Button></>}{row.status === "approved" && <Button size="sm" variant="outline" disabled={busy} onClick={() => review(row.id, "revoked")}><ShieldOff className="h-4 w-4" />{t("export.revoke")}</Button>}</div></li>)}</ul>}
  </section>;
}