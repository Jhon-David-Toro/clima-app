import { AirQuality, DailyPoint, Forecast, HourlyPoint } from './forecast';
import { AirQualityResponse, ForecastResponse, Series } from './open-meteo';
import { toIsoDate } from '../shared/time-format';

const SECOND_MS = 1000;

function valueAt(series: Series, index: number): number {
  return series[index] ?? 0;
}

function timeAt(series: Series, index: number): number {
  return valueAt(series, index) * SECOND_MS;
}

function mapHourly(hourly: ForecastResponse['hourly']): HourlyPoint[] {
  return hourly.time.map((_, i) => ({
    time: timeAt(hourly.time, i),
    temperature: valueAt(hourly.temperature_2m, i),
    apparentTemperature: valueAt(hourly.apparent_temperature, i),
    precipitationProbability: valueAt(hourly.precipitation_probability, i),
    precipitation: valueAt(hourly.precipitation, i),
    weatherCode: valueAt(hourly.weather_code, i),
    windSpeed: valueAt(hourly.wind_speed_10m, i),
    windGusts: valueAt(hourly.wind_gusts_10m, i),
    uvIndex: valueAt(hourly.uv_index, i),
    visibility: valueAt(hourly.visibility, i),
    isDay: valueAt(hourly.is_day, i) === 1,
  }));
}

function mapDaily(daily: ForecastResponse['daily'], timeZone: string): DailyPoint[] {
  return daily.time.map((_, i) => ({
    date: toIsoDate(timeAt(daily.time, i), timeZone),
    weatherCode: valueAt(daily.weather_code, i),
    temperatureMax: valueAt(daily.temperature_2m_max, i),
    temperatureMin: valueAt(daily.temperature_2m_min, i),
    sunrise: timeAt(daily.sunrise, i),
    sunset: timeAt(daily.sunset, i),
    uvIndexMax: valueAt(daily.uv_index_max, i),
    precipitationSum: valueAt(daily.precipitation_sum, i),
    precipitationProbabilityMax: valueAt(daily.precipitation_probability_max, i),
    windGustsMax: valueAt(daily.wind_gusts_10m_max, i),
  }));
}

export function mapForecast(response: ForecastResponse, fetchedAt: number): Forecast {
  const { current } = response;
  return {
    timeZone: response.timezone,
    fetchedAt,
    current: {
      time: current.time * SECOND_MS,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      relativeHumidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      cloudCover: current.cloud_cover,
      pressure: current.pressure_msl,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      windGusts: current.wind_gusts_10m,
      isDay: current.is_day === 1,
    },
    hourly: mapHourly(response.hourly),
    daily: mapDaily(response.daily, response.timezone),
  };
}

export function mapAirQuality(response: AirQualityResponse): AirQuality {
  const { current } = response;
  return {
    time: current.time * SECOND_MS,
    usAqi: current.us_aqi,
    pm25: current.pm2_5,
    pm10: current.pm10,
  };
}

/** Hourly points from the hour that contains `now` onwards. */
export function upcomingHours(
  hourly: readonly HourlyPoint[],
  now: number,
  count: number,
): HourlyPoint[] {
  const hourMs = 60 * 60 * SECOND_MS;
  const start = hourly.findIndex((point) => point.time + hourMs > now);
  return start === -1 ? [] : hourly.slice(start, start + count);
}
