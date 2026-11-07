/**
 * Data shared between the app and the service worker through IndexedDB, so alerts can be
 * checked in the background while the app is closed.
 */
import { AlertPreferences } from '../alerts/weather-alert';
import { isFiniteNumber, isRecord } from '../shared/type-guards';
import { DisplayUnits } from '../shared/units';
import { normalizeSettings } from '../settings/app-settings';

export const PERIODIC_SYNC_TAG = 'weather-alerts';
export const BACKGROUND_CONFIG_KEY = 'background-config';
export const NOTIFIED_ALERTS_KEY = 'notified-alerts';

/** Alerts stay marked as notified for two days, then the record is pruned. */
const NOTIFIED_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

export interface BackgroundConfig {
  readonly placeName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly units: DisplayUnits;
  readonly alerts: AlertPreferences;
}

/** Alert id mapped to the time it was notified. */
export type NotifiedAlerts = Readonly<Record<string, number>>;

/** Validates stored config; units and alerts are normalized in case they come from an old version. */
export function parseBackgroundConfig(value: unknown): BackgroundConfig | null {
  if (
    !isRecord(value) ||
    typeof value['placeName'] !== 'string' ||
    !isFiniteNumber(value['latitude']) ||
    !isFiniteNumber(value['longitude'])
  ) {
    return null;
  }
  const { units, alerts } = normalizeSettings({ units: value['units'], alerts: value['alerts'] });
  return {
    placeName: value['placeName'],
    latitude: value['latitude'],
    longitude: value['longitude'],
    units,
    alerts,
  };
}

export function parseNotifiedAlerts(value: unknown): NotifiedAlerts {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => isFiniteNumber(entry[1])),
  );
}

/** Alert ids repeat across places, so the record is keyed by place as well. */
export function notifiedKey(placeName: string, alertId: string): string {
  return `${placeName}|${alertId}`;
}

export function pruneNotified(notified: NotifiedAlerts, now: number): NotifiedAlerts {
  return Object.fromEntries(
    Object.entries(notified).filter(([, time]) => now - time < NOTIFIED_RETENTION_MS),
  );
}
