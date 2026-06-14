import { useState } from "react";
import { Settings, Layers, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useDataSources } from "@/hooks/useDataSources";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

interface Props {
  /** floating button position class (e.g. "bottom-6 right-6") */
  position?: string;
}

export const DataSourceToggle = ({ position = "bottom-6 right-6" }: Props) => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { sources, toggle } = useDataSources();
  const [pending, setPending] = useState<string | null>(null);

  if (adminLoading || !isAdmin) return null;

  const handleToggle = async (id: string, next: boolean) => {
    setPending(id);
    const { error } = await toggle(id as any, next);
    setPending(null);
    if (error) toast.error("No se pudo actualizar la capa: " + error.message);
    else toast.success(`Capa "${id}" ${next ? "activada" : "desactivada"}`);
  };

  return (
    <div className={`fixed ${position} z-[1100]`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="rounded-full shadow-elevated bg-card border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            title="Controles de admin: capas de fuentes"
          >
            <Layers className="h-5 w-5 mr-2" />
            <span className="text-xs font-semibold">Capas (admin)</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-80 z-[1200]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm">Fuentes de datos</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Activá o desactivá cada fuente. Afecta el mapa y el marketplace para todos los visitantes.
            </p>
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.source_id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    {s.enabled
                      ? <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                      : <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.source_id}</p>
                    </div>
                  </div>
                  {pending === s.source_id
                    ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    : <Switch checked={s.enabled} onCheckedChange={(v) => handleToggle(s.source_id, v)} />}
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};