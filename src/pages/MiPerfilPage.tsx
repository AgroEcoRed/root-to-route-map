import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Image as ImageIcon, Video, FileText, Copy, ScanText } from "lucide-react";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SECONDS = 30;

interface MediaItem {
  id: string;
  storage_path: string;
  media_type: "image" | "video";
  caption: string | null;
  signedUrl?: string;
}

const MiPerfilPage = () => {
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const ocrFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadMedia();
  }, [user]);

  const loadMedia = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("producer_media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("No se pudieron cargar tus medios"); return; }
    const list = (data || []) as MediaItem[];
    // sign URLs
    const paths = list.map(i => i.storage_path);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("producer-media").createSignedUrls(paths, 60 * 60 * 24 * 7);
      list.forEach((it, idx) => { it.signedUrl = signed?.[idx]?.signedUrl; });
    }
    setItems(list);
  };

  const getVideoDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { resolve(v.duration); URL.revokeObjectURL(v.src); };
      v.onerror = () => reject(new Error("No se pudo leer el video"));
      v.src = URL.createObjectURL(file);
    });

  const handleFile = async (file: File) => {
    if (!user) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { toast.error("Solo se permiten imágenes o videos"); return; }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      toast.error("La imagen supera los 10 MB"); return;
    }
    if (isVideo) {
      if (file.size > MAX_VIDEO_BYTES) { toast.error("El video supera los 25 MB"); return; }
      try {
        const dur = await getVideoDuration(file);
        if (dur > MAX_VIDEO_SECONDS + 0.5) {
          toast.error(`El video supera los ${MAX_VIDEO_SECONDS} segundos`); return;
        }
      } catch { /* allow if can't read */ }
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("producer-media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("producer_media").insert({
        user_id: user.id,
        storage_path: path,
        media_url: path,
        media_type: isImage ? "image" : "video",
        caption: caption || null,
        size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      toast.success("Archivo subido");
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      loadMedia();
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (item: MediaItem) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    await supabase.storage.from("producer-media").remove([item.storage_path]);
    await supabase.from("producer_media").delete().eq("id", item.id);
    toast.success("Eliminado");
    loadMedia();
  };

  const runOCR = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Sube una imagen"); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error("La imagen supera los 10 MB"); return; }
    setOcrLoading(true);
    setOcrText("");
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = reader.result as string;
          resolve(r.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("ocr-extract", {
        body: { imageBase64: b64, mimeType: file.type, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOcrText(data?.text || "");
      toast.success("Texto extraído");
    } catch (e: any) {
      toast.error(e.message || "No se pudo procesar la imagen");
    } finally {
      setOcrLoading(false);
      if (ocrFileRef.current) ocrFileRef.current.value = "";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/ingresar" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container max-w-5xl">
          <h1 className="font-display text-3xl mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground mb-8">Compartí fotos y videos de tu producción y digitalizá documentos manuscritos.</p>

          {/* Gallery uploader */}
          <section className="rounded-2xl border border-border bg-card p-6 mb-8">
            <h2 className="font-display text-xl mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Galería</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Fotos hasta 10 MB · Videos hasta 30 segundos y 25 MB.
            </p>
            <div className="space-y-3 mb-4">
              <Textarea
                placeholder="Descripción opcional (ej: cosecha de tomates de la semana)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
              <div className="flex gap-3 items-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  className="hidden"
                />
                <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Subir foto o video
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aún no has subido archivos.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((it) => (
                  <div key={it.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                    {it.media_type === "image" ? (
                      <img src={it.signedUrl} alt={it.caption || ""} className="w-full h-full object-cover" />
                    ) : (
                      <video src={it.signedUrl} controls className="w-full h-full object-cover" />
                    )}
                    {it.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1.5 line-clamp-2">{it.caption}</div>
                    )}
                    <button
                      onClick={() => deleteItem(it)}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-destructive text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-1">
                      {it.media_type === "image" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* OCR tool */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl mb-2 flex items-center gap-2"><ScanText className="h-5 w-5 text-primary" /> Digitalizar documentos</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Subí una foto de un documento manuscrito o impreso y la IA transcribirá el texto.
            </p>
            <div className="flex gap-3 mb-4">
              <input
                ref={ocrFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) runOCR(f); }}
                className="hidden"
              />
              <Button onClick={() => ocrFileRef.current?.click()} disabled={ocrLoading} variant="secondary">
                {ocrLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Elegir imagen
              </Button>
              {ocrText && (
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ocrText); toast.success("Copiado"); }}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              )}
            </div>
            {ocrLoading && <p className="text-sm text-muted-foreground">Procesando imagen…</p>}
            {ocrText && (
              <Textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MiPerfilPage;