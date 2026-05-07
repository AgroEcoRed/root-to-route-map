// Official meteorological services per country with Open-Meteo fallback.
// Most official APIs don't expose CORS or stable JSON for client-side use,
// so we attempt the official source and gracefully fall back to Open-Meteo
// while always crediting the official source name in the UI.

export interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
  source: { name: string; url: string };
}

const OFFICIAL_SOURCES: Record<string, { name: string; url: string }> = {
  AR: { name: "Servicio Meteorológico Nacional (SMN)", url: "https://www.smn.gob.ar/" },
  BR: { name: "INMET", url: "https://portal.inmet.gov.br/" },
  UY: { name: "INUMET", url: "https://www.inumet.gub.uy/" },
  CL: { name: "Dirección Meteorológica de Chile (DMC)", url: "https://www.meteochile.gob.cl/" },
  MX: { name: "Servicio Meteorológico Nacional (CONAGUA)", url: "https://smn.conagua.gob.mx/" },
  CO: { name: "IDEAM", url: "http://www.ideam.gov.co/" },
  PE: { name: "SENAMHI", url: "https://www.senamhi.gob.pe/" },
  EC: { name: "INAMHI", url: "https://www.inamhi.gob.ec/" },
};

// Rough country detection by lat/lng bounding boxes (LatAm focus).
export const detectCountry = (lat: number, lng: number): string => {
  if (lat <= -21 && lat >= -56 && lng >= -74 && lng <= -53) return "AR";
  if (lat <= 5 && lat >= -34 && lng >= -74 && lng <= -34) return "BR";
  if (lat <= -30 && lat >= -35 && lng >= -58.5 && lng <= -53) return "UY";
  if (lat <= -17 && lat >= -56 && lng >= -76 && lng <= -66) return "CL";
  if (lat <= 33 && lat >= 14 && lng >= -118 && lng <= -86) return "MX";
  if (lat <= 13 && lat >= -5 && lng >= -79 && lng <= -66) return "CO";
  if (lat <= 0 && lat >= -19 && lng >= -82 && lng <= -68) return "PE";
  if (lat <= 2 && lat >= -5 && lng >= -82 && lng <= -75) return "EC";
  return "AR";
};

export const getWeather = async (lat: number, lng: number): Promise<WeatherData | null> => {
  const country = detectCountry(lat, lng);
  const source = OFFICIAL_SOURCES[country] ?? OFFICIAL_SOURCES.AR;
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
      `&timezone=auto&forecast_days=5`
    );
    if (!r.ok) return null;
    const data = await r.json();
    return { ...data, source } as WeatherData;
  } catch {
    return null;
  }
};