import {
  ALERT_KINDS,
  AlertKind,
  AlertPreferences,
  AlertThresholds,
  DEFAULT_ALERT_PREFERENCES,
} from '../alerts/weather-alert';
import { isFiniteNumber, isOneOf, isRecord } from '../shared/type-guards';
import { DEFAULT_UNITS, DisplayUnits, TemperatureUnit, WindSpeedUnit } from '../shared/units';

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const TEMPERATURE_UNITS: readonly TemperatureUnit[] = ['celsius', 'fahrenheit'];
const WIND_SPEED_UNITS: readonly WindSpeedUnit[] = ['kmh', 'mph', 'ms'];

export interface AppSettings {
  readonly units: DisplayUnits;
  readonly alerts: AlertPreferences;
  /** Whether the person wants browser notifications, independent of the browser permission. */
  readonly notifications: boolean;
  readonly theme: Theme;
}

export const DEFAULT_SETTINGS: AppSettings = {
  units: DEFAULT_UNITS,
  alerts: DEFAULT_ALERT_PREFERENCES,
  notifications: false,
  theme: 'system',
};

function normalizeUnits(value: unknown): DisplayUnits {
  const units = isRecord(value) ? value : {};
  return {
    temperature: isOneOf(TEMPERATURE_UNITS, units['temperature'])
      ? units['temperature']
      : DEFAULT_UNITS.temperature,
    windSpeed: isOneOf(WIND_SPEED_UNITS, units['windSpeed'])
      ? units['windSpeed']
      : DEFAULT_UNITS.windSpeed,
  };
}

function normalizeAlerts(value: unknown): AlertPreferences {
  const alerts = isRecord(value) ? value : {};
  const enabled = isRecord(alerts['enabled']) ? alerts['enabled'] : {};
  const thresholds = isRecord(alerts['thresholds']) ? alerts['thresholds'] : {};
  const defaults = DEFAULT_ALERT_PREFERENCES;

  const enabledByKind = Object.fromEntries(
    ALERT_KINDS.map((kind) => {
      const stored = enabled[kind];
      return [kind, typeof stored === 'boolean' ? stored : defaults.enabled[kind]];
    }),
  ) as Record<AlertKind, boolean>;

  const thresholdKeys = Object.keys(defaults.thresholds) as (keyof AlertThresholds)[];
  const normalizedThresholds = Object.fromEntries(
    thresholdKeys.map((key) => {
      const stored = thresholds[key];
      return [key, isFiniteNumber(stored) ? stored : defaults.thresholds[key]];
    }),
  ) as Record<keyof AlertThresholds, number>;

  return { enabled: enabledByKind, thresholds: normalizedThresholds };
}

/** Rebuilds settings from untrusted data, keeping valid fields and defaulting the rest. */
export function normalizeSettings(value: unknown): AppSettings {
  const settings = isRecord(value) ? value : {};
  return {
    units: normalizeUnits(settings['units']),
    alerts: normalizeAlerts(settings['alerts']),
    notifications:
      typeof settings['notifications'] === 'boolean'
        ? settings['notifications']
        : DEFAULT_SETTINGS.notifications,
    theme: isOneOf(THEMES, settings['theme']) ? settings['theme'] : DEFAULT_SETTINGS.theme,
  };
}
