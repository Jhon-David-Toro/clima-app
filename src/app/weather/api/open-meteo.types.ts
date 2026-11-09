import { CURRENT_FIELDS, DAILY_FIELDS, HOURLY_FIELDS } from './open-meteo.constants';

type CurrentField = (typeof CURRENT_FIELDS)[number];
type HourlyField = (typeof HOURLY_FIELDS)[number];
type DailyField = (typeof DAILY_FIELDS)[number];
type DailyNumericField = Exclude<DailyField, 'sunrise' | 'sunset'>;

/** Key-value query string parameters for Open-Meteo requests. */
export type QueryParams = Readonly<Record<string, string | number>>;

/** Geographic coordinates used to request a forecast. */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** Open-Meteo returns `null` for values a model cannot provide at a given time. */
export type Series = readonly (number | null)[];

/** Raw forecast JSON shape returned by the Open-Meteo forecast endpoint. */
export interface ForecastResponse {
  readonly timezone: string;
  readonly current: Readonly<Record<CurrentField, number>> & { readonly time: number };
  readonly hourly: Readonly<Record<HourlyField | 'time', Series>>;
  readonly daily: Readonly<Record<DailyNumericField | 'time' | 'sunrise' | 'sunset', Series>>;
}

/** Raw JSON shape returned by the Open-Meteo air-quality endpoint. */
export interface AirQualityResponse {
  readonly current: {
    readonly time: number;
    readonly us_aqi: number;
    readonly pm2_5: number;
    readonly pm10: number;
  };
}

/** One result from the Open-Meteo geocoding endpoint. */
export interface GeocodingResult {
  readonly id: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly country?: string;
  readonly admin1?: string;
}

/** Geocoding endpoint response wrapper. */
export interface GeocodingResponse {
  readonly results: readonly GeocodingResult[];
}

/** Raised when an API answers with a payload that does not match its contract. */
export class UnexpectedResponseError extends Error {
  constructor(source: string) {
    super(`La respuesta de ${source} no tiene el formato esperado.`);
    this.name = 'UnexpectedResponseError';
  }
}
