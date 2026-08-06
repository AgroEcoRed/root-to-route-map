// Normalización de títulos bibliográficos según convenciones por idioma.
// ES/FR/PT: estilo oración (solo la primera palabra en mayúscula).
// EN: title case (sustantivos y palabras significativas en mayúscula).

const EN_HINTS = ["the","and","of","for","with","from","this","that","are","was","between","towards","through","food","farming","soil","review","study","case"];
const ES_HINTS = ["de","la","el","los","las","en","y","del","para","una","como","con","por","agricultura","alimentaria","desde","entre","estudio"];
const FR_HINTS = ["le","la","les","des","du","une","dans","pour","avec","sur","et","aux","agriculture","alimentaire"];
const PT_HINTS = ["de","da","do","dos","das","em","para","uma","com","sobre","e","não","agricultura","alimentar"];

export type TitleLang = "en" | "es" | "fr" | "pt";

export const detectTitleLang = (text: string): TitleLang => {
  const words = text.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const score = (hints: string[]) => words.filter((w) => hints.includes(w)).length;
  const scores: [TitleLang, number][] = [
    ["en", score(EN_HINTS)],
    ["es", score(ES_HINTS)],
    ["fr", score(FR_HINTS)],
    ["pt", score(PT_HINTS)],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] === 0 ? "es" : scores[0][0];
};

// Palabras menores que quedan en minúscula dentro de un título en inglés.
const EN_MINOR = new Set([
  "a","an","the","and","but","or","nor","for","so","yet","as","at","by","for","in","of","off","on","per","to","up","via","from","into","over","with","without","between","under","upon","than","that","vs","versus",
]);

const isRoman = (w: string) => /^[IVXLCDM]+$/.test(w);
const hasInternalCaps = (w: string) => /[A-ZÁÉÍÓÚÑÜ]/.test(w.slice(1));
const isAcronym = (w: string) => w.length > 1 && w === w.toUpperCase() && /^[A-Z0-9\-&.]+$/.test(w) && w.length <= 6;

const capFirst = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

const normalizeWord = (raw: string, keepAcronyms: boolean) => {
  if (!raw) return raw;
  const core = raw.replace(/[^\p{L}\p{N}]/gu, "");
  if (keepAcronyms && (isRoman(core) || isAcronym(core))) return raw;
  return raw.toLowerCase();
};

const titleCaseEn = (text: string, preserveCaps: boolean) => {
  const parts = text.split(/(\s+)/);
  let firstWordSeen = false;
  return parts
    .map((p) => {
      if (/^\s+$/.test(p)) return p;
      const core = p.replace(/[^\p{L}\p{N}]/gu, "");
      if (preserveCaps && (isRoman(core) || isAcronym(core))) return p;
      const lower = p.toLowerCase();
      const bare = lower.replace(/[^\p{L}\p{N}]/gu, "");
      const isFirst = !firstWordSeen;
      firstWordSeen = true;
      if (!isFirst && EN_MINOR.has(bare)) return lower;
      // capitalizar la primera letra alfabética (respeta comillas o paréntesis iniciales)
      return lower.replace(/\p{L}/u, (c) => c.toUpperCase());
    })
    .join("");
};

const sentenceCase = (text: string, preserveCaps: boolean) => {
  const parts = text.split(/(\s+)/);
  let firstAlpha = true;
  return parts
    .map((p) => {
      if (/^\s+$/.test(p)) return p;
      const out = normalizeWord(p, preserveCaps);
      if (firstAlpha && /\p{L}/u.test(out)) {
        firstAlpha = false;
        return out.replace(/\p{L}/u, (c) => c.toUpperCase());
      }
      return out;
    })
    .join("");
};


// Nombres propios frecuentes en bibliografía agroecológica: se recapitalizan
// aunque el título original venga en mayúsculas sostenidas.
const PROPER_NOUNS = [
  "Argentina","Brasil","Brazil","Chile","Uruguay","Paraguay","Bolivia","Perú","Peru","Colombia","Ecuador","Venezuela","México","Mexico","Cuba","España","Spain","Francia","France","Portugal","Europa","Europe","América Latina","Latin America","Latinoamérica","Buenos Aires","La Plata","Rosario","Córdoba","Santa Fe","Misiones","Mendoza","Patagonia","Pampa","Pampeana","Cono Sur","Andes","Amazonía","Amazonia","Caribe","África","Africa","Asia","Estados Unidos","Reino Unido","Italia","Italy","Alemania","Cataluña","Andalucía","Galicia",
  "INTA","INTI","CONICET","UNSAM","UBA","FAO","ONU","UNESCO","CEPAL","IPES","IPBES","IPCC","MERCOSUR","UTT","SPG","PGS","AKIS","EMBRAPA","Embrapa","CSIC","IFOAM","MAELA","CLACSO","OMS","WHO","UE","EU","ODS","SDG",
];

const restoreProperNouns = (text: string) => {
  let out = text;
  for (const noun of PROPER_NOUNS) {
    const re = new RegExp(`(^|[^\\p{L}])${noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}])`, "giu");
    out = out.replace(re, (m, pre) => `${pre}${noun}`);
  }
  return out;
};

const isMostlyUpper = (text: string) => {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  return upper / letters.length > 0.7;
};

/**
 * Uniformiza un título bibliográfico.
 * Sólo reescribe cuando el original viene en mayúsculas sostenidas (o `force`),
 * para no dañar títulos ya bien escritos con nombres propios.
 */
export const normalizeTitle = (raw: string, force = false): string => {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return text;
  if (!force && !isMostlyUpper(text)) return text;
  const lang = detectTitleLang(text);
  // Si el título entero viene en mayúsculas, no hay siglas reales que preservar.
  const preserveCaps = !isMostlyUpper(text);
  const segments = text.split(/([.:;?!]\s+)/);
  const result = segments
    .map((seg, i) => {
      if (i % 2 === 1) return seg; // separador
      if (!seg.trim()) return seg;
      return lang === "en" ? titleCaseEn(seg, preserveCaps) : sentenceCase(seg, preserveCaps);
    })
    .join("")
    .trim();
  return restoreProperNouns(result);
};

/** Normaliza nombres propios de personas en mayúsculas sostenidas. */
export const normalizePersonName = (raw: string): string => {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || !isMostlyUpper(text)) return text;
  return text
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((p) => (/^\s+$|^-$/.test(p) ? p : capFirst(p)))
    .join("");
};
