import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Check,
  Copy,
  ExternalLink,
  Home,
  KeyRound,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  ReceiptText,
  Recycle,
  ShieldCheck,
  ShoppingBasket,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  PASSIFLORA_ORDER_PATH,
  PASSIFLORA_ORDER_SLUG,
  buildPassifloraOrderText,
  formatPassifloraPrice,
  getPassifloraProductPath,
  getPassifloraProductUrl,
  getPassifloraTotals,
  type PassifloraOrder,
} from "@/data/passifloraOrder";

const ACCESS_STORAGE_KEY = "passiflora-order-23-access";

const PassifloraOrderPage = () => {
  const [order, setOrder] = useState<PassifloraOrder | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"link" | "order" | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const orderUrl = `${window.location.origin}${PASSIFLORA_ORDER_PATH}`;
  const totals = order ? getPassifloraTotals(order) : null;
  const selectedProduct = order?.products.find(
    (product) => product.slug === searchParams.get("producto"),
  );
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hola Emilio, te comparto el acceso privado al pedido #23 de Red Passiflora: ${orderUrl}. La clave la recibís por separado.`,
  )}`;

  const unlock = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{
        order: PassifloraOrder;
      }>("private-order", {
        body: { orderSlug: PASSIFLORA_ORDER_SLUG, accessKey: key },
      });
      if (invokeError || !data?.order || !Array.isArray(data.order.products)) {
        throw new Error("Access unavailable");
      }
      window.sessionStorage.setItem(ACCESS_STORAGE_KEY, key);
      setOrder(data.order);
      setAccessKey("");
    } catch {
      window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      setOrder(null);
      setError("La clave no es correcta o el acceso dejó de estar disponible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (savedKey) void unlock(savedKey);
  }, [unlock]);

  const copyText = async (kind: "link" | "order") => {
    try {
      const text = kind === "link"
        ? orderUrl
        : order
          ? buildPassifloraOrderText(order, window.location.origin)
          : "";
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === "link" ? "Enlace copiado, sin incluir la clave" : "Pedido completo copiado");
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      toast.error("No se pudo copiar. Intentá nuevamente.");
    }
  };

  const lockOrder = () => {
    window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
    setOrder(null);
    setCopied(null);
    setSearchParams({}, { replace: true });
    toast.success("Pedido bloqueado en este dispositivo");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <header className="bg-gradient-hero text-primary-foreground py-10 sm:py-12">
          <div className="container max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <Badge className="mb-4 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
                Pedido privado · acceso con clave
              </Badge>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">Alimentos agroecológicos</p>
              <h1 className="font-display text-4xl sm:text-5xl mt-3">Red Passiflora</h1>
              <p className="text-primary-foreground/75 mt-2">Ronda 11 · Pedido para Emilio</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-primary-foreground/70">Pedido</p>
              <p className="font-display text-4xl">#23</p>
            </div>
          </div>
        </header>

        {!order || !totals ? (
          <div className="container max-w-xl py-10 sm:py-16">
            <Card className="p-6 sm:p-8 shadow-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="font-display text-3xl">Este pedido es privado</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Ingresá la clave que recibiste para ver los datos, los productos y el total. No necesitás crear una cuenta.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void unlock(accessKey);
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="order-access-key">Clave de acceso</Label>
                  <Input
                    id="order-access-key"
                    type="password"
                    value={accessKey}
                    onChange={(event) => setAccessKey(event.target.value)}
                    placeholder="Pegá acá la clave"
                    autoComplete="current-password"
                    minLength={20}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gap-2 bg-gradient-hero text-primary-foreground" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {loading ? "Verificando clave…" : "Abrir pedido privado"}
                </Button>
              </form>
              <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-xs text-muted-foreground flex-1">Por seguridad, el enlace nunca incluye la clave.</p>
                <Button variant="outline" size="sm" onClick={() => copyText("link")} className="gap-2">
                  {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copiar enlace
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="container max-w-6xl py-8 sm:py-10">
            <Card className="mb-6 border-primary/20 bg-primary/5 p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />Acceso privado para Emilio
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Compartí el enlace y la clave por mensajes separados.</p>
                  <p className="text-sm text-primary break-all mt-2">{orderUrl}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => copyText("link")} className="gap-2">
                    {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copiar enlace
                  </Button>
                  <Button asChild className="gap-2 bg-gradient-hero text-primary-foreground">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />Compartir por WhatsApp
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={lockOrder} className="gap-2">
                    <LockKeyhole className="h-4 w-4" />Bloquear
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                <Card className="p-5 sm:p-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex items-start gap-3">
                      <UserRound className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre</p>
                        <p className="font-medium mt-1">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
                        <a href={`tel:${order.customerPhone}`} className="font-medium mt-1 inline-block hover:text-primary">
                          {order.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-border flex items-start gap-3">
                    <Home className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Envase</p>
                      <p className="mt-1">Adquiero {order.container.name.toLowerCase()}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">{formatPassifloraPrice(totals.container)}</p>
                  </div>
                </Card>

                <section aria-labelledby="productos-pedido">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBasket className="h-5 w-5 text-primary" />
                    <h2 id="productos-pedido" className="font-display text-2xl">Productos del pedido</h2>
                    <Badge variant="secondary">{order.products.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {order.products.map((product) => (
                      <Card key={product.slug} className="p-4 sm:p-5 lift-on-hover">
                        <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-3xl shrink-0" aria-hidden="true">{product.image}</span>
                            <div className="min-w-0">
                              <Link to={getPassifloraProductPath(product)} className="font-display text-xl hover:text-primary inline-block">
                                {product.name}
                              </Link>
                              <p className="text-sm font-medium mt-1">{product.producer}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />{product.location}
                              </p>
                              <Badge variant="outline" className="mt-2 border-primary/25 text-primary">{product.certification}</Badge>
                            </div>
                          </div>
                          <div className="pl-12 sm:pl-0 sm:text-right">
                            <p className="text-sm text-muted-foreground">{product.quantity}</p>
                            <p className="font-display text-2xl mt-1">{formatPassifloraPrice(product.price)}</p>
                          </div>
                        </div>
                        <Link
                          to={getPassifloraProductPath(product)}
                          className="mt-4 pt-3 border-t border-border flex items-start gap-2 text-xs text-primary break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{getPassifloraProductUrl(product, window.location.origin).replace(/^https?:\/\//, "")}</span>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="lg:sticky lg:top-24 space-y-4">
                <Card className="p-5 sm:p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-5">
                    <ReceiptText className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-2xl">Resumen</h2>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Productos</dt>
                      <dd>{formatPassifloraPrice(totals.products)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Cajón retornable</dt>
                      <dd>{formatPassifloraPrice(totals.container)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 pt-3 border-t border-border font-medium">
                      <dt>Subtotal</dt>
                      <dd>{formatPassifloraPrice(totals.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-primary">
                      <dt className="flex items-center gap-1.5"><Recycle className="h-4 w-4" />{order.credit.note}</dt>
                      <dd>-{formatPassifloraPrice(totals.credit)}</dd>
                    </div>
                    <div className="flex justify-between items-end gap-4 pt-4 border-t border-border">
                      <dt className="font-medium">Total final</dt>
                      <dd className="font-display text-3xl text-primary">{formatPassifloraPrice(totals.total)}</dd>
                    </div>
                  </dl>
                  <div className="grid gap-2 mt-6">
                    <Button onClick={() => copyText("order")} className="w-full gap-2 bg-gradient-hero text-primary-foreground">
                      {copied === "order" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === "order" ? "Pedido copiado" : "Copiar pedido completo"}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="w-full gap-2">
                      <Printer className="h-4 w-4" />Imprimir o guardar PDF
                    </Button>
                  </div>
                </Card>
                <p className="text-xs text-muted-foreground leading-relaxed px-1">
                  Esta vista reproduce el pedido de ejemplo. No confirma stock, pago ni entrega; esos detalles se coordinan con la Red Passiflora.
                </p>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) setSearchParams({}, { replace: true });
        }}
      >
        {selectedProduct && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="text-6xl mb-3" aria-hidden="true">{selectedProduct.image}</div>
              <DialogTitle className="font-display text-3xl">{selectedProduct.name}</DialogTitle>
              <DialogDescription>{selectedProduct.producer} · {selectedProduct.location}</DialogDescription>
            </DialogHeader>
            <Badge variant="outline" className="w-fit border-primary/25 text-primary">{selectedProduct.certification}</Badge>
            <div className="flex items-end gap-3 mt-2">
              <p className="font-display text-4xl text-primary">{formatPassifloraPrice(selectedProduct.price)}</p>
              <p className="text-muted-foreground pb-1">/ {selectedProduct.quantity}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Precio y cantidad registrados en este pedido. La disponibilidad y la entrega se confirman con la Red Passiflora.
            </p>
          </DialogContent>
        )}
      </Dialog>
      <Footer />
    </div>
  );
};

export default PassifloraOrderPage;
