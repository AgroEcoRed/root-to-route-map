import { Link, useParams } from "react-router";
import { ArrowLeft, MapPin, ShoppingBasket, Sprout } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PASSIFLORA_ORDER_PATH,
  findPassifloraProduct,
  formatPassifloraPrice,
  passifloraOrder,
} from "@/data/passifloraOrder";

const PassifloraProductPage = () => {
  const { slug } = useParams();
  const product = findPassifloraProduct(slug);

  if (!product) return <NotFound />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <header className="bg-gradient-hero text-primary-foreground py-10">
          <div className="container max-w-5xl">
            <Link to={PASSIFLORA_ORDER_PATH} className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />Volver al pedido #{passifloraOrder.number}
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">{passifloraOrder.network} · {passifloraOrder.round}</p>
            <h1 className="font-display text-4xl sm:text-5xl mt-3">{product.name}</h1>
          </div>
        </header>

        <div className="container max-w-5xl py-8 sm:py-12">
          <Card className="overflow-hidden shadow-card">
            <div className="grid md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="min-h-52 md:min-h-full bg-muted/60 flex items-center justify-center p-8">
                <span className="text-8xl" role="img" aria-label={product.name}>{product.image}</span>
              </div>
              <div className="p-6 sm:p-8">
                <Badge variant="outline" className="border-primary/25 text-primary">
                  <Sprout className="h-3.5 w-3.5 mr-1" />{product.certification}
                </Badge>
                <h2 className="font-display text-2xl mt-4">{product.producer}</h2>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
                  <MapPin className="h-4 w-4" />{product.location}
                </p>
                <div className="flex items-end gap-3 mt-8 pb-6 border-b border-border">
                  <p className="font-display text-4xl text-primary">{formatPassifloraPrice(product.price)}</p>
                  <p className="text-muted-foreground pb-1">/ {product.quantity}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-5">
                  Precio y cantidad registrados en el pedido #{passifloraOrder.number}. La disponibilidad y la entrega se confirman con la Red Passiflora.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button asChild className="gap-2 bg-gradient-hero text-primary-foreground">
                    <Link to={PASSIFLORA_ORDER_PATH}>
                      <ShoppingBasket className="h-4 w-4" />Ver pedido completo
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/mercado">Explorar el mercado</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PassifloraProductPage;
