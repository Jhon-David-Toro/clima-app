import { AlertPreferences } from '../../alerts/domain/weather-alert.types';
import { DisplayUnits } from '../../shared/utils/units.types';

/** Available UI themes. */
export type Theme = 'system' | 'light' | 'dark';

/** Full user-configurable settings stored in localStorage. */
export interface AppSettings {
  readonly units: DisplayUnits;
  readonly alerts: AlertPreferences;
  /** Whether the person wants browser notifications, independent of the browser permission. */
  readonly notifications: boolean;
  readonly theme: Theme;
}
