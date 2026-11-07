/**
 * Contract with the Open-Meteo APIs: endpoints, query parameters, raw response shapes and runtime
 * guards. This file has no Angular dependencies so the background service worker can reuse it.
 */
import { isRecord } from '../shared/type-guards';

export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'is_day',
] as const;

const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'uv_index',
  'visibility',
  'is_day',
] as const;

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_gusts_10m_max',
] as const;

type CurrentField = (typeof CURRENT_FIELDS)[number];
type HourlyField = (typeof HOURLY_FIELDS)[number];
type DailyField = (typeof DAILY_FIELDS)[number];
type DailyNumericField = Exclude<DailyField, 'sunrise' | 'sunset'>;

export type QueryParams = Readonly<Record<string, string | number>>;

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

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

export function airQualityParams({ latitude, longitude }: Coordinates): QueryParams {
  return {
    latitude,
    longitude,
    current: 'us_aqi,pm2_5,pm10',
    timezone: 'auto',
    timeformat: 'unixtime',
  };
}

export function geocodingParams(name: string): QueryParams {
  return { name, count: 6, language: 'es', format: 'json' };
}

/** Builds a full URL, for contexts without Angular's `HttpClient` (the service worker). */
export function buildUrl(base: string, params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value));
  }
  return `${base}?${search.toString()}`;
}

/** Open-Meteo returns `null` for values a model cannot provide at a given time. */
export type Series = readonly (number | null)[];

export interface ForecastResponse {
  readonly timezone: string;
  readonly current: Readonly<Record<CurrentField, number>> & { readonly time: number };
  readonly hourly: Readonly<Record<HourlyField | 'time', Series>>;
  readonly daily: Readonly<Record<DailyNumericField | 'time' | 'sunrise' | 'sunset', Series>>;
}

export interface AirQualityResponse {
  readonly current: {
    readonly time: number;
    readonly us_aqi: number;
    readonly pm2_5: number;
    readonly pm10: number;
  };
}

export interface GeocodingResult {
  readonly id: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly country?: string;
  readonly admin1?: string;
}

export interface GeocodingResponse {
  readonly results: readonly GeocodingResult[];
}

/** Error raised when an API answers with a payload that does not match its contract. */
export class UnexpectedResponseError extends Error {
  constructor(source: string) {
    super(`La respuesta de ${source} no tiene el formato esperado.`);
    this.name = 'UnexpectedResponseError';
  }
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

/** Open-Meteo omits `results` when nothing matches, so a missing list means "no results". */
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
