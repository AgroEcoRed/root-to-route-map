import { useState } from "react";
import { Link } from "react-router";
import {
  Check,
  Copy,
  ExternalLink,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  ReceiptText,
  Recycle,
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
  PASSIFLORA_ORDER_PATH,
  buildPassifloraOrderText,
  formatPassifloraPrice,
  getPassifloraProductPath,
  getPassifloraProductUrl,
  passifloraOrder,
  passifloraProducts,
  getPassifloraTotals,
} from "@/data/passifloraOrder";

const PassifloraOrderPage = () => {
  const [copied, setCopied] = useState<"link" | "order" | null>(null);
  const totals = getPassifloraTotals();
  const orderUrl = `${window.location.origin}${PASSIFLORA_ORDER_PATH}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hola Emilio, te comparto el pedido #${passifloraOrder.number} de ${passifloraOrder.network}: ${orderUrl}`,
  )}`;

  const copyText = async (kind: "link" | "order") => {
    try {
      await navigator.clipboard.writeText(
        kind === "link" ? orderUrl : buildPassifloraOrderText(window.location.origin),
      );
      setCopied(kind);
      toast.success(kind === "link" ? "Enlace copiado" : "Pedido completo copiado");
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      toast.error("No se pudo copiar. Seleccioná el texto e intentá nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <header className="bg-gradient-hero text-primary-foreground py-10 sm:py-12">
          <div className="container max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <Badge className="mb-4 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/10">
                Vista de ejemplo · acceso con enlace
              </Badge>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">Alimentos agroecológicos</p>
              <h1 className="font-display text-4xl sm:text-5xl mt-3">{passifloraOrder.network}</h1>
              <p className="text-primary-foreground/75 mt-2">{passifloraOrder.round} · Pedido compartible</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-primary-foreground/70">Pedido</p>
              <p className="font-display text-4xl">#{passifloraOrder.number}</p>
            </div>
          </div>
        </header>

        <div className="container max-w-6xl py-8 sm:py-10">
          <Card className="mb-6 border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg">Acceso para Emilio</h2>
                <p className="text-sm text-muted-foreground mt-1">No necesita registrarse para ver este pedido.</p>
                <p className="text-sm text-primary break-all mt-2">{orderUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyText("link")} className="gap-2">
                  {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "link" ? "Copiado" : "Copiar enlace"}
                </Button>
                <Button asChild className="gap-2 bg-gradient-hero text-primary-foreground">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Compartir por WhatsApp
                  </a>
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
                      <p className="font-medium mt-1">{passifloraOrder.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
                      <a href={`tel:${passifloraOrder.customerPhone}`} className="font-medium mt-1 inline-block hover:text-primary">
                        {passifloraOrder.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-border flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Envase</p>
                    <p className="mt-1">Adquiero {passifloraOrder.container.name.toLowerCase()}</p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">{formatPassifloraPrice(totals.container)}</p>
                </div>
              </Card>

              <section aria-labelledby="productos-pedido">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBasket className="h-5 w-5 text-primary" />
                  <h2 id="productos-pedido" className="font-display text-2xl">Productos del pedido</h2>
                  <Badge variant="secondary">{passifloraProducts.length}</Badge>
                </div>
                <div className="space-y-3">
                  {passifloraProducts.map((product) => (
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
                    <dt className="flex items-center gap-1.5"><Recycle className="h-4 w-4" />{passifloraOrder.credit.note}</dt>
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
      </main>
      <Footer />
    </div>
  );
};

export default PassifloraOrderPage;
