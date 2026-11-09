/** Unit conversion. The app stores every value in metric units and converts only to display it. */
import { COMPASS_POINTS, WIND_SPEED_LABELS } from './units.constants';
import { TemperatureUnit, WindSpeedUnit } from './units.types';

/** Converts a Celsius temperature to the requested unit. */
export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

/** Converts a temperature *difference* — ignores the 32° offset of Fahrenheit. */
export function convertTemperatureDelta(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? (celsius * 9) / 5 : celsius;
}

/** Returns a formatted temperature string with the degree symbol, e.g. "25°". */
export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  const value = Math.round(convertTemperature(celsius, unit));
  // Avoids showing "-0°" for values between -0.5 and 0.
  return `${value === 0 ? 0 : value}°`;
}

/** Converts a km/h wind speed to the requested unit. */
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

/** Returns a formatted wind speed string including the unit label, e.g. "45 km/h". */
export function formatWindSpeed(kmh: number, unit: WindSpeedUnit): string {
  return `${Math.round(convertWindSpeed(kmh, unit))} ${WIND_SPEED_LABELS[unit]}`;
}

/** Returns the Spanish compass-point abbreviation for a wind bearing, e.g. "SO". */
export function compassPoint(degrees: number): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index] ?? 'N';
}
