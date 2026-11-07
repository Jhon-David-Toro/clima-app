/** Domain model for a forecast, independent from the API that provides it. */

/** Epoch time in milliseconds. */
export type EpochMs = number;

export interface CurrentConditions {
  readonly time: EpochMs;
  readonly temperature: number;
  readonly apparentTemperature: number;
  readonly relativeHumidity: number;
  readonly precipitation: number;
  readonly weatherCode: number;
  readonly cloudCover: number;
  readonly pressure: number;
  readonly windSpeed: number;
  readonly windDirection: number;
  readonly windGusts: number;
  readonly isDay: boolean;
}

export interface HourlyPoint {
  readonly time: EpochMs;
  readonly temperature: number;
  readonly apparentTemperature: number;
  readonly precipitationProbability: number;
  readonly precipitation: number;
  readonly weatherCode: number;
  readonly windSpeed: number;
  readonly windGusts: number;
  readonly uvIndex: number;
  readonly visibility: number;
  readonly isDay: boolean;
}

export interface DailyPoint {
  /** Local calendar date in ISO format, for example `2026-11-07`. */
  readonly date: string;
  readonly weatherCode: number;
  readonly temperatureMax: number;
  readonly temperatureMin: number;
  readonly sunrise: EpochMs;
  readonly sunset: EpochMs;
  readonly uvIndexMax: number;
  readonly precipitationSum: number;
  readonly precipitationProbabilityMax: number;
  readonly windGustsMax: number;
}

export interface Forecast {
  /** IANA time zone of the forecast location, for example `America/Bogota`. */
  readonly timeZone: string;
  readonly fetchedAt: EpochMs;
  readonly current: CurrentConditions;
  /** Hourly points, including the past day used for comparisons. */
  readonly hourly: readonly HourlyPoint[];
  /** Daily points; index 0 is yesterday, index 1 is today. */
  readonly daily: readonly DailyPoint[];
}

export interface AirQuality {
  readonly time: EpochMs;
  readonly usAqi: number;
  readonly pm25: number;
  readonly pm10: number;
}
