export type LicenseCode =
  | "CC0-1.0"
  | "CC-BY-4.0"
  | "CC-BY-SA-4.0"
  | "CC-BY-NC-4.0"
  | "CC-BY-NC-SA-4.0"
  | "ODbL-1.0"
  | "all-rights-reserved";

export interface LicenseInfo {
  code: LicenseCode;
  short: string;
  name: string;
  description: string;
  url: string;
  open: boolean;
}

export const LICENSES: LicenseInfo[] = [
  {
    code: "CC-BY-SA-4.0",
    short: "CC BY-SA 4.0",
    name: "Atribución – Compartir Igual",
    description:
      "Otros pueden compartir y adaptar el contenido, incluso comercialmente, siempre que den crédito y usen la misma licencia. (Recomendada por defecto)",
    url: "https://creativecommons.org/licenses/by-sa/4.0/deed.es",
    open: true,
  },
  {
    code: "CC-BY-4.0",
    short: "CC BY 4.0",
    name: "Atribución",
    description:
      "Otros pueden compartir y adaptar el contenido, incluso comercialmente, dando crédito al autor.",
    url: "https://creativecommons.org/licenses/by/4.0/deed.es",
    open: true,
  },
  {
    code: "CC-BY-NC-SA-4.0",
    short: "CC BY-NC-SA 4.0",
    name: "Atribución – No Comercial – Compartir Igual",
    description:
      "Otros pueden compartir y adaptar sin fines comerciales, dando crédito y manteniendo la misma licencia.",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es",
    open: true,
  },
  {
    code: "CC-BY-NC-4.0",
    short: "CC BY-NC 4.0",
    name: "Atribución – No Comercial",
    description:
      "Otros pueden compartir y adaptar sin fines comerciales, dando crédito.",
    url: "https://creativecommons.org/licenses/by-nc/4.0/deed.es",
    open: true,
  },
  {
    code: "CC0-1.0",
    short: "CC0 1.0",
    name: "Dominio público",
    description:
      "Liberás el contenido al dominio público. Cualquiera puede usarlo para cualquier fin, sin pedir permiso ni dar crédito.",
    url: "https://creativecommons.org/publicdomain/zero/1.0/deed.es",
    open: true,
  },
  {
    code: "ODbL-1.0",
    short: "ODbL 1.0",
    name: "Open Database License",
    description:
      "Licencia abierta pensada para bases de datos y capas geográficas. Otros pueden usar, modificar y redistribuir los datos, siempre que den atribución y compartan las obras derivadas bajo la misma licencia. Recomendada para capas del mapa colaborativo.",
    url: "https://opendatacommons.org/licenses/odbl/1-0/",
    open: true,
  },
  {
    code: "all-rights-reserved",
    short: "Todos los derechos reservados",
    name: "Todos los derechos reservados",
    description:
      "Mantenés todos los derechos. Nadie puede reutilizar el contenido sin tu permiso explícito.",
    url: "",
    open: false,
  },
];

export const DEFAULT_LICENSE: LicenseCode = "CC-BY-SA-4.0";

export const getLicense = (code?: string | null): LicenseInfo => {
  return (
    LICENSES.find((l) => l.code === code) ||
    LICENSES.find((l) => l.code === DEFAULT_LICENSE)!
  );
};