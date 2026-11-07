import { buildForecast, localTime } from '../../testing/forecast-fixtures';
import { DEFAULT_UNITS } from '../shared/units';
import { buildInsight } from './forecast-insights';

const NOW = localTime(1, 10);

describe('buildInsight', () => {
  it('suggests an umbrella before the rain starts', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time >= localTime(1, 15) ? { precipitationProbability: 70 } : {}),
    });

    const { headline } = buildInsight(forecast, NOW, DEFAULT_UNITS);

    expect(headline).toMatch(/^Lleva paraguas: lluvia probable desde las 3:00/);
  });

  it('tells when the rain should stop', () => {
    const forecast = buildForecast({
      current: { weatherCode: 63 },
      hourly: (p) =>
        p.time < localTime(1, 13) ? { weatherCode: 63, precipitationProbability: 90 } : {},
    });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).headline).toMatch(
      /^Está lloviendo\. Debería escampar hacia las 1:00/,
    );
  });

  it('warns about a storm before anything else', () => {
    const forecast = buildForecast({
      hourly: (p) =>
        p.time === localTime(1, 17) ? { weatherCode: 95 } : { precipitationProbability: 60 },
    });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).headline).toMatch(/^Tormenta probable/);
  });

  it('warns about strong sun when it stays dry', () => {
    const forecast = buildForecast({
      hourly: (p) => (p.time === localTime(1, 12) ? { uvIndex: 10 } : {}),
    });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).headline).toMatch(
      /^Sol fuerte: índice UV de 10 hacia las 12:00/,
    );
  });

  it('compares today with yesterday in the chosen unit', () => {
    const forecast = buildForecast({ daily: [{ temperatureMax: 20 }, { temperatureMax: 25 }] });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).headline).toBe(
      'Hoy hará 5° más que ayer, con máxima de 25°.',
    );
    expect(
      buildInsight(forecast, NOW, { temperature: 'fahrenheit', windSpeed: 'mph' }).headline,
    ).toBe('Hoy hará 9° más que ayer, con máxima de 77°.');
  });

  it('describes a similar day when the difference is small', () => {
    const forecast = buildForecast({ daily: [{ temperatureMax: 24 }, { temperatureMax: 25 }] });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).headline).toBe(
      'Un día parecido a ayer, con máxima de 25°.',
    );
  });

  it('finds the most pleasant daylight window to go out', () => {
    const forecast = buildForecast({
      hourly: (p) =>
        p.time === localTime(1, 14) || p.time === localTime(1, 15)
          ? { apparentTemperature: 21, uvIndex: 2 }
          : { apparentTemperature: 27 },
    });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).outingWindow).toMatch(
      /^Mejor momento para salir: de 2 p\.\s?m\. a 4 p\.\s?m\.$/,
    );
  });

  it('offers no window when every hour is unpleasant', () => {
    const forecast = buildForecast({ hourly: () => ({ precipitationProbability: 90 }) });

    expect(buildInsight(forecast, NOW, DEFAULT_UNITS).outingWindow).toBeNull();
  });
});
