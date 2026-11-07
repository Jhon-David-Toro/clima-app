/**
 * Turns a forecast into actionable alerts. Pure functions without Angular dependencies, shared
 * by the app and the background service worker.
 */
import { AirQuality, HourlyPoint } from '../weather/forecast';
import { upcomingHours } from '../weather/forecast-mapper';
import { aqiCategory } from '../weather/health-scales';
import { isStormCode } from '../weather/weather-codes';
import { endSentence } from '../shared/sentence';
import { formatZonedTime, toIsoDate } from '../shared/time-format';
import { DisplayUnits, formatTemperature, formatWindSpeed } from '../shared/units';
import {
  AlertKind,
  AlertPreferences,
  AlertSeverity,
  WeatherAlert,
  compareAlerts,
} from './weather-alert';

export interface AlertContext {
  readonly hourly: readonly HourlyPoint[];
  readonly airQuality: AirQuality | null;
  readonly timeZone: string;
  readonly now: number;
  readonly units: DisplayUnits;
}

/** Hours ahead that the rules look at. */
export const ALERT_LOOKAHEAD_HOURS = 24;

/** Precipitation rate, in mm/h, that counts as heavy rain. */
const HEAVY_RAIN_MM_PER_HOUR = 4;
const HEAVY_RAIN_CODES: ReadonlySet<number> = new Set([65, 67, 82]);

interface Match {
  readonly first: HourlyPoint;
  readonly peak: HourlyPoint;
}

/** First and most extreme point that satisfy `predicate`, ranked by `measure`. */
function findMatch(
  hours: readonly HourlyPoint[],
  predicate: (point: HourlyPoint) => boolean,
  measure: (point: HourlyPoint) => number,
): Match | null {
  const matches = hours.filter(predicate);
  const [first] = matches;
  if (!first) {
    return null;
  }
  const peak = matches.reduce((best, point) => (measure(point) > measure(best) ? point : best));
  return { first, peak };
}

function describeStart(time: number, context: AlertContext): string {
  const { now, timeZone } = context;
  if (time <= now) {
    return 'desde ahora';
  }
  const clock = formatZonedTime(time, timeZone, 'time');
  return toIsoDate(time, timeZone) === toIsoDate(now, timeZone)
    ? `desde las ${clock}`
    : `mañana desde las ${clock}`;
}

/** Start time closing a sentence, without a double period after "p. m.". */
function startSentence(time: number, context: AlertContext): string {
  return endSentence(describeStart(time, context));
}

function createAlert(
  kind: AlertKind,
  severity: AlertSeverity,
  startsAt: number,
  title: string,
  message: string,
  context: AlertContext,
): WeatherAlert {
  return {
    id: `${kind}:${toIsoDate(startsAt, context.timeZone)}`,
    kind,
    severity,
    title,
    message,
    startsAt,
  };
}

type Rule = (
  hours: readonly HourlyPoint[],
  preferences: AlertPreferences,
  context: AlertContext,
) => WeatherAlert | null;

const stormRule: Rule = (hours, _preferences, context) => {
  const match = findMatch(
    hours,
    (p) => isStormCode(p.weatherCode),
    (p) => p.weatherCode,
  );
  if (!match) return null;
  return createAlert(
    'storm',
    'danger',
    match.first.time,
    'Tormenta eléctrica',
    `Probable ${startSentence(match.first.time, context)} Evita zonas abiertas y desconecta equipos.`,
    context,
  );
};

const heavyRainRule: Rule = (hours, _preferences, context) => {
  const match = findMatch(
    hours,
    (p) => p.precipitation >= HEAVY_RAIN_MM_PER_HOUR || HEAVY_RAIN_CODES.has(p.weatherCode),
    (p) => p.precipitation,
  );
  if (!match) return null;
  const amount = Math.round(match.peak.precipitation);
  return createAlert(
    'heavy-rain',
    'warning',
    match.first.time,
    'Lluvia fuerte',
    `Hasta ${amount} mm por hora ${startSentence(match.first.time, context)} Ojo con calles inundadas.`,
    context,
  );
};

const rainRule: Rule = (hours, { thresholds }, context) => {
  const match = findMatch(
    hours,
    (p) => p.precipitationProbability >= thresholds.rainProbability,
    (p) => p.precipitationProbability,
  );
  if (!match) return null;
  return createAlert(
    'rain',
    'info',
    match.first.time,
    'Lleva paraguas',
    `${match.peak.precipitationProbability} % de probabilidad de lluvia ${startSentence(match.first.time, context)}`,
    context,
  );
};

