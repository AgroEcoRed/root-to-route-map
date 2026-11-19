import { describe, expect, it } from "vitest";
import {
  buildPassifloraOrderText,
  getPassifloraProductUrl,
  getPassifloraTotals,
  passifloraProducts,
} from "@/data/passifloraOrder";

describe("Pedido de ejemplo Red Passiflora", () => {
  it("suma los ocho productos y el cajón retornable en el subtotal de $36.100", () => {
    const totals = getPassifloraTotals();
    expect(totals.products).toBe(33600);
    expect(totals.container).toBe(2500);
    expect(totals.subtotal).toBe(36100);
  });

  it("resta la nota de crédito R7 de $4.000 y llega al total final de $32.100", () => {
    const totals = getPassifloraTotals();
    expect(totals.credit).toBe(4000);
    expect(totals.total).toBe(32100);
  });

  it("genera enlaces de producto limpios, en minúscula y sin acentos", () => {
    expect(getPassifloraProductUrl(passifloraProducts[0])).toBe(
      "https://agroeco.red/productos/manzana-cripps-pink-pluma-azul-neuquen-organico",
    );
    for (const product of passifloraProducts) {
      expect(product.slug).toBe(product.slug.toLowerCase());
      expect(product.slug).not.toMatch(/[áéíóúñ_]/i);
    }
  });

  it("incluye los importes y enlaces en el texto listo para compartir", () => {
    const text = buildPassifloraOrderText();
    expect(text).toContain("💰 SUBTOTAL: $36.100");
    expect(text).toContain("♻️ Nota de crédito R7: -$4.000");
    expect(text).toContain("💰 TOTAL FINAL: $32.100");
    expect(text.match(/LINK: https:\/\/agroeco\.red\/productos\//g)).toHaveLength(8);
  });
});
