import type { Lang } from "@/contexts/LanguageContext";

// Curated, multilingual taxonomy for the library.
// Slugs are stored in the DB; labels are rendered per language.
export const TAG_LABELS: Record<string, Record<Lang, string>> = {
  "agroecological-transition": {
    es: "Transición agroecológica",
    en: "Agroecological transition",
    fr: "Transition agroécologique",
    pt: "Transição agroecológica",
  },
  "chemical-reduction": {
    es: "Reducción de químicos",
    en: "Chemical reduction",
    fr: "Réduction des intrants chimiques",
    pt: "Redução de químicos",
  },
  "participatory-guarantee": {
    es: "Sistemas Participativos de Garantías (SPG)",
    en: "Participatory Guarantee Systems (PGS)",
    fr: "Systèmes Participatifs de Garantie (SPG)",
    pt: "Sistemas Participativos de Garantia (SPG)",
  },
  "organic-farming": {
    es: "Agricultura orgánica",
    en: "Organic farming",
    fr: "Agriculture biologique",
    pt: "Agricultura orgânica",
  },
  "agroforestry": {
    es: "Agroforestería",
    en: "Agroforestry",
    fr: "Agroforesterie",
    pt: "Agrofloresta",
  },
  "soil-health": {
    es: "Salud del suelo",
    en: "Soil health",
    fr: "Santé des sols",
    pt: "Saúde do solo",
  },
  "biodiversity": {
    es: "Biodiversidad",
    en: "Biodiversity",
    fr: "Biodiversité",
    pt: "Biodiversidade",
  },
  "seed-sovereignty": {
    es: "Soberanía de semillas",
    en: "Seed sovereignty",
    fr: "Souveraineté semencière",
    pt: "Soberania das sementes",
  },
  "food-sovereignty": {
    es: "Soberanía alimentaria",
    en: "Food sovereignty",
    fr: "Souveraineté alimentaire",
    pt: "Soberania alimentar",
  },
  "food-security": {
    es: "Seguridad alimentaria",
    en: "Food security",
    fr: "Sécurité alimentaire",
    pt: "Segurança alimentar",
  },
  "climate-change": {
    es: "Cambio climático",
    en: "Climate change",
    fr: "Changement climatique",
    pt: "Mudança climática",
  },
  "carbon-sequestration": {
    es: "Secuestro de carbono",
    en: "Carbon sequestration",
    fr: "Séquestration du carbone",
    pt: "Sequestro de carbono",
  },
  "water-management": {
    es: "Gestión del agua",
    en: "Water management",
    fr: "Gestion de l'eau",
    pt: "Gestão da água",
  },
  "composting-bioinputs": {
    es: "Compost y bioinsumos",
    en: "Composting & bioinputs",
    fr: "Compost et bio-intrants",
    pt: "Compostagem e bioinsumos",
  },
  "pest-management": {
    es: "Manejo agroecológico de plagas",
    en: "Agroecological pest management",
    fr: "Gestion agroécologique des ravageurs",
    pt: "Manejo agroecológico de pragas",
  },
  "pollinators": {
    es: "Polinizadores",
    en: "Pollinators",
    fr: "Pollinisateurs",
    pt: "Polinizadores",
  },
  "permaculture": {
    es: "Permacultura",
    en: "Permaculture",
    fr: "Permaculture",
    pt: "Permacultura",
  },
  "regenerative-agriculture": {
    es: "Agricultura regenerativa",
    en: "Regenerative agriculture",
    fr: "Agriculture régénérative",
    pt: "Agricultura regenerativa",
  },
  "family-farming": {
    es: "Agricultura familiar y campesina",
    en: "Family & peasant farming",
    fr: "Agriculture familiale et paysanne",
    pt: "Agricultura familiar e camponesa",
  },
  "short-supply-chains": {
    es: "Circuitos cortos de comercialización",
    en: "Short supply chains",
    fr: "Circuits courts",
    pt: "Circuitos curtos",
  },
  "public-policy": {
    es: "Políticas públicas",
    en: "Public policy",
    fr: "Politiques publiques",
    pt: "Políticas públicas",
  },
  "gender-equity": {
    es: "Género y equidad",
    en: "Gender & equity",
    fr: "Genre et équité",
    pt: "Gênero e equidade",
  },
  "indigenous-knowledge": {
    es: "Saberes indígenas y ancestrales",
    en: "Indigenous & ancestral knowledge",
    fr: "Savoirs autochtones et ancestraux",
    pt: "Saberes indígenas e ancestrais",
  },
  "livestock-pastoralism": {
    es: "Ganadería y pastoreo",
    en: "Livestock & pastoralism",
    fr: "Élevage et pastoralisme",
    pt: "Pecuária e pastoreio",
  },
  "urban-agriculture": {
    es: "Agricultura urbana",
    en: "Urban agriculture",
    fr: "Agriculture urbaine",
    pt: "Agricultura urbana",
  },
  "health-nutrition": {
    es: "Salud y nutrición",
    en: "Health & nutrition",
    fr: "Santé et nutrition",
    pt: "Saúde e nutrição",
  },
  "education-extension": {
    es: "Educación y extensión rural",
    en: "Education & rural extension",
    fr: "Éducation et vulgarisation",
    pt: "Educação e extensão rural",
  },
  "cooperativism": {
    es: "Cooperativismo y economía social",
    en: "Cooperativism & social economy",
    fr: "Coopérativisme et économie sociale",
    pt: "Cooperativismo e economia social",
  },
  "crop-diversification": {
    es: "Diversificación de cultivos",
    en: "Crop diversification",
    fr: "Diversification des cultures",
    pt: "Diversificação de culturas",
  },
  "agroecology": {
    es: "Agroecología",
    en: "Agroecology",
    fr: "Agroécologie",
    pt: "Agroecologia",
  },
};

export const CURATED_TAG_SLUGS = Object.keys(TAG_LABELS);

export const tagLabel = (slug: string, lang: Lang): string =>
  TAG_LABELS[slug]?.[lang] ?? TAG_LABELS[slug]?.es ?? slug;