/**
 * Data shared between the app and the service worker through IndexedDB, so alerts can be
 * checked in the background while the app is closed.
 */
import { isFiniteNumber, isRecord } from '../../shared/utils/type-guards';
import { normalizeSettings } from '../../settings/domain/app-settings';
import {
  BACKGROUND_CONFIG_KEY,
  NOTIFIED_ALERTS_KEY,
  NOTIFIED_RETENTION_MS,
  PERIODIC_SYNC_TAG,
} from './background-config.constants';
import { BackgroundConfig, NotifiedAlerts } from './background-config.types';

export { BACKGROUND_CONFIG_KEY, NOTIFIED_ALERTS_KEY, PERIODIC_SYNC_TAG };

/**
 * Validates stored config; units and alerts are normalised in case they come from an older version.
 * Returns `null` when the stored value is missing or structurally invalid.
 */
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

/** Parses the notified-alerts record from untrusted storage, returning an empty object on failure. */
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

/** Removes entries older than {@link NOTIFIED_RETENTION_MS} to keep the record small. */
export function pruneNotified(notified: NotifiedAlerts, now: number): NotifiedAlerts {
  return Object.fromEntries(
    Object.entries(notified).filter(([, time]) => now - time < NOTIFIED_RETENTION_MS),
  );
}
