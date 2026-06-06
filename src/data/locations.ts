import { argentinaRegions } from "./argentinaRegions";

export interface LocationData {
  countries: { code: string; name: string; phoneCode: string; regions: { code: string; name: string; cities: string[] }[] }[];
}

export const locationData: LocationData = {
  countries: [
    {
      code: "AR",
      name: "Argentina",
      phoneCode: "+54",
      regions: argentinaRegions as unknown as { code: string; name: string; cities: string[] }[],
    },
    {
      code: "UY",
      name: "Uruguay",
      phoneCode: "+598",
      regions: [
        { code: "MO", name: "Montevideo", cities: ["Montevideo"] },
        { code: "CA", name: "Canelones", cities: ["Las Piedras", "Ciudad de la Costa", "Pando", "Canelones"] },
        { code: "MA", name: "Maldonado", cities: ["Maldonado", "Punta del Este", "San Carlos"] },
        { code: "CO", name: "Colonia", cities: ["Colonia del Sacramento", "Carmelo", "Juan Lacaze"] },
        { code: "SA", name: "Salto", cities: ["Salto"] },
      ],
    },
    {
      code: "BR",
      name: "Brasil",
      phoneCode: "+55",
      regions: [
        { code: "SP", name: "São Paulo", cities: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto"] },
        { code: "RJ", name: "Rio de Janeiro", cities: ["Rio de Janeiro", "Niterói", "Petrópolis"] },
        { code: "RS", name: "Rio Grande do Sul", cities: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria"] },
        { code: "PR", name: "Paraná", cities: ["Curitiba", "Londrina", "Maringá", "Foz do Iguaçu"] },
        { code: "SC", name: "Santa Catarina", cities: ["Florianópolis", "Joinville", "Blumenau", "Chapecó"] },
        { code: "MG", name: "Minas Gerais", cities: ["Belo Horizonte", "Uberlândia", "Juiz de Fora"] },
      ],
    },
    {
      code: "CL",
      name: "Chile",
      phoneCode: "+56",
      regions: [
        { code: "RM", name: "Región Metropolitana", cities: ["Santiago", "Puente Alto", "Maipú"] },
        { code: "VA", name: "Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quilpué"] },
        { code: "BB", name: "Biobío", cities: ["Concepción", "Talcahuano", "Los Ángeles"] },
      ],
    },
    {
      code: "PY",
      name: "Paraguay",
      phoneCode: "+595",
      regions: [
        { code: "AS", name: "Asunción", cities: ["Asunción"] },
        { code: "CE", name: "Central", cities: ["San Lorenzo", "Luque", "Fernando de la Mora", "Lambaré"] },
        { code: "AP", name: "Alto Paraná", cities: ["Ciudad del Este", "Presidente Franco", "Hernandarias"] },
      ],
    },
    {
      code: "BO",
      name: "Bolivia",
      phoneCode: "+591",
      regions: [
        { code: "LP", name: "La Paz", cities: ["La Paz", "El Alto"] },
        { code: "CB", name: "Cochabamba", cities: ["Cochabamba", "Sacaba", "Quillacollo"] },
        { code: "SC", name: "Santa Cruz", cities: ["Santa Cruz de la Sierra", "Montero", "Warnes"] },
      ],
    },
  ],
};
