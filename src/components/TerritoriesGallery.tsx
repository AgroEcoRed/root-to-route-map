import { motion } from "framer-motion";
import comarca1 from "@/assets/foto-comarca-1.jpg.asset.json";
import verduras from "@/assets/foto-verduras.jpg.asset.json";
import girasoles from "@/assets/foto-girasoles.jpg.asset.json";
import papas from "@/assets/foto-papas.jpg.asset.json";
import ganaderia from "@/assets/foto-ganaderia.jpg.asset.json";
import productor from "@/assets/foto-productor.jpg.asset.json";

const photos = [
  { src: comarca1.url, alt: "Chacra agroecológica en la Comarca Andina", caption: "Comarca Andina", place: "Chubut / Río Negro", span: "sm:col-span-2 sm:row-span-2" },
  { src: verduras.url, alt: "Manos cosechando rabanitos y zanahorias agroecológicas", caption: "Cosecha diversificada", place: "Misiones", span: "" },
  { src: girasoles.url, alt: "Jornada a campo entre girasoles", caption: "Jornadas a campo", place: "Buenos Aires", span: "" },
  { src: papas.url, alt: "Variedades de papas nativas sobre la tierra", caption: "Semillas y variedades nativas", place: "Agrobiodiversidad", span: "sm:col-span-2" },
  { src: ganaderia.url, alt: "Ganadería sobre pastizal manejado agroecológicamente", caption: "Ganadería en pastizal", place: "Red RENAMA", span: "" },
  { src: productor.url, alt: "Productor compartiendo su experiencia en un lote de trigo", caption: "Saberes que circulan", place: "Encuentros territoriales", span: "" },
];

const TerritoriesGallery = () => (
  <section className="py-24 bg-background">
    <div className="container">
      <motion.div
        className="max-w-2xl mb-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <span className="eyebrow text-secondary">Territorios</span>
        <h2 className="text-4xl sm:text-5xl font-display text-foreground mt-5 mb-5 leading-[1.1] tracking-tight text-balance">
          La red tiene rostro, suelo y paisaje
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
          Imágenes de experiencias agroecológicas reales que forman parte del mapeo: chacras de montaña,
          pastizales, huertas familiares y encuentros donde los saberes circulan.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[160px] sm:auto-rows-[200px] gap-3 sm:gap-4">
        {photos.map((p, i) => (
          <motion.figure
            key={p.src}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.07 }}
            className={`group relative overflow-hidden rounded-2xl border border-border ${p.span}`}
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-display text-primary-foreground text-lg leading-tight">{p.caption}</p>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-primary-foreground/70 mt-1">{p.place}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  </section>
);

export default TerritoriesGallery;