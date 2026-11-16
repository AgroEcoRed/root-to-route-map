import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Share2, Download, Send, RefreshCw, Code, Eye } from "lucide-react";
import { mapEmbedCode, mapShareUrl } from "@/lib/mapSharing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLayerManager } from "@/hooks/useLayerManager";
import type { DataSourceId } from "@/hooks/useDataSources";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MapExportDialog() {
  const { user } = useAuth();
  const { canManage } = useLayerManager();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [layers, setLayers] = useState<{ source_id: string; label: string }[]>([]);
  const [layer, setLayer] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState(false);
  const loadStatus = useCallback(async () => {
    setLoaded(false);
    setStatus(null);
    if (user && layer) {
      const { data, error } = await supabase.from("layer_export_requests").select("status").eq("layer_id", layer).eq("requester_id", user.id).maybeSingle();
      if (error) { toast.error(t("export.error")); return; }
      setStatus(data?.status || null);
    }
    setLoaded(true);
  }, [user, layer, t]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    supabase.functions.invoke("map-export", { body: { action: "layers" } }).then(({ data, error }) => {
      if (!active) return;
      if (error) { toast.error(t("export.error")); return; }
      setLayers(data.layers || []);
      setLayer(current => current || data.layers?.find((l: { source_id: string }) => l.source_id === new URLSearchParams(window.location.search).get('capa'))?.source_id || data.layers?.[0]?.source_id || "");
    });
    return () => { active = false; };
  }, [open, t]);
  useEffect(() => { if (open) loadStatus(); }, [open, loadStatus]);
  const authorized = canManage(layer as DataSourceId) || status === "approved";
  const execute = async (action: "request" | "download", format?: "geojson" | "csv") => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("map-export", { body: { action, layer_id: layer, requester_name: name, purpose, format } });
      if (error || data?.error) throw new Error("export");
      if (action === "request") { setStatus(data.status); toast.success(t("export.sent")); }
      else {
        const url = URL.createObjectURL(new Blob([data.content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/geo+json" }));
        const a = document.createElement("a"); a.href = url; a.download = data.filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(`${data.count} ${t("export.records")}`);
      }
    } catch { toast.error(t("export.error")); }
    finally { setBusy(false); }
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(mapShareUrl(window.location.search)); toast.success(t("export.copied")); }
    catch { toast.error(t("export.error")); }
  };
  const copyEmbed = async () => {
    try { await navigator.clipboard.writeText(mapEmbedCode(window.location.search, layer)); toast.success(t('export.embedCopied')); }
    catch { toast.error(t('export.error')); }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline" className="rounded-full h-10 shrink-0 px-3" aria-label={t("export.title")} title={t("export.title")}><Share2 className="h-4 w-4" /><span className="hidden lg:inline">{t("export.title")}</span></Button></DialogTrigger>
    <DialogContent className="z-[2000] max-w-lg max-h-[85dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{t("export.title")}</DialogTitle><DialogDescription>{t("export.permission")}</DialogDescription></DialogHeader>
      <Button variant="outline" onClick={share}><Share2 className="h-4 w-4" />{t("export.share")}</Button>
      <div className="border-t border-border pt-4 space-y-4">
        <Label htmlFor="export-layer">{t("export.layer")}</Label>
        <Select value={layer} onValueChange={setLayer}><SelectTrigger id="export-layer"><SelectValue placeholder={t("export.layer")} /></SelectTrigger><SelectContent className="z-[2100]">{layers.map(l => <SelectItem key={l.source_id} value={l.source_id}>{l.label}</SelectItem>)}</SelectContent></Select>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={!layer} onClick={copyEmbed}><Code className="h-4 w-4" />{t('export.embed')}</Button>
          <Button variant="ghost" disabled={!layer} onClick={() => setPreview(value => !value)} aria-expanded={preview}><Eye className="h-4 w-4" />{t('export.preview')}</Button>
        </div>
        {preview && layer && <iframe title="AgroEco.Red · Mapa Vivo" className="w-full h-80 border border-border rounded-lg" src={`${new URL(mapShareUrl(window.location.search, layer, true)).pathname}${new URL(mapShareUrl(window.location.search, layer, true)).search}`} />}
        {!user ? <Button asChild><Link to="/ingresar">{t("export.login")}</Link></Button> : !loaded ? <p className="text-sm text-muted-foreground">{t("export.loading")}</p> : authorized ? <div className="space-y-3"><p className="text-sm text-primary">{t("export.approved")}</p><div className="flex gap-2 flex-wrap">{(["geojson", "csv"] as const).map(format => <Button key={format} disabled={busy || !layer} onClick={() => execute("download", format)}><Download className="h-4 w-4" />{format.toUpperCase()}</Button>)}</div><p className="text-xs text-muted-foreground">ODbL 1.0 · AgroEco.Red</p></div> : status === "pending" ? <div className="flex gap-2 items-center"><p className="text-sm">{t("export.pending")}</p><Button size="icon" variant="ghost" onClick={loadStatus} title={t("export.refresh")} aria-label={t("export.refresh")}><RefreshCw className="h-4 w-4" /></Button></div> : <div className="space-y-3">
          {status && <p className="text-sm text-muted-foreground">{t(`export.${status}`)}</p>}
          <Label htmlFor="export-name">{t("export.name")}</Label><Input id="export-name" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
          <Label htmlFor="export-purpose">{t("export.purpose")}</Label><Textarea id="export-purpose" value={purpose} maxLength={2000} onChange={e => setPurpose(e.target.value)} />
          <Button disabled={busy || !layer || !name.trim() || purpose.trim().length < 10} onClick={() => execute("request")}><Send className="h-4 w-4" />{t("export.request")}</Button>
        </div>}
      </div>
    </DialogContent>
  </Dialog>;
}