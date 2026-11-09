/**
 * Contract with the Open-Meteo APIs: query parameters, runtime guards and URL builder.
 * This file has no Angular dependencies so the background service worker can reuse it.
 */
import { isRecord } from '../../shared/utils/type-guards';
import { CURRENT_FIELDS, DAILY_FIELDS, HOURLY_FIELDS } from './open-meteo.constants';
import {
  AirQualityResponse,
  Coordinates,
  ForecastResponse,
  GeocodingResponse,
  GeocodingResult,
  QueryParams,
  Series,
  UnexpectedResponseError,
} from './open-meteo.types';

/** Builds query parameters for the forecast endpoint. */
export function forecastParams({ latitude, longitude }: Coordinates): QueryParams {
  return {
    latitude,
    longitude,
    current: CURRENT_FIELDS.join(','),
    hourly: HOURLY_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    timezone: 'auto',
    past_days: 1,
    forecast_days: 10,
    timeformat: 'unixtime',
  };
}

/** Builds query parameters for the air-quality endpoint. */
export function airQualityParams({ latitude, longitude }: Coordinates): QueryParams {
  return {
    latitude,
    longitude,
    current: 'us_aqi,pm2_5,pm10',
    timezone: 'auto',
    timeformat: 'unixtime',
  };
}

/** Builds query parameters for the geocoding endpoint. */
export function geocodingParams(name: string): QueryParams {
  return { name, count: 6, language: 'es', format: 'json' };
}

/**
 * Builds a full URL with query string.
 * Used in contexts without Angular's `HttpClient` (e.g. the service worker).
 */
export function buildUrl(base: string, params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  return `${base}?${search.toString()}`;
}

function isSeries(value: unknown): value is Series {
  return Array.isArray(value) && value.every((item) => typeof item === 'number' || item === null);
}

function hasNumbers(value: unknown, keys: readonly string[]): boolean {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'number');
}

function hasSeries(value: unknown, keys: readonly string[]): boolean {
  return isRecord(value) && keys.every((key) => isSeries(value[key]));
}

/**
 * Validates and casts the raw API response from the forecast endpoint.
 * @throws {@link UnexpectedResponseError} when the shape does not match.
 */
export function parseForecastResponse(value: unknown): ForecastResponse {
  if (
    isRecord(value) &&
    typeof value['timezone'] === 'string' &&
    hasNumbers(value['current'], ['time', ...CURRENT_FIELDS]) &&
    hasSeries(value['hourly'], ['time', ...HOURLY_FIELDS]) &&
    hasSeries(value['daily'], ['time', ...DAILY_FIELDS])
  ) {
    return value as unknown as ForecastResponse;
  }
  throw new UnexpectedResponseError('el pronóstico');
}

/**
 * Validates and casts the raw API response from the air-quality endpoint.
 * @throws {@link UnexpectedResponseError} when the shape does not match.
 */
export function parseAirQualityResponse(value: unknown): AirQualityResponse {
  if (isRecord(value) && hasNumbers(value['current'], ['time', 'us_aqi', 'pm2_5', 'pm10'])) {
    return value as unknown as AirQualityResponse;
  }
  throw new UnexpectedResponseError('la calidad del aire');
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  return (
    isRecord(value) &&
    typeof value['id'] === 'number' &&
    typeof value['name'] === 'string' &&
    typeof value['latitude'] === 'number' &&
    typeof value['longitude'] === 'number'
  );
}

/**
 * Validates and casts the raw API response from the geocoding endpoint.
 * Open-Meteo omits `results` when nothing matches, so a missing list means "no results".
 * @throws {@link UnexpectedResponseError} when the shape does not match.
 */
export function parseGeocodingResponse(value: unknown): GeocodingResponse {
  if (!isRecord(value)) {
    throw new UnexpectedResponseError('la búsqueda de ciudades');
  }
  const results = value['results'];
  if (results === undefined) {
    return { results: [] };
  }
  if (Array.isArray(results)) {
    return { results: results.filter(isGeocodingResult) };
  }
  throw new UnexpectedResponseError('la búsqueda de ciudades');
}
