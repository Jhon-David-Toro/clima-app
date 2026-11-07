import { buildForecast, localTime, TIME_ZONE } from '../../testing/forecast-fixtures';
import { DEFAULT_UNITS } from '../shared/units';
import { AirQuality, Forecast } from '../weather/forecast';
import { AlertContext, evaluateAlerts } from './alert-rules';
import { AlertPreferences, DEFAULT_ALERT_PREFERENCES } from './weather-alert';

const NOW = localTime(1, 10);

function contextFor(forecast: Forecast, airQuality: AirQuality | null = null): AlertContext {
  return {
    hourly: forecast.hourly,
    airQuality,
    timeZone: TIME_ZONE,
    now: NOW,
    units: DEFAULT_UNITS,
  };
}

function kinds(forecast: Forecast, preferences = DEFAULT_ALERT_PREFERENCES): string[] {
  return evaluateAlerts(contextFor(forecast), preferences).map((alert) => alert.kind);
}

describe('evaluateAlerts', () => {
  it('returns no alerts for a calm forecast', () => {
    expect(kinds(buildForecast())).toEqual([]);
  });

  it('warns about rain with the hour it starts', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(1, 15) ? { precipitationProbability: 80 } : {}),
    });

    const [alert] = evaluateAlerts(contextFor(forecast), DEFAULT_ALERT_PREFERENCES);

    expect(alert?.kind).toBe('rain');
    expect(alert?.severity).toBe('info');
    expect(alert?.message).toContain('80 %');
    expect(alert?.message).toMatch(/desde las 3:00/);
    expect(alert?.message).not.toContain('..');
    expect(alert?.id).toBe('rain:2026-11-07');
  });

  it('ignores conditions outside the next 24 hours', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(2, 12) ? { weatherCode: 95 } : {}),
    });

    expect(kinds(forecast)).toEqual([]);
  });

  it('ignores conditions in the past', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time < NOW - 60 * 60 * 1000 ? { weatherCode: 95 } : {}),
    });

    expect(kinds(forecast)).toEqual([]);
  });

  it('drops the umbrella reminder when a storm is coming, and ranks danger first', () => {
    const forecast = buildForecast({
      hourly: (p) =>
        p.time === localTime(1, 16)
          ? { weatherCode: 95, precipitationProbability: 90, uvIndex: 0 }
          : p.time === localTime(1, 12)
            ? { uvIndex: 9 }
            : {},
    });

    expect(kinds(forecast)).toEqual(['storm', 'uv']);
  });

  it('marks tomorrow hours as such', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(2, 4) ? { temperature: 3 } : {}),
    });

    const [alert] = evaluateAlerts(contextFor(forecast), DEFAULT_ALERT_PREFERENCES);

    expect(alert?.kind).toBe('cold');
    expect(alert?.message).toMatch(/mañana desde las 4:00 a\.\s?m\. Abrígate bien\.$/);
  });

  it('raises severity for extreme heat', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(1, 14) ? { apparentTemperature: 40 } : {}),
    });

    const [alert] = evaluateAlerts(contextFor(forecast), DEFAULT_ALERT_PREFERENCES);

    expect(alert?.kind).toBe('heat');
    expect(alert?.severity).toBe('danger');
    expect(alert?.message).toContain('40°');
  });

  it('respects disabled kinds and custom thresholds', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(1, 13) ? { windGusts: 45, uvIndex: 9 } : {}),
    });
    const preferences: AlertPreferences = {
      enabled: { ...DEFAULT_ALERT_PREFERENCES.enabled, uv: false },
      thresholds: { ...DEFAULT_ALERT_PREFERENCES.thresholds, windGusts: 40 },
    };

    expect(kinds(forecast, preferences)).toEqual(['wind']);
  });

  it('formats values in the chosen units', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(1, 13) ? { windGusts: 80.5 } : {}),
    });
    const context = {
      ...contextFor(forecast),
      units: { temperature: 'fahrenheit', windSpeed: 'mph' },
    } as const;

    const [alert] = evaluateAlerts(context, DEFAULT_ALERT_PREFERENCES);

    expect(alert?.message).toContain('50 mph');
  });

  it('warns about poor air quality', () => {
    const airQuality: AirQuality = { time: NOW, usAqi: 160, pm25: 70, pm10: 90 };

    const [alert] = evaluateAlerts(
      contextFor(buildForecast(), airQuality),
      DEFAULT_ALERT_PREFERENCES,
    );

    expect(alert?.kind).toBe('air-quality');
    expect(alert?.severity).toBe('warning');
    expect(alert?.message).toContain('160');
  });
});
