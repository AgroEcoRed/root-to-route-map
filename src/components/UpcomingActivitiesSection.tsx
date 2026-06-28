import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { useEvents, eventBucket, glowIntensity, proximityColor } from "@/hooks/useEvents";

const typeLabels: Record<string, string> = {
  feria: "Feria",
  intercambio: "Intercambio",
  formacion: "Formación",
  taller: "Taller",
  otro: "Actividad",
};

const Star = ({ color, size = 28 }: { color: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
    <polygon
      points="12,1.5 14.7,8.7 22.5,9.2 16.5,14.2 18.5,21.8 12,17.5 5.5,21.8 7.5,14.2 1.5,9.2 9.3,8.7"
      fill={color}
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const UpcomingActivitiesSection = () => {
  const { events, loading } = useEvents();

  const upcoming = events
    .filter((e) => eventBucket(e) === "upcoming")
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
    .slice(0, 6);

  if (loading || upcoming.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest font-semibold">Agenda viva</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl leading-tight">Próximas actividades</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
              Ferias, talleres e intercambios que están por suceder en la red. Las estrellas brillan más
              fuerte y se vuelven más cálidas a medida que se acerca la fecha.
            </p>
          </div>
          <Link
            to="/mapa"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline self-start md:self-auto"
          >
            Ver todas en el Mapa Vivo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((ev) => {
            const intensity = glowIntensity(ev.starts_at);
            const color = proximityColor(intensity);
            const dt = new Date(ev.starts_at);
            const dateStr = dt.toLocaleString("es-AR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <Link
                key={ev.id}
                to={`/mapa?event=${ev.id}`}
                className="group relative rounded-2xl border border-border bg-card p-4 pl-5 shadow-sm hover:shadow-elevated hover:-translate-y-0.5 transition overflow-hidden"
                style={{ boxShadow: `inset 5px 0 0 0 ${color}` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-muted text-foreground/80">
                    {typeLabels[ev.event_type] || ev.event_type}
                  </span>
                  <Star color={color} />
                </div>
                <h3 className="font-display text-lg leading-snug mb-1.5 group-hover:text-primary transition">
                  {ev.title}
                </h3>
                <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> {dateStr}
                </p>
                {ev.location_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {ev.location_name}
                  </p>
                )}
                {ev.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition">
                  Ver en el mapa <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UpcomingActivitiesSection;