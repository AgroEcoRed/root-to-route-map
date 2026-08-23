import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLayerManager } from "@/hooks/useLayerManager";
import { useDataSources } from "@/hooks/useDataSources";
import { Layers, FileSpreadsheet, Pencil, CalendarDays, MapPin } from "lucide-react";

/**
 * Tarjeta visible en "Mi Perfil" para quienes administran una o más capas.
 * Explica en tres pasos qué pueden hacer y lleva directo al panel de su capa.
 */
export default function LayerManagerPanelCard() {
  const { layers, isAdmin, loading } = useLayerManager();
  const { sources } = useDataSources();

  if (loading || layers.length === 0) return null;

  const labelFor = (id: string) => sources.find((s) => s.source_id === id)?.label || id;

  return (
    <section className="rounded-2xl border-2 border-primary/40 bg-card p-6 mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <h2 className="font-display text-xl mb-1 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Administración de capas
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Gestionás {layers.length === 1 ? "una capa" : `${layers.length} capas`} de AgroEco.Red.
            Desde el panel de cada capa podés cargar información nueva, corregir la existente y
            decidir qué se ve en el mapa público.
          </p>
        </div>
        {isAdmin && <Badge variant="outline">Admin general</Badge>}
      </div>

      <ul className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground mb-4">
        <li className="flex items-start gap-2 rounded-xl border border-border p-3">
          <FileSpreadsheet className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground block">1. Subir una planilla</strong>
            Descargá la plantilla Excel/CSV (actores o actividades) y subila: si falta la
            ubicación, se deduce desde la dirección o localidad.
          </span>
        </li>
        <li className="flex items-start gap-2 rounded-xl border border-border p-3">
          <Pencil className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground block">2. Editar y verificar</strong>
            Corregí cualquier registro de tu capa, marcalo como verificado o enviá el link para
            que el propio actor confirme sus datos.
          </span>
        </li>
        <li className="flex items-start gap-2 rounded-xl border border-border p-3">
          <CalendarDays className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground block">3. Publicar o reservar</strong>
            Cada punto y actividad puede quedar visible en el mapa público o sólo para tu equipo.
          </span>
        </li>
      </ul>

      <div className="flex flex-wrap gap-2">
        {layers.map((id) => (
          <Button key={id} asChild size="sm">
            <Link to={`/admin/capas/${id}`}>
              <Layers className="h-4 w-4 mr-1.5" /> Panel de {labelFor(id)}
            </Link>
          </Button>
        ))}
        <Button asChild size="sm" variant="outline">
          <Link to="/mapa"><MapPin className="h-4 w-4 mr-1.5" /> Ver cómo se ve en el mapa</Link>
        </Button>
      </div>
    </section>
  );
}
