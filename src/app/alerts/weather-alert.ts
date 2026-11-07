import { EpochMs } from '../weather/forecast';

export const ALERT_KINDS = [
  'storm',
  'heavy-rain',
  'rain',
  'heat',
  'cold',
  'uv',
  'wind',
  'air-quality',
] as const;

export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface WeatherAlert {
  /** Stable per kind and local day, so the same alert is notified only once. */
  readonly id: string;
  readonly kind: AlertKind;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly startsAt: EpochMs;
}

export interface AlertThresholds {
  /** Minimum precipitation probability, in percent. */
  readonly rainProbability: number;
  /** Minimum apparent temperature, in °C. */
  readonly heat: number;
  /** Maximum temperature, in °C. */
  readonly cold: number;
  /** Minimum wind gust speed, in km/h. */
  readonly windGusts: number;
  readonly uvIndex: number;
  readonly usAqi: number;
}

export interface AlertPreferences {
  readonly enabled: Readonly<Record<AlertKind, boolean>>;
  readonly thresholds: AlertThresholds;
}

export const ALERT_KIND_LABELS: Readonly<Record<AlertKind, string>> = {
  storm: 'Tormentas eléctricas',
  'heavy-rain': 'Lluvia fuerte',
  rain: 'Probabilidad de lluvia',
  heat: 'Calor intenso',
  cold: 'Frío',
  uv: 'Índice UV alto',
  wind: 'Ráfagas de viento',
  'air-quality': 'Calidad del aire',
};

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enabled: {
    storm: true,
    'heavy-rain': true,
    rain: true,
    heat: true,
    cold: true,
    uv: true,
    wind: true,
    'air-quality': true,
  },
  thresholds: {
    rainProbability: 60,
    heat: 32,
    cold: 5,
    windGusts: 50,
    uvIndex: 8,
    usAqi: 101,
  },
};

const SEVERITY_RANK: Readonly<Record<AlertSeverity, number>> = { danger: 0, warning: 1, info: 2 };

export function compareAlerts(a: WeatherAlert, b: WeatherAlert): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.startsAt - b.startsAt;
}
