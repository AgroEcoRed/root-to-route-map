import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Globe, MapPin, Sprout, Users, AlertTriangle, Mail, Phone } from "lucide-react";

const slug = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".");

/**
 * PROTOTIPO (datos ficticios, sin guardar nada).
 * Ficha pública del/la facilitador/a + red de vínculos declarados, visible
 * solo para el equipo que administra la capa de la Red de Facilitadorxs.
 */
type Fac = { id: string; name: string; partido: string; region: string; temas: string[]; x: number; y: number; bio: string; desde: number; acomp: number };
type Link = { a: string; b: string; tipo: string; nota: string };

const FACS: Fac[] = [
  { id: "f1", name: "Lucía Fernández", partido: "La Plata", region: "Cinturón hortícola", temas: ["Horticultura", "Bioinsumos", "SPG"], x: 50, y: 45, bio: "Acompaña transiciones en quintas familiares y ferias locales.", desde: 2019, acomp: 34 },
  { id: "f2", name: "Martín Gómez", partido: "Tandil", region: "Sudeste", temas: ["Ganadería", "Pastoreo racional"], x: 22, y: 70, bio: "Trabaja con productores mixtos en sistemas pastoriles.", desde: 2021, acomp: 12 },
  { id: "f3", name: "Rocío Paz", partido: "Pergamino", region: "Norte", temas: ["Extensivos", "Semillas"], x: 30, y: 18, bio: "Facilita grupos de cambio rural en cultivos extensivos.", desde: 2020, acomp: 18 },
  { id: "f4", name: "Sergio Ledesma", partido: "Guaminí", region: "Oeste", temas: ["Extensivos", "Municipios"], x: 8, y: 42, bio: "Articula con el programa municipal de agroecología.", desde: 2018, acomp: 27 },
  { id: "f5", name: "Ana Quiroga", partido: "Florencio Varela", region: "Cinturón hortícola", temas: ["Horticultura", "Comercialización"], x: 72, y: 32, bio: "Apoya organizaciones de la agricultura familiar.", desde: 2022, acomp: 9 },
  { id: "f6", name: "Diego Ruiz", partido: "Mar Chiquita", region: "Costa", temas: ["Apicultura", "Bioinsumos"], x: 78, y: 75, bio: "Promueve corredores biológicos con apicultores.", desde: 2021, acomp: 15 },
];
const LINKS: Link[] = [
  { a: "f1", b: "f5", tipo: "Trabajo conjunto", nota: "Comparten feria y capacitación en bioinsumos" },
  { a: "f1", b: "f6", tipo: "Intercambio de saberes", nota: "Biopreparados" },
  { a: "f2", b: "f4", tipo: "Trabajo conjunto", nota: "Jornada de pastoreo 2025" },
  { a: "f3", b: "f4", tipo: "Mentoría", nota: "Transición en extensivos" },
  { a: "f2", b: "f6", tipo: "Intercambio de saberes", nota: "" },
  { a: "f3", b: "f1", tipo: "Derivación", nota: "Productor con interés en SPG" },
];

