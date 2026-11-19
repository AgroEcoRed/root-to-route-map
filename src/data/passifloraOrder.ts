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

export const PASSIFLORA_ORDER_PATH = "/pedidos/red-passiflora/ronda-11/23";
export const PASSIFLORA_ORDER_URL = `https://agroeco.red${PASSIFLORA_ORDER_PATH}`;

export const passifloraOrder = {
  network: "Red Passiflora",
  round: "Ronda 11",
  number: 23,
  customerName: "BLACK SÁBALO",
  customerPhone: "03446-556671",
  container: {
    name: "Cajón de madera retornable",
    price: 2500,
  },
  credit: {
    note: "Nota de crédito R7",
    amount: 4000,
  },
};

export const passifloraProducts: PassifloraProduct[] = [
  {
    slug: "manzana-cripps-pink-pluma-azul-neuquen-organico",
    name: "Manzana Cripps Pink",
    producer: "Pluma Azul",
    location: "Neuquén",
    certification: "Orgánico",
    quantity: "1 kg",
    price: 5600,
    image: "🍎",
  },
  {
    slug: "mandarina-criolla-finca-don-luis-entre-rios-agroecologico",
    name: "Mandarina Criolla",
    producer: "Finca Don Luis",
    location: "Entre Ríos",
    certification: "Agroecológico",
    quantity: "1 kg",
    price: 3200,
    image: "🍊",
  },
  {
    slug: "palta-silvestre-finca-ecotipa-tucuman-agroecologico",
    name: "Palta silvestre",
    producer: "Finca Ecotipa",
    location: "Tucumán",
    certification: "Agroecológico",
    quantity: "1 kg",
    price: 8500,
    image: "🥑",
  },
  {
    slug: "tomate-redondo-finca-la-lucrecia-jujuy-organico",
    name: "Tomate redondo",
    producer: "Finca La Lucrecia",
    location: "Jujuy",
    certification: "Orgánico",
    quantity: "1 kg",
    price: 8500,
    image: "🍅",
  },
  {
    slug: "rucula-chacra-gonzalez-gualeguaychu-agroecologico",
    name: "Rúcula",
    producer: "Chacra Gonzalez",
    location: "Gualeguaychú",
    certification: "Agroecológico",
    quantity: "1 atado",
    price: 2100,
    image: "🌿",
  },
  {
    slug: "acelga-caminos-del-gualeyan-y-chacra-gonzalez-gualeguaychu-agroecologico",
    name: "Acelga",
    producer: "Caminos del Gualeyán y Chacra Gonzalez",
    location: "Gualeguaychú",
    certification: "Agroecológico",
    quantity: "1 atado",
    price: 2100,
    image: "🥬",
  },
  {
    slug: "lechuga-crespa-chacra-gonzalez-gualeguaychu-agroecologico",
    name: "Lechuga crespa",
    producer: "Chacra Gonzalez",
    location: "Gualeguaychú",
    certification: "Agroecológico",
    quantity: "1 atado",
    price: 2100,
    image: "🥬",
  },
  {
    slug: "habas-chacra-de-carlos-bos-gualeguaychu-agroecologico",
    name: "Habas",
    producer: "Chacra de Carlos Bos",
    location: "Gualeguaychú",
    certification: "Agroecológico",
    quantity: "1/4 kg",
    price: 1500,
    image: "🫛",
  },
];

export const formatPassifloraPrice = (value: number) =>
  `$${value.toLocaleString("es-AR")}`;

export const getPassifloraProductPath = (product: PassifloraProduct) =>
  `/productos/${product.slug}`;

export const getPassifloraProductUrl = (
  product: PassifloraProduct,
  origin = "https://agroeco.red",
) => `${origin.replace(/\/$/, "")}${getPassifloraProductPath(product)}`;

export const findPassifloraProduct = (slug?: string) =>
  passifloraProducts.find((product) => product.slug === slug);

export const getPassifloraTotals = () => {
  const products = passifloraProducts.reduce((sum, product) => sum + product.price, 0);
  const subtotal = products + passifloraOrder.container.price;
  const total = subtotal - passifloraOrder.credit.amount;
  return { products, container: passifloraOrder.container.price, subtotal, credit: passifloraOrder.credit.amount, total };
};

export const buildPassifloraOrderText = (origin = "https://agroeco.red") => {
  const totals = getPassifloraTotals();
  const productLines = passifloraProducts.flatMap((product) => [
    `* ${product.name} — ${product.producer}, ${product.location} — ${product.certification} | ${product.quantity} ${formatPassifloraPrice(product.price)}`,
    `LINK: ${getPassifloraProductUrl(product, origin)}`,
    "",
  ]);

  return [
    "ALIMENTOS AGROECOLÓGICOS",
    `${passifloraOrder.network.toUpperCase()} · ${passifloraOrder.round.toUpperCase()}`,
    `PEDIDO #${passifloraOrder.number}`,
    "",
    `👤 ${passifloraOrder.customerName}`,
    `📞 TELÉFONO: ${passifloraOrder.customerPhone}`,
    `🏡 Adquiero ${passifloraOrder.container.name} ${formatPassifloraPrice(passifloraOrder.container.price)}`,
    "",
    ...productLines,
    `💰 SUBTOTAL: ${formatPassifloraPrice(totals.subtotal)}`,
    `♻️ ${passifloraOrder.credit.note}: -${formatPassifloraPrice(totals.credit)}`,
    `💰 TOTAL FINAL: ${formatPassifloraPrice(totals.total)}`,
  ].join("\n");
};
