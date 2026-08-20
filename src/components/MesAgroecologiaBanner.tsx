import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, MapPin } from "lucide-react";

/**
 * Acceso público y directo al mapa filtrado por la capa "Mes de la Agroecología".
 * Se muestra hasta que termine la edición 2026.
 */
const MesAgroecologiaBanner = () => {
  const visible = new Date() <= new Date("2026-12-31T23:59:59");
  if (!visible) return null;

  return (
    <section className="px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Sprout className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl text-foreground mb-1">Mes de la Agroecología</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Entrá directo al mapa con todas las actividades del Mes de la Agroecología: ferias, talleres,
            encuentros y visitas en todo el país. No hace falta registrarse para explorarlo.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full shrink-0">
          <Link to="/mapa?capa=mes_agroecologia">
            <MapPin className="h-4 w-4 mr-2" />
            Ver el mapa del Mes
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default MesAgroecologiaBanner;