const PrototipoFacilitadoresPage = () => {
  const [sel, setSel] = useState("f1");
  const [team, setTeam] = useState(false);
  const fac = FACS.find((f) => f.id === sel)!;
  const mine = useMemo(() => LINKS.filter((l) => l.a === sel || l.b === sel), [sel]);
  const byId = (id: string) => FACS.find((f) => f.id === id)!;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-16 space-y-6">
        <div className="rounded-xl border border-wheat/40 bg-wheat/10 p-4 flex gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-wheat" />
          <p><strong>Prototipo para discusión.</strong> Datos ficticios. Todavía no aprobado por la Red de Facilitadorxs ni por el Ministerio. Sirve para ver cómo sería y qué habría que cambiar.</p>
        </div>
        <header>
          <h1 className="font-display text-3xl md:text-4xl">Red de Facilitadorxs en Agroecología</h1>
          <p className="text-muted-foreground mt-2">Ficha pública de cada facilitador/a y red de vínculos reservada al equipo que administra la capa.</p>
        </header>

        <Card className="p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm flex-1">Ya existe la capa real <strong>Red de Facilitadorxs</strong>, apagada para el público. Se puede mostrar en reunión con el acceso directo.</p>
          <Button asChild><a href="/mapa?capa=red_facilitadores"><MapPin className="h-4 w-4 mr-1" />Mapa de Facilitadorxs</a></Button>
          <Button asChild variant="outline"><a href="/admin/capas/red_facilitadores"><Lock className="h-4 w-4 mr-1" />Panel de la capa</a></Button>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button variant={!team ? "default" : "outline"} onClick={() => setTeam(false)}><Globe className="h-4 w-4 mr-1" /> Vista pública</Button>
          <Button variant={team ? "default" : "outline"} onClick={() => setTeam(true)}><Lock className="h-4 w-4 mr-1" /> Vista equipo de la capa</Button>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <Card className="p-2 h-fit">
            {FACS.map((f) => (
              <button key={f.id} onClick={() => setSel(f.id)} className={`w-full text-left rounded-lg px-3 py-2 text-sm ${sel === f.id ? "bg-primary/10" : "hover:bg-muted"}`}>
                <span className="font-medium">{f.name}</span>
                <span className="block text-xs text-muted-foreground">{f.partido}</span>
              </button>
            ))}
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center font-display text-2xl">{fac.name[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl">{fac.name}</h2>
                    <Badge variant="secondary"><Globe className="h-3 w-3 mr-1" />Ficha pública</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{fac.partido} · {fac.region}</p>
                  <p className="mt-3">{fac.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">{fac.temas.map((t) => <Badge key={t} variant="outline"><Sprout className="h-3 w-3 mr-1" />{t}</Badge>)}</div>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3"><p className="text-muted-foreground text-xs">Facilita desde</p><p className="font-semibold">{fac.desde}</p></div>
                    <div className="rounded-lg bg-muted/50 p-3"><p className="text-muted-foreground text-xs">Experiencias acompañadas</p><p className="font-semibold">{fac.acomp}</p></div>
                  </div>
                  <div className="mt-4 rounded-lg border p-3 text-sm space-y-1">
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p><Mail className="inline h-4 w-4 mr-1" /><a className="underline" href={`mailto:${slug(fac.name)}@ejemplo.org`}>{slug(fac.name)}@ejemplo.org</a></p>
                    <p><Phone className="inline h-4 w-4 mr-1" />+54 9 221 555-{fac.desde}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5" />
                <h3 className="font-display text-xl">Red de vínculos declarados</h3>
                <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Solo equipo de la capa</Badge>
              </div>
              {!team ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  <Lock className="h-6 w-6 mx-auto mb-2" />
                  Esta información es reservada. Solo la ve quien administra la capa de la Red.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <svg viewBox="0 0 100 90" className="w-full rounded-lg bg-muted/30">
                    {LINKS.map((l, i) => {
                      const a = byId(l.a), b = byId(l.b), on = l.a === sel || l.b === sel;
                      return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={on ? "stroke-primary" : "stroke-muted-foreground/30"} strokeWidth={on ? 0.8 : 0.4} />;
                    })}
                    {FACS.map((f) => (
                      <g key={f.id} onClick={() => setSel(f.id)} className="cursor-pointer">
                        <circle cx={f.x} cy={f.y} r={f.id === sel ? 4 : 3} className={f.id === sel ? "fill-primary" : "fill-secondary stroke-primary"} strokeWidth={0.4} />
                        <text x={f.x} y={f.y + 7} textAnchor="middle" className="fill-foreground" fontSize="3">{f.name.split(" ")[0]}</text>
                      </g>
                    ))}
                  </svg>
                  <ul className="space-y-2 text-sm">
                    {mine.map((l, i) => {
                      const o = byId(l.a === sel ? l.b : l.a);
                      return (
                        <li key={i} className="rounded-lg border p-3">
                          <p className="font-medium">{o.name} <span className="text-muted-foreground font-normal">· {o.partido}</span></p>
                          <p className="text-xs"><Badge variant="outline" className="mr-1">{l.tipo}</Badge>{l.nota}</p>
                        </li>
                      );
                    })}
                    <li className="text-xs text-muted-foreground">Cada facilitador/a declara sus vínculos desde su ficha; el equipo de la capa los valida.</li>
                  </ul>
                </div>
              )}
            </Card>

            <Card className="p-6 text-sm">
              <h3 className="font-display text-lg mb-2">Para conversar con la Red</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>¿Qué datos de la ficha son públicos y cuáles reservados?</li>
                <li>¿Qué tipos de vínculo tienen sentido para la Red?</li>
                <li>¿Quién valida los vínculos: la coordinación o cada región?</li>
                <li>¿Se muestran los facilitadores en el mapa con ubicación exacta o por partido?</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrototipoFacilitadoresPage;
