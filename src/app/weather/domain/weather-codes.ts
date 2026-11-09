/** WMO weather interpretation codes, as returned by Open-Meteo. */
import { UNKNOWN_CODE, WEATHER_CODES } from './weather-codes.constants';
import { WeatherCodeInfo } from './weather-codes.types';

/**
 * Returns the human-readable label and sky condition for a WMO weather code.
 * Falls back to {@link UNKNOWN_CODE} for unrecognised codes.
 */
export function describeWeatherCode(code: number): WeatherCodeInfo {
  return WEATHER_CODES[code] ?? UNKNOWN_CODE;
}

/** Returns `true` when the WMO code represents a thunderstorm. */
export function isStormCode(code: number): boolean {
  return describeWeatherCode(code).condition === 'storm';
}

/**
 * Returns `true` when the WMO code represents any form of precipitation
 * (rain, drizzle, or storm).
 */
export function isWetCode(code: number): boolean {
  const { condition } = describeWeatherCode(code);
  return condition === 'rain' || condition === 'drizzle' || condition === 'storm';
}
