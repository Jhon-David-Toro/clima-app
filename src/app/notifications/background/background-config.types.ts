import { AlertPreferences } from '../../alerts/domain/weather-alert.types';
import { DisplayUnits } from '../../shared/utils/units.types';

/** Config written to IndexedDB so the service worker can run alert checks while the app is closed. */
export interface BackgroundConfig {
  readonly placeName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly units: DisplayUnits;
  readonly alerts: AlertPreferences;
}

/** Alert id mapped to the epoch-ms timestamp it was notified. */
export type NotifiedAlerts = Readonly<Record<string, number>>;
