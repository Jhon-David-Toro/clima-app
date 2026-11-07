/** Plain-language advice derived from a forecast: what someone should know before going out. */
import { DailyPoint, Forecast, HourlyPoint } from './forecast';
import { upcomingHours } from './forecast-mapper';
import { isStormCode, isWetCode } from './weather-codes';
import { endSentence } from '../shared/sentence';
import { formatZonedTime, toIsoDate } from '../shared/time-format';
import { DisplayUnits, convertTemperatureDelta, formatTemperature } from '../shared/units';

export interface ForecastInsight {
  readonly headline: string;
  /** Best two-hour daylight window to be outdoors, or `null` when no window is pleasant. */
  readonly outingWindow: string | null;
}

const HORIZON_HOURS = 12;
const OUTING_HORIZON_HOURS = 14;
const OUTING_WINDOW_HOURS = 2;
const RAIN_PROBABILITY = 50;
const DRY_PROBABILITY = 30;
const STRONG_SUN_UV = 8;
const NOTABLE_DIFFERENCE = 2;
const MAX_PLEASANT_SCORE = 60;
const IDEAL_APPARENT_TEMPERATURE = 21;

function dayAt(forecast: Forecast, offsetDays: number, now: number): DailyPoint | undefined {
  const today = toIsoDate(now, forecast.timeZone);
  const index = forecast.daily.findIndex((day) => day.date === today);
  return index === -1 ? undefined : forecast.daily[index + offsetDays];
}

function clock(time: number, forecast: Forecast): string {
  return formatZonedTime(time, forecast.timeZone, 'time');
}

function rainHeadline(hours: readonly HourlyPoint[], forecast: Forecast): string | null {
  const storm = hours.find((p) => isStormCode(p.weatherCode));
  if (storm) {
    return endSentence(`Tormenta probable desde las ${clock(storm.time, forecast)}`);
  }
  if (isWetCode(forecast.current.weatherCode)) {
    const dry = hours.find(
      (p) => p.precipitationProbability < DRY_PROBABILITY && !isWetCode(p.weatherCode),
    );
    return dry
      ? endSentence(`Está lloviendo. Debería escampar hacia las ${clock(dry.time, forecast)}`)
      : 'Está lloviendo y seguirá así las próximas horas.';
  }
  const rain = hours.find((p) => p.precipitationProbability >= RAIN_PROBABILITY);
  return rain
    ? endSentence(`Lleva paraguas: lluvia probable desde las ${clock(rain.time, forecast)}`)
    : null;
}

function sunHeadline(hours: readonly HourlyPoint[], forecast: Forecast): string | null {
  const daylight = hours.filter((p) => p.isDay);
  const [firstDaylight] = daylight;
  if (!firstDaylight) return null;
  const peak = daylight.reduce((best, p) => (p.uvIndex > best.uvIndex ? p : best), firstDaylight);
  return peak.uvIndex >= STRONG_SUN_UV
    ? endSentence(
        `Sol fuerte: índice UV de ${Math.round(peak.uvIndex)} hacia las ${clock(peak.time, forecast)}`,
      )
    : null;
}

function comparisonHeadline(forecast: Forecast, now: number, units: DisplayUnits): string {
  const today = dayAt(forecast, 0, now);
  const yesterday = dayAt(forecast, -1, now);
  if (!today) {
    return `${formatTemperature(forecast.current.temperature, units.temperature)} ahora mismo.`;
  }
  const max = formatTemperature(today.temperatureMax, units.temperature);
  if (!yesterday) {
    return `Máxima de ${max} para hoy.`;
  }
  const difference = today.temperatureMax - yesterday.temperatureMax;
  const degrees = Math.round(Math.abs(convertTemperatureDelta(difference, units.temperature)));
  if (difference >= NOTABLE_DIFFERENCE) {
    return `Hoy hará ${degrees}° más que ayer, con máxima de ${max}.`;
  }
  if (difference <= -NOTABLE_DIFFERENCE) {
    return `Hoy estará ${degrees}° más fresco que ayer, con máxima de ${max}.`;
  }
  return `Un día parecido a ayer, con máxima de ${max}.`;
}

/** Lower is better: penalizes rain, strong sun and temperatures far from comfortable. */
function outingScore(point: HourlyPoint): number {
  return (
    point.precipitationProbability +
    Math.max(0, point.uvIndex - 5) * 8 +
    Math.abs(point.apparentTemperature - IDEAL_APPARENT_TEMPERATURE) * 2 +
    (isWetCode(point.weatherCode) ? 40 : 0)
  );
}

function outingWindow(hours: readonly HourlyPoint[], forecast: Forecast): string | null {
  let best: { start: HourlyPoint; end: HourlyPoint; score: number } | null = null;

  for (let i = 0; i + OUTING_WINDOW_HOURS <= hours.length; i++) {
    const window = hours.slice(i, i + OUTING_WINDOW_HOURS);
    const start = window[0];
    const end = window[window.length - 1];
    if (!start || !end || !window.every((p) => p.isDay)) continue;
    const score = Math.max(...window.map(outingScore));
    if (!best || score < best.score) {
      best = { start, end, score };
    }
  }

  if (!best || best.score > MAX_PLEASANT_SCORE) {
    return null;
  }
  const hourMs = 60 * 60 * 1000;
  const from = formatZonedTime(best.start.time, forecast.timeZone, 'hour');
  const to = formatZonedTime(best.end.time + hourMs, forecast.timeZone, 'hour');
  return endSentence(`Mejor momento para salir: de ${from} a ${to}`);
}

export function buildInsight(
  forecast: Forecast,
  now: number,
  units: DisplayUnits,
): ForecastInsight {
  const hours = upcomingHours(forecast.hourly, now, HORIZON_HOURS);
  const headline =
    rainHeadline(hours, forecast) ??
    sunHeadline(hours, forecast) ??
    comparisonHeadline(forecast, now, units);
  const outing = outingWindow(upcomingHours(forecast.hourly, now, OUTING_HORIZON_HOURS), forecast);
  return { headline, outingWindow: outing };
}
