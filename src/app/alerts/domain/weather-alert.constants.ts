import { AlertKind, AlertPreferences, AlertSeverity } from './weather-alert.types';

/** Ordered list of all supported alert kinds. */
export const ALERT_KINDS: readonly AlertKind[] = [
  'storm',
  'heavy-rain',
  'rain',
  'heat',
  'cold',
  'uv',
  'wind',
  'air-quality',
];

/** Spanish display label for each alert kind. */
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

/** Thresholds and enabled flags used on a first visit. */
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

/** Numeric rank for sorting: lower is more urgent. */
export const SEVERITY_RANK: Readonly<Record<AlertSeverity, number>> = {
  danger: 0,
  warning: 1,
  info: 2,
};
