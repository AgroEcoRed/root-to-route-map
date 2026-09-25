import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Play, Pause, Square, FileUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { extractPdfText } from "@/lib/pdfText";

/** Evento global para enviar texto al lector desde cualquier ficha. */
export const TTS_EVENT = "agroeco-tts-load";
export const sendToReader = (text: string, lang?: LangKey) =>
  window.dispatchEvent(new CustomEvent(TTS_EVENT, { detail: { text, lang } }));

export type LangKey = "en-US" | "es-AR" | "pt-BR" | "fr-FR";

const LANGS: { key: LangKey; label: string; prefer: RegExp; fallback: RegExp }[] = [
  { key: "en-US", label: "Inglés (EE.UU.)", prefer: /samantha|ava|allison|google us english/i, fallback: /^en[-_]US/i },
  { key: "es-AR", label: "Castellano (Argentina)", prefer: /es[-_]AR|diego|isabela|tomás|tomas/i, fallback: /^es[-_](419|US|MX|CO|CL|UY)|^es/i },
  { key: "pt-BR", label: "Portugués (Brasil)", prefer: /luciana|google português do brasil|francisca/i, fallback: /^pt[-_]BR|^pt/i },
  { key: "fr-FR", label: "Francés (Francia)", prefer: /thomas|amélie|amelie|google français|denise/i, fallback: /^fr[-_]FR|^fr/i },
];

const matchesLang = (v: SpeechSynthesisVoice, key: LangKey) => {
  const l = LANGS.find((x) => x.key === key)!;
  const base = key.slice(0, 2);
  return v.lang.toLowerCase().startsWith(base) || l.prefer.test(v.name);
};

const pickVoice = (voices: SpeechSynthesisVoice[], key: LangKey) => {
  const l = LANGS.find((x) => x.key === key)!;
  const exact = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === key.toLowerCase());
  return (
    exact.find((v) => l.prefer.test(v.name)) ||
    exact[0] ||
    voices.find((v) => l.fallback.test(v.lang.replace("_", "-"))) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(key.slice(0, 2)))
  );
};

const splitSentences = (text: string) =>
  (text.replace(/\s+/g, " ").match(/[^.!?¡¿;:\n]{1,260}[.!?;:]*\s*/g) || []).map((s) => s.trim()).filter(Boolean);

const TextReader = () => {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [lang, setLang] = useState<LangKey>("es-AR");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [current, setCurrent] = useState(-1);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const sentences = useMemo(() => splitSentences(text), [text]);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const langVoices = useMemo(() => voices.filter((v) => matchesLang(v, lang)), [voices, lang]);

  useEffect(() => {
    setVoiceName(pickVoice(voices, lang)?.name ?? "");
  }, [voices, lang]);

  const stop = () => {
    runId.current++;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrent(-1);
  };

  const speakFrom = (start: number) => {
    if (!sentences.length) return toast.info("Pegá o cargá un texto primero");
    window.speechSynthesis.cancel();
    const id = ++runId.current;
    const voice = voices.find((v) => v.name === voiceName);
    const next = (i: number) => {
      if (id !== runId.current) return;
      if (i >= sentences.length) { setStatus("idle"); setCurrent(-1); return; }
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.lang = voice?.lang || lang;
      if (voice) u.voice = voice;
      u.rate = rate;
      u.onstart = () => id === runId.current && setCurrent(i);
      u.onend = () => next(i + 1);
      u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") next(i + 1); };
      window.speechSynthesis.speak(u);
    };
    setStatus("playing");
    next(start);
  };

  const togglePlay = () => {
    if (status === "playing") { window.speechSynthesis.pause(); setStatus("paused"); }
    else if (status === "paused") { window.speechSynthesis.resume(); setStatus("playing"); }
    else speakFrom(0);
  };

  useEffect(() => {
    const onLoad = (e: Event) => {
      const { text: t, lang: l } = (e as CustomEvent).detail || {};
      stop();
      setText(t || "");
      if (l) setLang(l);
      setOpen(true);
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    window.addEventListener(TTS_EVENT, onLoad);
    return () => window.removeEventListener(TTS_EVENT, onLoad);
  }, []);

  const onPdf = async (f: File) => {
    setLoadingPdf(true);
    try {
      const t = await extractPdfText(f);
      if (!t) toast.warning("El PDF no tiene texto seleccionable (puede ser una imagen escaneada)");
      stop();
      setText(t);
    } catch {
      toast.error("No se pudo leer el PDF");
    } finally {
      setLoadingPdf(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!supported) return null;

  return (
    <div ref={panelRef} className="border border-border rounded-xl bg-card mb-6 scroll-mt-24">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-4 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg">
          <Headphones className="h-5 w-5 text-primary" /> Lector en voz alta
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {status !== "idle" && <span className="text-primary">{status === "playing" ? "Leyendo…" : "En pausa"}</span>}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Pegá un texto, cargá un PDF o tocá «Escuchar» en cualquier ficha. Usa las voces instaladas en tu dispositivo
            (por ejemplo Samantha en Mac/iPhone); si no aparece una voz del idioma, podés instalarla desde la configuración de tu equipo.
          </p>

          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => { stop(); setLang(l.key); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  lang === l.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={voiceName}
              onChange={(e) => { stop(); setVoiceName(e.target.value); }}
              className="text-sm rounded-lg border border-border bg-background px-2 py-1.5 max-w-full"
            >
              {langVoices.length === 0 && <option value="">Sin voces de este idioma en tu dispositivo</option>}
              {langVoices.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              Velocidad
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              <span className="w-8">{rate.toFixed(1)}×</span>
            </label>
          </div>

          {status === "idle" ? (
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Pegá acá el texto que querés escuchar…" />
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-3 text-sm leading-relaxed">
              {sentences.map((s, i) => (
                <span
                  key={i}
                  onClick={() => speakFrom(i)}
                  ref={(el) => { if (i === current && el) el.scrollIntoView({ block: "nearest" }); }}
                  className={`cursor-pointer rounded px-0.5 ${i === current ? "bg-primary/20 text-foreground" : "text-muted-foreground"}`}
                >
                  {s}{" "}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={togglePlay} size="sm">
              {status === "playing" ? <><Pause className="h-4 w-4 mr-1" /> Pausar</> : <><Play className="h-4 w-4 mr-1" /> {status === "paused" ? "Seguir" : "Leer"}</>}
            </Button>
            <Button onClick={stop} size="sm" variant="outline" disabled={status === "idle"}>
              <Square className="h-4 w-4 mr-1" /> Detener
            </Button>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPdf(f); }} />
            <Button onClick={() => fileRef.current?.click()} size="sm" variant="ghost" disabled={loadingPdf}>
              {loadingPdf ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileUp className="h-4 w-4 mr-1" />} Cargar PDF
            </Button>
            {status !== "idle" && <span className="text-xs text-muted-foreground self-center">Tocá una frase para saltar a ella.</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextReader;
