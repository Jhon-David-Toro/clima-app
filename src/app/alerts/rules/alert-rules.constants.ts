/** How many hours ahead alert rules look when scanning the hourly forecast. */
export const ALERT_LOOKAHEAD_HOURS = 24;

/** Precipitation rate, in mm/h, that counts as heavy rain. */
export const HEAVY_RAIN_MM_PER_HOUR = 4;

/** WMO codes that represent heavy or freezing rain (intense, freezing-intense, violent shower). */
export const HEAVY_RAIN_CODES: ReadonlySet<number> = new Set([65, 67, 82]);
