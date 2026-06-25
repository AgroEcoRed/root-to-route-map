import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CalendarDays, MapPin, Sparkles, Phone, Mail, Link as LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AgroEventFull, eventBucket } from "@/hooks/useEvents";

interface Props {
  events: AgroEventFull[];
  onFlyTo?: (lat: number, lng: number) => void;
  /** Embedded inline (desktop) or as a Sheet (mobile). */
  variant?: "inline" | "drawer";
}

const typeLabels: Record<string, string> = { feria: "Feria", intercambio: "Intercambio", formacion: "Formación", otro: "Actividad" };
const typeColor: Record<string, string> = { feria: "#E94560", intercambio: "#22C55E", formacion: "#3B82F6", otro: "#F5C518" };

const Card = ({ ev, onFlyTo }: { ev: AgroEventFull; onFlyTo?: (lat: number, lng: number) => void }) => {
  const dt = ev.starts_at ? new Date(ev.starts_at) : null;
  const dateStr = dt
    ? dt.toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Sin fecha";
  const contactLine = ev.contact_email || ev.contact_phone || ev.contact;
  return (
    <article className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md text-white"
          style={{ background: typeColor[ev.event_type] || "#6b7280" }}
        >
          {typeLabels[ev.event_type] || ev.event_type}
        </span>
        {ev.lat != null && ev.lng != null && onFlyTo && (
          <button
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
            onClick={() => onFlyTo(ev.lat!, ev.lng!)}
          >
            <MapPin className="h-3 w-3" /> Ver en mapa
          </button>
        )}
      </div>
      <h4 className="font-display text-sm leading-tight mb-1">{ev.title}</h4>
      <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
        <CalendarDays className="h-3 w-3" /> {dateStr}
      </p>
      {ev.location_name && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <MapPin className="h-3 w-3" /> {ev.location_name}
        </p>
      )}
      {ev.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{ev.description}</p>}
      {(ev.extra_organizer_names?.length || ev.co_organizers?.length) && (
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Co-organizan: {ev.extra_organizer_names?.join(", ") || `${ev.co_organizers.length} actores`}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ev.contact_email && (
          <a href={`mailto:${ev.contact_email}`} className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline">
            <Mail className="h-3 w-3" /> {ev.contact_email}
          </a>
        )}
        {ev.contact_phone && (
          <a href={`tel:${ev.contact_phone}`} className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline">
            <Phone className="h-3 w-3" /> {ev.contact_phone}
          </a>
        )}
        {!ev.contact_email && !ev.contact_phone && contactLine && (
          <span className="text-[11px] text-muted-foreground">📞 {contactLine}</span>
        )}
        {ev.link && (
          <a href={ev.link} target="_blank" rel="noopener noreferrer" className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline">
            <LinkIcon className="h-3 w-3" /> Más info
          </a>
        )}
      </div>
    </article>
  );
};

export const EventsSidebarContent = ({ events, onFlyTo }: { events: AgroEventFull[]; onFlyTo?: (lat: number, lng: number) => void }) => {
  const grouped = useMemo(() => {
    const upcoming: AgroEventFull[] = [];
    const undated: AgroEventFull[] = [];
    const past: AgroEventFull[] = [];
    events.forEach((e) => {
      const b = eventBucket(e);
      if (b === "upcoming") upcoming.push(e);
      else if (b === "undated_or_unplaced") undated.push(e);
      else past.push(e);
    });
    upcoming.sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
    past.sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at));
    return { upcoming, undated, past };
  }, [events]);

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="upcoming" className="text-xs">Próximas ({grouped.upcoming.length})</TabsTrigger>
        <TabsTrigger value="undated" className="text-xs">Sin fecha/lugar ({grouped.undated.length})</TabsTrigger>
        <TabsTrigger value="past" className="text-xs">Pasadas ({grouped.past.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming" className="mt-3 space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
        {grouped.upcoming.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Sin actividades próximas. ¡Sumá una!</p>}
        {grouped.upcoming.map((e) => <Card key={e.id} ev={e} onFlyTo={onFlyTo} />)}
      </TabsContent>
      <TabsContent value="undated" className="mt-3 space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
        {grouped.undated.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Sin actividades sin fecha o lugar.</p>}
        {grouped.undated.map((e) => <Card key={e.id} ev={e} onFlyTo={onFlyTo} />)}
      </TabsContent>
      <TabsContent value="past" className="mt-3 space-y-2 max-h-[60vh] lg:max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
        {grouped.past.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Sin actividades pasadas.</p>}
        {grouped.past.map((e) => <Card key={e.id} ev={e} onFlyTo={onFlyTo} />)}
      </TabsContent>
    </Tabs>
  );
};

/** Sidebar that collapses (desktop) and turns into a sheet (mobile). */
export const EventsSidebar = ({ events, onFlyTo }: Props) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Desktop: collapsible panel anchored to the right */}
      <div className="hidden lg:flex absolute top-3 right-3 z-[900] items-start">
        {open ? (
          <div className="w-[340px] max-h-[calc(100vh-180px)] bg-card/95 backdrop-blur border border-border rounded-2xl shadow-elevated p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-display text-base">Actividades</h3>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)} title="Ocultar">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <EventsSidebarContent events={events} onFlyTo={onFlyTo} />
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="rounded-l-full rounded-r-none border-r-0 bg-card/95 backdrop-blur shadow-elevated"
            onClick={() => setOpen(true)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Actividades
          </Button>
        )}
      </div>

      {/* Mobile: bottom-right trigger opens a Sheet */}
      <div className="lg:hidden absolute top-3 right-3 z-[900]">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="rounded-full bg-card text-foreground border-2 border-primary/30 shadow-elevated">
              <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> Actividades
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[92vw] sm:w-[400px] z-[10000]">
            <SheetHeader>
              <SheetTitle className="font-display">Actividades</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <EventsSidebarContent events={events} onFlyTo={onFlyTo} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default EventsSidebar;