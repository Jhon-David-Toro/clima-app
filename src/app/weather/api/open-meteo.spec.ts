import { buildForecastResponse, localTime, TIME_ZONE } from '../../../testing/forecast-fixtures';
import { mapForecast, upcomingHours } from '../domain/forecast-mapper';
import { UnexpectedResponseError } from './open-meteo.types';
import {
  buildUrl,
  parseAirQualityResponse,
  parseForecastResponse,
  parseGeocodingResponse,
} from './open-meteo';

describe('Open-Meteo contract', () => {
  it('accepts a valid forecast and maps it to the domain model', () => {
    const forecast = mapForecast(parseForecastResponse(buildForecastResponse()), 0);

    expect(forecast.timeZone).toBe(TIME_ZONE);
    expect(forecast.hourly).toHaveLength(72);
    expect(forecast.hourly[0]?.time).toBe(localTime(0, 0));
    expect(forecast.daily.map((day) => day.date)).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(forecast.current.isDay).toBe(true);
  });

  it('maps missing values to zero instead of breaking', () => {
    const raw = buildForecastResponse();
    const withNulls = {
      ...raw,
      hourly: { ...raw.hourly, uv_index: raw.hourly.uv_index.map(() => null) },
    };

    const forecast = mapForecast(parseForecastResponse(withNulls), 0);

    expect(forecast.hourly.every((hour) => hour.uvIndex === 0)).toBe(true);
  });

  it('rejects payloads that do not match the contract', () => {
    expect(() => parseForecastResponse({ timezone: 'UTC' })).toThrow(UnexpectedResponseError);
    expect(() => parseForecastResponse(null)).toThrow(UnexpectedResponseError);
    expect(() => parseAirQualityResponse({ current: { us_aqi: '12' } })).toThrow(
      UnexpectedResponseError,
    );
  });

  it('treats a geocoding response without results as an empty list', () => {
    expect(parseGeocodingResponse({ generationtime_ms: 0.2 }).results).toEqual([]);
  });

  it('drops malformed geocoding results', () => {
    const response = parseGeocodingResponse({
      results: [
        { id: 1, name: 'Cali', latitude: 3.43, longitude: -76.52 },
        { id: 2, name: 'Sin coordenadas' },
      ],
    });

    expect(response.results.map((r) => r.name)).toEqual(['Cali']);
  });

  it('builds URLs with encoded parameters', () => {
    expect(buildUrl('https://example.test/search', { name: 'São Paulo', count: 2 })).toBe(
      'https://example.test/search?name=S%C3%A3o+Paulo&count=2',
    );
  });

  it('starts upcoming hours at the current hour', () => {
    const hourly = mapForecast(parseForecastResponse(buildForecastResponse()), 0).hourly;

    const hours = upcomingHours(hourly, localTime(1, 10) + 20 * 60 * 1000, 3);

    expect(hours.map((h) => h.time)).toEqual([
      localTime(1, 10),
      localTime(1, 11),
      localTime(1, 12),
    ]);
  });
});
