export interface LocationData {
  countries: { code: string; name: string; phoneCode: string; regions: { code: string; name: string; cities: string[] }[] }[];
}

export const locationData: LocationData = {
  countries: [
    {
      code: "AR",
      name: "Argentina",
      phoneCode: "+54",
      regions: [
        { code: "BA", name: "Buenos Aires", cities: ["CABA", "La Plata", "Mar del Plata", "Bahía Blanca", "Quilmes", "Moreno", "Florencio Varela", "San Vicente", "Cañuelas", "Luján", "Marcos Paz", "Pilar", "Tigre", "San Isidro", "Avellaneda", "Lanús", "Lomas de Zamora", "Berazategui", "Almirante Brown", "Esteban Echeverría"] },
        { code: "SF", name: "Santa Fe", cities: ["Rosario", "Santa Fe", "Rafaela", "Reconquista", "Venado Tuerto"] },
        { code: "CB", name: "Córdoba", cities: ["Córdoba", "Villa María", "Río Cuarto", "San Francisco", "Villa Carlos Paz"] },
        { code: "MZ", name: "Mendoza", cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Luján de Cuyo", "Maipú"] },
        { code: "ER", name: "Entre Ríos", cities: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Villaguay"] },
        { code: "TU", name: "Tucumán", cities: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción", "Aguilares"] },
        { code: "MI", name: "Misiones", cities: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Apóstoles"] },
        { code: "CH", name: "Chaco", cities: ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Charata"] },
        { code: "CO", name: "Corrientes", cities: ["Corrientes", "Goya", "Mercedes", "Paso de los Libres", "Curuzú Cuatiá"] },
        { code: "SA", name: "Salta", cities: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Cafayate", "General Güemes"] },
        { code: "RN", name: "Río Negro", cities: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "Allen"] },
        { code: "NQ", name: "Neuquén", cities: ["Neuquén", "San Martín de los Andes", "Centenario", "Plottier", "Cutral-Có"] },
        { code: "JU", name: "Jujuy", cities: ["San Salvador de Jujuy", "Palpalá", "San Pedro de Jujuy", "Tilcara", "Humahuaca"] },
        { code: "SJ", name: "San Juan", cities: ["San Juan", "Rawson", "Rivadavia", "Chimbas", "Pocito"] },
        { code: "SL", name: "San Luis", cities: ["San Luis", "Villa Mercedes", "Merlo", "Juana Koslay"] },
        { code: "CT", name: "Catamarca", cities: ["San Fernando del Valle de Catamarca", "Recreo", "Tinogasta", "Belén"] },
        { code: "LP", name: "La Pampa", cities: ["Santa Rosa", "General Pico", "Toay", "Victorica"] },
        { code: "LR", name: "La Rioja", cities: ["La Rioja", "Chilecito", "Aimogasta", "Chamical"] },
        { code: "SE", name: "Santiago del Estero", cities: ["Santiago del Estero", "La Banda", "Termas de Río Hondo", "Añatuya"] },
        { code: "FO", name: "Formosa", cities: ["Formosa", "Clorinda", "Pirané", "El Colorado"] },
        { code: "SC", name: "Santa Cruz", cities: ["Río Gallegos", "Caleta Olivia", "El Calafate", "Pico Truncado"] },
        { code: "CH2", name: "Chubut", cities: ["Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"] },
        { code: "TF", name: "Tierra del Fuego", cities: ["Ushuaia", "Río Grande", "Tolhuin"] },
      ],
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
