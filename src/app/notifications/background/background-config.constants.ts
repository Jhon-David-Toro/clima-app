/** Periodic Background Sync tag registered with the service worker. */
export const PERIODIC_SYNC_TAG = 'weather-alerts';

/** IndexedDB key for the background check configuration. */
export const BACKGROUND_CONFIG_KEY = 'background-config';

/** IndexedDB key for the notified-alerts record. */
export const NOTIFIED_ALERTS_KEY = 'notified-alerts';

/** How long an alert id stays in the notified record before being pruned (2 days). */
export const NOTIFIED_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
