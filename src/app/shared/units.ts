/** Unit conversion. The app stores every value in metric units and converts only to display it. */

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms';

export interface DisplayUnits {
  readonly temperature: TemperatureUnit;
  readonly windSpeed: WindSpeedUnit;
}

export const DEFAULT_UNITS: DisplayUnits = { temperature: 'celsius', windSpeed: 'kmh' };

export const WIND_SPEED_LABELS: Readonly<Record<WindSpeedUnit, string>> = {
  kmh: 'km/h',
  mph: 'mph',
  ms: 'm/s',
};

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

/** Converts a temperature difference, which ignores the 32° offset of Fahrenheit. */
export function convertTemperatureDelta(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 : celsius;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  const value = Math.round(convertTemperature(celsius, unit));
  // Avoids showing "-0°" for values between -0.5 and 0.
  return `${value === 0 ? 0 : value}°`;
}

export function convertWindSpeed(kmh: number, unit: WindSpeedUnit): number {
  switch (unit) {
    case 'mph':
      return kmh / 1.609344;
    case 'ms':
      return kmh / 3.6;
    case 'kmh':
      return kmh;
  }
}

export function formatWindSpeed(kmh: number, unit: WindSpeedUnit): string {
  return `${Math.round(convertWindSpeed(kmh, unit))} ${WIND_SPEED_LABELS[unit]}`;
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;

/** Cardinal point the wind blows from, in Spanish abbreviations (O = oeste). */
export function compassPoint(degrees: number): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index] ?? 'N';
}
