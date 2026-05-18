import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Sprout, Leaf, Coins, Users, BookHeart, Plus, Calendar } from "lucide-react";

type Dimension = "agronomic" | "ecological" | "economic" | "social" | "cultural";

const DIMENSIONS: { key: Dimension; label: string; icon: typeof Sprout; color: string }[] = [
  { key: "agronomic", label: "Agronómica", icon: Sprout, color: "hsl(var(--primary))" },
  { key: "ecological", label: "Ecológica", icon: Leaf, color: "hsl(var(--leaf, var(--primary)))" },
  { key: "economic", label: "Económica", icon: Coins, color: "hsl(var(--accent))" },
  { key: "social", label: "Social / Organizacional", icon: Users, color: "hsl(var(--secondary))" },
  { key: "cultural", label: "Cultural", icon: BookHeart, color: "hsl(var(--soil, var(--secondary)))" },
];

interface Record {
  id: string;
  dimension: Dimension;
  indicator_key: string;
  value: number;
  period_year: number;
  period_quarter: number | null;
  notes: string | null;
}

interface Milestone {
  id: string;
  occurred_on: string;
  title: string;
  description: string | null;
  milestone_type: string;
}

const currentYear = new Date().getFullYear();

export default function TransitionPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);

  // Form state
  const [dimension, setDimension] = useState<Dimension>("agronomic");
  const [indicatorKey, setIndicatorKey] = useState("");
  const [value, setValue] = useState([50]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [msDate, setMsDate] = useState(new Date().toISOString().slice(0, 10));
  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [r, m] = await Promise.all([
        supabase
          .from("transition_records")
          .select("*")
          .eq("user_id", user.id)
          .order("period_year", { ascending: false }),
        supabase
          .from("profile_milestones")
          .select("*")
          .eq("user_id", user.id)
          .order("occurred_on", { ascending: false }),
      ]);
      setRecords((r.data as Record[]) || []);
      setMilestones((m.data as Milestone[]) || []);
      setLoading(false);
    })();
  }, [user]);

  // Aggregate per dimension for the chosen year (avg of indicator values)
  const radarData = useMemo(() => {
    return DIMENSIONS.map((d) => {
      const yearRecs = records.filter((r) => r.dimension === d.key && r.period_year === year);
      const avg = yearRecs.length
        ? yearRecs.reduce((s, r) => s + Number(r.value), 0) / yearRecs.length
        : 0;
      return { dimension: d.label, value: Math.round(avg), fullMark: 100 };
    });
  }, [records, year]);

  const availableYears = useMemo(() => {
    const ys = new Set(records.map((r) => r.period_year));
    ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [records]);

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!indicatorKey.trim()) {
      toast.error("Nombrá el indicador (ej. 'reducción de agroquímicos').");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("transition_records")
      .insert({
        user_id: user.id,
        dimension,
        indicator_key: indicatorKey.trim(),
        value: value[0],
        period_year: year,
        notes: notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    setRecords((prev) => [data as Record, ...prev]);
    setIndicatorKey("");
    setNotes("");
    setValue([50]);
    toast.success("Indicador registrado");
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!msTitle.trim()) {
      toast.error("Poné un título al hito.");
      return;
    }
    const { data, error } = await supabase
      .from("profile_milestones")
      .insert({
        user_id: user.id,
        occurred_on: msDate,
        title: msTitle.trim(),
        description: msDesc.trim() || null,
      })
      .select()
      .single();
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    setMilestones((prev) => [data as Milestone, ...prev]);
    setMsTitle("");
    setMsDesc("");
    toast.success("Hito agregado a la trayectoria");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-primary">
              Monitoreo de transición agroecológica
            </p>
            <h1 className="font-display text-4xl md:text-5xl">Tu trayectoria</h1>
            <p className="text-muted-foreground max-w-2xl">
              La agroecología es un proceso, no una etiqueta. Registrá indicadores por dimensión y
              los hitos clave de tu camino. Tu rueda y línea de tiempo muestran cómo evolucionás.
            </p>
          </div>

          {!user ? (
            <Card className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">
                Ingresá a tu cuenta para registrar tu trayectoria agroecológica.
              </p>
              <Button asChild>
                <Link to="/ingresar">Ingresar</Link>
              </Button>
            </Card>
          ) : loading ? (
            <Card className="p-8 text-center text-muted-foreground">Cargando…</Card>
          ) : (
            <>
              {/* Rueda + selector año */}
              <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-2xl">Rueda de transición</h2>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Avance"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.35}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Cada eje es un promedio de tus indicadores en esa dimensión para {year}.
                  </p>
                </Card>

                <Card className="p-6 lg:w-80 space-y-3">
                  <h3 className="font-display text-lg">Dimensiones</h3>
                  {DIMENSIONS.map((d) => {
                    const Icon = d.icon;
                    const count = records.filter(
                      (r) => r.dimension === d.key && r.period_year === year,
                    ).length;
                    return (
                      <div
                        key={d.key}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          {d.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {count} indicador{count === 1 ? "" : "es"}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </div>

              {/* Formulario indicador */}
              <Card className="p-6">
                <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Registrar indicador
                </h2>
                <form onSubmit={handleSaveRecord} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dimensión</Label>
                    <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIMENSIONS.map((d) => (
                          <SelectItem key={d.key} value={d.key}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Indicador</Label>
                    <Input
                      placeholder="ej. reducción de agroquímicos"
                      value={indicatorKey}
                      onChange={(e) => setIndicatorKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Avance: <span className="font-semibold text-primary">{value[0]}%</span>
                    </Label>
                    <Slider value={value} onValueChange={setValue} max={100} step={5} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contexto, metodología, evidencia…"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando…" : `Registrar para ${year}`}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Timeline */}
              <Card className="p-6">
                <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Línea de tiempo
                </h2>
                <form
                  onSubmit={handleSaveMilestone}
                  className="grid md:grid-cols-[auto_1fr_auto] gap-3 mb-6 items-end"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha</Label>
                    <Input
                      type="date"
                      value={msDate}
                      onChange={(e) => setMsDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hito</Label>
                    <Input
                      placeholder="ej. inicio de transición, primera venta directa…"
                      value={msTitle}
                      onChange={(e) => setMsTitle(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Agregar</Button>
                  <div className="md:col-span-3 space-y-1">
                    <Textarea
                      rows={2}
                      placeholder="Descripción (opcional)"
                      value={msDesc}
                      onChange={(e) => setMsDesc(e.target.value)}
                    />
                  </div>
                </form>

                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Tu trayectoria está vacía. Agregá el primer hito.
                  </p>
                ) : (
                  <ol className="relative border-l-2 border-primary/30 ml-3 space-y-6">
                    {milestones.map((m) => (
                      <li key={m.id} className="pl-6 relative">
                        <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.occurred_on).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="font-semibold">{m.title}</p>
                        {m.description && (
                          <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              {/* Registros recientes */}
              {records.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-display text-2xl mb-4">Indicadores registrados</h2>
                  <div className="space-y-2">
                    {records.slice(0, 20).map((r) => {
                      const dim = DIMENSIONS.find((d) => d.key === r.dimension);
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 text-sm"
                        >
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                            {dim?.label}
                          </span>
                          <span className="flex-1 truncate">{r.indicator_key}</span>
                          <span className="text-muted-foreground">{r.period_year}</span>
                          <span className="font-semibold text-primary w-12 text-right">
                            {Math.round(Number(r.value))}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}