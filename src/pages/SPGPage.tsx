import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, BookOpen, Users, Sprout, ArrowRight, CircleCheck, CircleDot, Circle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

/**
 * Página dedicada a Sistemas Participativos de Garantías (SPG).
 * Antes /garantias reusaba CommunityPage y por eso aparecía "Comunidad y Saberes"
 * duplicado. Ahora tiene contenido propio y enlaza a la Biblioteca filtrada
 * por la etiqueta `participatory-guarantee`.
 */
const SPGPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-10 bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="container">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-secondary/10 text-secondary mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Garantías Participativas
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-foreground mb-4">
              Sistemas Participativos de Garantías (SPG)
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Una forma colectiva y territorial de garantizar la calidad agroecológica: se construye
              entre productoras, consumidoras y organizaciones acompañantes, mediante visitas, diálogo,
              acuerdos y verificación entre pares. Es una alternativa horizontal a la certificación
              privada por tercera parte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Niveles / semáforo */}
      <section className="py-12">
        <div className="container max-w-5xl">
          <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-2 text-center">
            Niveles de verificación en AgroEco.Red
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Cada iniciativa avanza a su ritmo. El color no juzga: acompaña el proceso.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { color: "#dc2626", Icon: Circle, title: "En proceso (rojo)", body: "Autodeclaración inicial. Aún no hubo visitas ni acuerdo colectivo. Se sostiene por la palabra de quien produce." },
              { color: "#eab308", Icon: CircleDot, title: "En transición (amarillo)", body: "Ya hubo diálogo con la red, visitas cruzadas o acuerdos parciales. Se documentan prácticas y compromisos." },
              { color: "#16a34a", Icon: CircleCheck, title: "Verificado por SPG (verde)", body: "Un colectivo o SPG local respaldó la trayectoria. Se releva periódicamente y se pueden emitir avales visibles." },
            ].map((n) => (
              <div key={n.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <n.Icon className="h-6 w-6 mb-2" style={{ color: n.color }} />
                <h3 className="font-display text-lg text-foreground mb-1">{n.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principios */}
      <section className="py-12 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-6 text-center">
            Principios de un SPG
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { Icon: Users, title: "Participación", body: "Productoras, consumidoras y organizaciones deciden juntas los criterios y los verifican." },
              { Icon: Sprout, title: "Agroecología en la práctica", body: "Se evalúa el proceso productivo real, no sólo un insumo permitido o prohibido." },
              { Icon: ShieldCheck, title: "Transparencia", body: "Los acuerdos, visitas y decisiones quedan documentados y accesibles a la red." },
              { Icon: BookOpen, title: "Aprendizaje continuo", body: "Cada visita es también una instancia de formación y mejora colectiva." },
            ].map((p) => (
              <div key={p.title} className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <p.Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Biblioteca SPG */}
      <section className="py-14">
        <div className="container max-w-4xl">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-8 sm:p-10 text-center">
            <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-2">
              Textos y documentos sobre SPG
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Sumamos a la biblioteca colaborativa normas, sistematizaciones y estudios sobre
              Sistemas Participativos de Garantía en Argentina y la región. Podés leerlos,
              descargarlos y aportar los propios.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/biblioteca?tag=participatory-guarantee">
                  Ver biblioteca de SPG <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/biblioteca">Ir a toda la biblioteca</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SPGPage;