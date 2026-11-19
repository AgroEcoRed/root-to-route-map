export interface PassifloraProduct {
  slug: string;
  name: string;
  producer: string;
  location: string;
  certification: "Orgánico" | "Agroecológico";
  quantity: string;
  price: number;
  image: string;
}

export interface PassifloraOrder {
  network: string;
  round: string;
  number: number;
  customerName: string;
  customerPhone: string;
  container: {
    name: string;
    price: number;
  };
  credit: {
    note: string;
    amount: number;
  };
  products: PassifloraProduct[];
}

export const PASSIFLORA_ORDER_PATH = "/pedidos/red-passiflora/ronda-11/23";
export const PASSIFLORA_ORDER_SLUG = "red-passiflora-ronda-11-23";

export const formatPassifloraPrice = (value: number) =>
  `$${value.toLocaleString("es-AR")}`;

export const getPassifloraProductPath = (product: PassifloraProduct) =>
  `${PASSIFLORA_ORDER_PATH}?producto=${encodeURIComponent(product.slug)}`;

export const getPassifloraProductUrl = (
  product: PassifloraProduct,
  origin = "https://agroeco.red",
) => `${origin.replace(/\/$/, "")}${getPassifloraProductPath(product)}`;

export const getPassifloraTotals = (order: PassifloraOrder) => {
  const products = order.products.reduce((sum, product) => sum + product.price, 0);
  const subtotal = products + order.container.price;
  const total = subtotal - order.credit.amount;
  return {
    products,
    container: order.container.price,
    subtotal,
    credit: order.credit.amount,
    total,
  };
};

export const buildPassifloraOrderText = (
  order: PassifloraOrder,
  origin = "https://agroeco.red",
) => {
  const totals = getPassifloraTotals(order);
  const productLines = order.products.flatMap((product) => [
    `* ${product.name} — ${product.producer}, ${product.location} — ${product.certification} | ${product.quantity} ${formatPassifloraPrice(product.price)}`,
    `LINK: ${getPassifloraProductUrl(product, origin)}`,
    "",
  ]);

  return [
    "ALIMENTOS AGROECOLÓGICOS",
    `${order.network.toUpperCase()} · ${order.round.toUpperCase()}`,
    `PEDIDO #${order.number}`,
    "",
    `👤 ${order.customerName}`,
    `📞 TELÉFONO: ${order.customerPhone}`,
    `🏡 Adquiero ${order.container.name} ${formatPassifloraPrice(order.container.price)}`,
    "",
    ...productLines,
    `💰 SUBTOTAL: ${formatPassifloraPrice(totals.subtotal)}`,
    `♻️ ${order.credit.note}: -${formatPassifloraPrice(totals.credit)}`,
    `💰 TOTAL FINAL: ${formatPassifloraPrice(totals.total)}`,
  ].join("\n");
};