const heatRule: Rule = (hours, { thresholds }, context) => {
  const match = findMatch(
    hours,
    (p) => p.apparentTemperature >= thresholds.heat,
    (p) => p.apparentTemperature,
  );
  if (!match) return null;
  const peak = match.peak.apparentTemperature;
  return createAlert(
    'heat',
    peak >= thresholds.heat + 5 ? 'danger' : 'warning',
    match.first.time,
    'Calor intenso',
    `Sensación térmica de hasta ${formatTemperature(peak, context.units.temperature)} ${startSentence(match.first.time, context)} Hidrátate y busca sombra.`,
    context,
  );
};

const coldRule: Rule = (hours, { thresholds }, context) => {
  const match = findMatch(
    hours,
    (p) => p.temperature <= thresholds.cold,
    (p) => -p.temperature,
  );
  if (!match) return null;
  return createAlert(
    'cold',
    match.peak.temperature <= 0 ? 'danger' : 'warning',
    match.first.time,
    'Frío',
    `Temperatura de hasta ${formatTemperature(match.peak.temperature, context.units.temperature)} ${startSentence(match.first.time, context)} Abrígate bien.`,
    context,
  );
};

const uvRule: Rule = (hours, { thresholds }, context) => {
  const match = findMatch(
    hours,
    (p) => p.uvIndex >= thresholds.uvIndex,
    (p) => p.uvIndex,
  );
  if (!match) return null;
  const peak = Math.round(match.peak.uvIndex);
  return createAlert(
    'uv',
    peak >= 11 ? 'danger' : 'warning',
    match.first.time,
    peak >= 11 ? 'Índice UV extremo' : 'Índice UV alto',
    `Llegará a ${peak} ${startSentence(match.first.time, context)} Usa protector solar y gafas.`,
    context,
  );
};

const windRule: Rule = (hours, { thresholds }, context) => {
  const match = findMatch(
    hours,
    (p) => p.windGusts >= thresholds.windGusts,
    (p) => p.windGusts,
  );
  if (!match) return null;
  const peak = match.peak.windGusts;
  return createAlert(
    'wind',
    peak >= thresholds.windGusts * 1.5 ? 'danger' : 'warning',
    match.first.time,
    'Ráfagas fuertes',
    `Hasta ${formatWindSpeed(peak, context.units.windSpeed)} ${startSentence(match.first.time, context)} Asegura objetos sueltos.`,
    context,
  );
};

function airQualityAlert(
  preferences: AlertPreferences,
  context: AlertContext,
): WeatherAlert | null {
  const { airQuality } = context;
  if (!airQuality || airQuality.usAqi < preferences.thresholds.usAqi) {
    return null;
  }
  const aqi = Math.round(airQuality.usAqi);
  const category = aqiCategory(aqi).label.toLowerCase();
  return createAlert(
    'air-quality',
    aqi > 200 ? 'danger' : 'warning',
    airQuality.time,
    'Aire de mala calidad',
    `Índice ${aqi}, calidad ${category}. Reduce el ejercicio al aire libre.`,
    context,
  );
}

const HOURLY_RULES: readonly (readonly [AlertKind, Rule])[] = [
  ['storm', stormRule],
  ['heavy-rain', heavyRainRule],
  ['rain', rainRule],
  ['heat', heatRule],
  ['cold', coldRule],
  ['uv', uvRule],
  ['wind', windRule],
];

export function evaluateAlerts(
  context: AlertContext,
  preferences: AlertPreferences,
): WeatherAlert[] {
  const hours = upcomingHours(context.hourly, context.now, ALERT_LOOKAHEAD_HOURS);
  const alerts: WeatherAlert[] = [];

  for (const [kind, rule] of HOURLY_RULES) {
    if (!preferences.enabled[kind]) continue;
    const alert = rule(hours, preferences, context);
    if (alert) alerts.push(alert);
  }
  if (preferences.enabled['air-quality']) {
    const alert = airQualityAlert(preferences, context);
    if (alert) alerts.push(alert);
  }

  return withoutRedundantRain(alerts).sort(compareAlerts);
}

/** "Bring an umbrella" adds nothing when a storm or heavy rain alert is already shown. */
function withoutRedundantRain(alerts: WeatherAlert[]): WeatherAlert[] {
  const hasStrongerRain = alerts.some((a) => a.kind === 'storm' || a.kind === 'heavy-rain');
  return hasStrongerRain ? alerts.filter((a) => a.kind !== 'rain') : alerts;
}
