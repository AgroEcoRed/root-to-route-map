import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LICENSES } from "@/lib/licenses";
import { Badge } from "@/components/ui/badge";

const LicensesPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl mb-3">Licencias y uso de contenidos</h1>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            AgroEco.Red se construye como un bien común digital. Por eso, los
            contenidos que cada experiencia decide publicar pueden compartirse
            bajo licencias abiertas <strong>Creative Commons</strong>. Acá te
            contamos cómo funciona y qué opciones tenés.
          </p>

          <section className="space-y-4 mb-10">
            <h2 className="font-display text-2xl">Principios</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed">
              <li>
                <strong>Vos sos titular de tus contenidos.</strong> Las fotos,
                videos, textos, documentos y datos que cargás siguen siendo
                tuyos (o de tu organización). AgroEco.Red no se apropia de
                ellos.
              </li>
              <li>
                <strong>Vos elegís la licencia.</strong> Al subir contenido,
                podés indicar bajo qué condiciones autorizás que otras personas
                lo reutilicen. Por defecto sugerimos{" "}
                <strong>CC BY-SA 4.0</strong>, una licencia abierta con
                atribución y compartir igual.
              </li>
              <li>
                <strong>Podés cambiarla.</strong> Podés actualizar la licencia
                de tus contenidos en cualquier momento. (Los usos previos
                realizados bajo la licencia anterior siguen siendo válidos: así
                funcionan las licencias CC en todo el mundo).
              </li>
              <li>
                <strong>Podés retirarlos.</strong> Podés dar de baja tus
                contenidos cuando quieras. AgroEco.Red no exige permanencia
                obligatoria.
              </li>
              <li>
                <strong>No vendemos datos.</strong> AgroEco.Red es un proyecto
                de investigación sin fines de lucro. No existe comercialización
                de información personal ni de contenidos cargados.
              </li>
            </ul>
          </section>

          <section className="space-y-4 mb-10">
            <h2 className="font-display text-2xl">Licencias disponibles</h2>
            <p className="text-sm text-muted-foreground">
              Para cada contenido podés elegir entre las siguientes licencias:
            </p>
            <div className="space-y-4">
              {LICENSES.map((l) => (
                <div
                  key={l.code}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge variant={l.open ? "secondary" : "outline"}>
                      {l.short}
                    </Badge>
                    <h3 className="font-display text-lg">{l.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {l.description}
                  </p>
                  {l.url && (
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      Texto legal completo →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 mb-10">
            <h2 className="font-display text-2xl">¿Cómo reutilizar contenido de AgroEco.Red?</h2>
            <p className="text-sm leading-relaxed">
              Si querés reutilizar una foto, un video, un documento o un dato
              publicado en la plataforma:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
              <li>Fijate qué licencia tiene asignada (aparece junto al contenido).</li>
              <li>Respetá los términos de esa licencia (atribución, uso no comercial, compartir igual, etc.).</li>
              <li>
                Dale crédito a la experiencia que lo aportó y, cuando sea
                posible, enlazá a su perfil en AgroEco.Red.
              </li>
            </ol>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cuando no haya licencia visible o aparezca <em>Todos los derechos
              reservados</em>, debés contactar a la persona u organización
              autora antes de reutilizar el contenido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl">Plataforma y código</h2>
            <p className="text-sm leading-relaxed">
              El <strong>código fuente</strong> de AgroEco.Red se publica bajo
              la licencia <strong>GNU AGPL-3.0</strong>. Los{" "}
              <strong>datos georreferenciados</strong> del mapa colaborativo se
              publican bajo <strong>Open Database License (ODbL 1.0)</strong>.
              Los <strong>contenidos colaborativos</strong> (textos, fotos,
              documentos) se comparten por defecto bajo{" "}
              <strong>Creative Commons BY-SA 4.0</strong>, salvo que quien los
              aportó haya elegido otra licencia.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Las marcas y logotipos de terceros (organizaciones, redes,
              instituciones) son propiedad de sus respectivos titulares y se
              muestran únicamente con fines de identificación, con la debida
              autorización cuando corresponde.
            </p>
            <p className="text-sm leading-relaxed">
              Guía técnica para replicar o auto-alojar la plataforma:{" "}
              <a
                href="https://codeberg.org/agroecored/agroeco.red/src/branch/main/docs/self-hosting.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                docs/self-hosting.md
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LicensesPage;