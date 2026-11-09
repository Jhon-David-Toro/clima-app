import { DEFAULT_ALERT_PREFERENCES } from '../../alerts/domain/weather-alert.constants';
import { DEFAULT_UNITS } from '../../shared/utils/units.constants';
import { AppSettings, Theme } from './app-settings.types';
import { TemperatureUnit, WindSpeedUnit } from '../../shared/utils/units.types';

/** All valid theme values. */
export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Valid temperature unit values. */
export const TEMPERATURE_UNITS: readonly TemperatureUnit[] = ['celsius', 'fahrenheit'];

/** Valid wind speed unit values. */
export const WIND_SPEED_UNITS: readonly WindSpeedUnit[] = ['kmh', 'mph', 'ms'];

/** Settings applied on a first visit. */
export const DEFAULT_SETTINGS: AppSettings = {
  units: DEFAULT_UNITS,
  alerts: DEFAULT_ALERT_PREFERENCES,
  notifications: false,
  theme: 'system',
};
