import { ALERT_KINDS } from '../../alerts/domain/weather-alert.constants';
import {
  AlertKind,
  AlertPreferences,
  AlertThresholds,
} from '../../alerts/domain/weather-alert.types';
import { isFiniteNumber, isOneOf, isRecord } from '../../shared/utils/type-guards';
import { DEFAULT_UNITS } from '../../shared/utils/units.constants';
import { DisplayUnits } from '../../shared/utils/units.types';
import {
  DEFAULT_SETTINGS,
  TEMPERATURE_UNITS,
  THEMES,
  WIND_SPEED_UNITS,
} from './app-settings.constants';
import { AppSettings } from './app-settings.types';

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
  const defaults = DEFAULT_SETTINGS.alerts;

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

/**
 * Rebuilds {@link AppSettings} from untrusted data (storage, URL params),
 * keeping valid fields and defaulting anything invalid or missing.
 */
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
