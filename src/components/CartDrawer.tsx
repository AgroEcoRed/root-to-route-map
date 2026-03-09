import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Minus, Plus, Trash2, ShoppingBasket, Send, MapPin, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const CartDrawer = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearProducer } = useCart();
  const { t } = useLanguage();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
      const group = map.get(item.producer) || [];
      group.push(item);
      map.set(item.producer, group);
    });
    return Array.from(map.entries());
  }, [items]);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleOrder = (producer: string) => {
    clearProducer(producer);
    toast({
      title: t("cart.order_sent"),
      description: `${t("cart.order_to")} ${producer}`,
    });
  };

  const handleSendAll = () => {
    const producerNames = grouped.map(([p]) => p).join(", ");
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    items.length > 0 && toast({
      title: t("cart.order_sent"),
      description: `${totalItems} ${t("market.products_available")} → ${producerNames}`,
    });
    // Clear all
    grouped.forEach(([producer]) => clearProducer(producer));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBasket className="h-5 w-5 text-primary" />
            {t("cart.title")}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <ShoppingBasket className="h-12 w-12 opacity-30" />
            <p className="text-sm">{t("cart.empty")}</p>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="mt-2">
              <ShoppingCart className="h-4 w-4 mr-1" /> {t("cart.keep_shopping")}
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 mt-4">
            <AnimatePresence mode="popLayout">
              {grouped.map(([producer, producerItems]) => {
                const subtotal = producerItems.reduce((s, i) => s + i.price * i.quantity, 0);
                const location = producerItems[0]?.location;
                return (
                  <motion.div
                    key={producer}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border border-border rounded-xl overflow-hidden bg-card"
                  >
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-display text-sm text-card-foreground">{producer}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {location}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        ${subtotal.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {producerItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                          <span className="text-2xl flex-shrink-0">{item.image}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.priceDisplay}/{item.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="h-7 w-7 rounded-md flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t("cart.total")}</span>
              <span className="font-display text-lg text-foreground">
                ${totalPrice.toLocaleString("es-AR")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t("cart.grouped_note")}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsOpen(false)}>
                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                {t("cart.keep_shopping")}
              </Button>
              <Button className="flex-1 bg-gradient-hero text-primary-foreground gap-2 text-xs" onClick={handleSendAll}>
                <Send className="h-3.5 w-3.5" />
                {t("cart.send_all")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;