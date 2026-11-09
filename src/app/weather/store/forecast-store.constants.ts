/** Forecasts update hourly at the source, so refreshing more often only wastes requests. */
export const REFRESH_INTERVAL_MS = 15 * 60_000;

/** Age threshold after which a cached forecast is refreshed when the tab becomes visible. */
export const STALE_AFTER_MS = 10 * 60_000;
