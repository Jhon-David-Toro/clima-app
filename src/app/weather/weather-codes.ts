/** WMO weather interpretation codes, as returned by Open-Meteo. */

export type SkyCondition =
  'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface WeatherCodeInfo {
  readonly label: string;
  readonly condition: SkyCondition;
}

const WEATHER_CODES: Readonly<Record<number, WeatherCodeInfo>> = {
  0: { label: 'Despejado', condition: 'clear' },
  1: { label: 'Mayormente despejado', condition: 'clear' },
  2: { label: 'Parcialmente nublado', condition: 'partly-cloudy' },
  3: { label: 'Nublado', condition: 'cloudy' },
  45: { label: 'Niebla', condition: 'fog' },
  48: { label: 'Niebla con escarcha', condition: 'fog' },
  51: { label: 'Llovizna ligera', condition: 'drizzle' },
  53: { label: 'Llovizna', condition: 'drizzle' },
  55: { label: 'Llovizna intensa', condition: 'drizzle' },
  56: { label: 'Llovizna helada', condition: 'drizzle' },
  57: { label: 'Llovizna helada intensa', condition: 'drizzle' },
  61: { label: 'Lluvia ligera', condition: 'rain' },
  63: { label: 'Lluvia', condition: 'rain' },
  65: { label: 'Lluvia intensa', condition: 'rain' },
  66: { label: 'Lluvia helada', condition: 'rain' },
  67: { label: 'Lluvia helada intensa', condition: 'rain' },
  71: { label: 'Nevada ligera', condition: 'snow' },
  73: { label: 'Nevada', condition: 'snow' },
  75: { label: 'Nevada intensa', condition: 'snow' },
  77: { label: 'Granizo fino', condition: 'snow' },
  80: { label: 'Chubascos ligeros', condition: 'rain' },
  81: { label: 'Chubascos', condition: 'rain' },
  82: { label: 'Chubascos fuertes', condition: 'rain' },
  85: { label: 'Chubascos de nieve', condition: 'snow' },
  86: { label: 'Chubascos de nieve fuertes', condition: 'snow' },
  95: { label: 'Tormenta eléctrica', condition: 'storm' },
  96: { label: 'Tormenta con granizo', condition: 'storm' },
  99: { label: 'Tormenta fuerte con granizo', condition: 'storm' },
};

const UNKNOWN_CODE: WeatherCodeInfo = { label: 'Condición desconocida', condition: 'cloudy' };

export function describeWeatherCode(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? UNKNOWN_CODE;
}

export function isStormCode(code: number): boolean {
  return describeWeatherCode(code).condition === 'storm';
}

export function isWetCode(code: number): boolean {
  const { condition } = describeWeatherCode(code);
  return condition === 'rain' || condition === 'drizzle' || condition === 'storm';
}
