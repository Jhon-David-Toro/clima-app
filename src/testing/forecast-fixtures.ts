/** Deterministic forecasts for tests, located in Bogotá (UTC-5, no daylight saving time). */
import { DailyPoint, Forecast, HourlyPoint } from '../app/weather/forecast';
import { ForecastResponse } from '../app/weather/open-meteo';

export const TIME_ZONE = 'America/Bogota';
export const HOUR_MS = 60 * 60 * 1000;
/** 2026-11-06 00:00 in Bogotá, the first hour returned with `past_days=1`. */
export const YESTERDAY_START = Date.UTC(2026, 10, 6, 5);
const DAYS = 3;

/** Epoch for a local hour, where day 0 is yesterday, 1 today and 2 tomorrow. */
export function localTime(day: number, hour: number): number {
  return YESTERDAY_START + (day * 24 + hour) * HOUR_MS;
}

function localHour(time: number): number {
  return Math.floor((time - YESTERDAY_START) / HOUR_MS) % 24;
}

export function hourlyPoint(time: number, overrides: Partial<HourlyPoint> = {}): HourlyPoint {
  const hour = localHour(time);
  const isDay = hour >= 6 && hour < 18;
  return {
    time,
    temperature: 20,
    apparentTemperature: 20,
    precipitationProbability: 0,
    precipitation: 0,
    weatherCode: 1,
    windSpeed: 10,
    windGusts: 15,
    uvIndex: isDay ? 3 : 0,
    visibility: 20_000,
    isDay,
    ...overrides,
  };
}

export function dailyPoint(day: number, overrides: Partial<DailyPoint> = {}): DailyPoint {
  return {
    date: `2026-11-0${String(6 + day)}`,
    weatherCode: 2,
    temperatureMax: 25,
    temperatureMin: 15,
    sunrise: localTime(day, 6),
    sunset: localTime(day, 18),
    uvIndexMax: 6,
    precipitationSum: 0,
    precipitationProbabilityMax: 10,
    windGustsMax: 20,
    ...overrides,
  };
}

export interface ForecastOptions {
  readonly hourly?: (point: HourlyPoint) => Partial<HourlyPoint>;
  readonly daily?: readonly Partial<DailyPoint>[];
  readonly current?: Partial<Forecast['current']>;
}

export function buildForecast(options: ForecastOptions = {}): Forecast {
  const hourly = Array.from({ length: DAYS * 24 }, (_, i) => {
    const base = hourlyPoint(YESTERDAY_START + i * HOUR_MS);
    return { ...base, ...options.hourly?.(base) };
  });
  return {
    timeZone: TIME_ZONE,
    fetchedAt: localTime(1, 10),
    current: {
      time: localTime(1, 10),
      temperature: 21,
      apparentTemperature: 22,
      relativeHumidity: 65,
      precipitation: 0,
      weatherCode: 2,
      cloudCover: 40,
      pressure: 1013,
      windSpeed: 9,
      windDirection: 90,
      windGusts: 18,
      isDay: true,
      ...options.current,
    },
    hourly,
    daily: Array.from({ length: DAYS }, (_, day) => dailyPoint(day, options.daily?.[day])),
  };
}

/** Raw API payload equivalent to `buildForecast()`, with epoch times in seconds. */
export function buildForecastResponse(): ForecastResponse {
  const forecast = buildForecast();
  const seconds = (ms: number): number => ms / 1000;
  const series = <K extends keyof HourlyPoint>(
    key: K,
    map: (v: HourlyPoint[K]) => number,
  ): number[] => forecast.hourly.map((point) => map(point[key]));
  const number = (value: number): number => value;
  const flag = (value: boolean): number => (value ? 1 : 0);
  const { current } = forecast;
  return {
    timezone: forecast.timeZone,
    current: {
      time: seconds(current.time),
      temperature_2m: current.temperature,
      apparent_temperature: current.apparentTemperature,
      relative_humidity_2m: current.relativeHumidity,
      precipitation: current.precipitation,
      weather_code: current.weatherCode,
      cloud_cover: current.cloudCover,
      pressure_msl: current.pressure,
      wind_speed_10m: current.windSpeed,
      wind_direction_10m: current.windDirection,
      wind_gusts_10m: current.windGusts,
      is_day: flag(current.isDay),
    },
    hourly: {
      time: series('time', seconds),
      temperature_2m: series('temperature', number),
      apparent_temperature: series('apparentTemperature', number),
      precipitation_probability: series('precipitationProbability', number),
      precipitation: series('precipitation', number),
      weather_code: series('weatherCode', number),
      wind_speed_10m: series('windSpeed', number),
      wind_gusts_10m: series('windGusts', number),
      uv_index: series('uvIndex', number),
      visibility: series('visibility', number),
      is_day: series('isDay', flag),
    },
    daily: {
      time: forecast.daily.map((_, day) => seconds(localTime(day, 0))),
      weather_code: forecast.daily.map((d) => d.weatherCode),
      temperature_2m_max: forecast.daily.map((d) => d.temperatureMax),
      temperature_2m_min: forecast.daily.map((d) => d.temperatureMin),
      sunrise: forecast.daily.map((d) => seconds(d.sunrise)),
      sunset: forecast.daily.map((d) => seconds(d.sunset)),
      uv_index_max: forecast.daily.map((d) => d.uvIndexMax),
      precipitation_sum: forecast.daily.map((d) => d.precipitationSum),
      precipitation_probability_max: forecast.daily.map((d) => d.precipitationProbabilityMax),
      wind_gusts_10m_max: forecast.daily.map((d) => d.windGustsMax),
    },
  };
}
