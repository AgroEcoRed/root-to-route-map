import { describe, expect, it } from "vitest";
import {
  buildPassifloraOrderText,
  getPassifloraProductUrl,
  getPassifloraTotals,
  type PassifloraOrder,
} from "@/data/passifloraOrder";

const prices = [5600, 3200, 8500, 8500, 2100, 2100, 2100, 1500];
const order: PassifloraOrder = {
  network: "Red de prueba",
  round: "Ronda 11",
  number: 23,
  customerName: "Persona de prueba",
  customerPhone: "0000-000000",
  container: { name: "Cajón de madera retornable", price: 2500 },
  credit: { note: "Nota de crédito R7", amount: 4000 },
  products: prices.map((price, index) => ({
    slug: `producto-${index + 1}`,
    name: `Producto ${index + 1}`,
    producer: "Productora de prueba",
    location: "Ubicación de prueba",
    certification: "Agroecológico",
    quantity: "1 unidad",
    price,
    image: "🌱",
  })),
};

describe("Pedido privado Red Passiflora", () => {
  it("suma los ocho productos y el cajón retornable en el subtotal de $36.100", () => {
    const totals = getPassifloraTotals(order);
    expect(totals.products).toBe(33600);
    expect(totals.container).toBe(2500);
    expect(totals.subtotal).toBe(36100);
  });

  it("resta la nota de crédito R7 de $4.000 y llega al total final de $32.100", () => {
    const totals = getPassifloraTotals(order);
    expect(totals.credit).toBe(4000);
    expect(totals.total).toBe(32100);
  });

  it("mantiene los enlaces de producto dentro del acceso privado del pedido", () => {
    expect(getPassifloraProductUrl(order.products[0])).toBe(
      "https://agroeco.red/pedidos/red-passiflora/ronda-11/23?producto=producto-1",
    );
  });

  it("incluye los importes y los ocho enlaces en el texto listo para compartir", () => {
    const text = buildPassifloraOrderText(order);
    expect(text).toContain("💰 SUBTOTAL: $36.100");
    expect(text).toContain("♻️ Nota de crédito R7: -$4.000");
    expect(text).toContain("💰 TOTAL FINAL: $32.100");
    expect(text.match(/LINK: https:\/\/agroeco\.red\/pedidos\/red-passiflora\/ronda-11\/23\?producto=/g)).toHaveLength(8);
  });
});
