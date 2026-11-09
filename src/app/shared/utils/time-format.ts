/**
 * Time formatting in the forecast location's time zone, which may differ from the device's.
 * Formatters are cached because building `Intl.DateTimeFormat` instances is expensive.
 */
import { APP_LOCALE, FORMAT_OPTIONS, MERIDIEM } from './time-format.constants';
import { TimeFormat } from './time-format.types';

/** Module-level formatter cache: keyed by `locale|timezone|optionsJson`. */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = APP_LOCALE,
): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    formatters.set(key, cached);
  }
  return cached;
}

/**
 * Formats an epoch-ms timestamp in the given time zone using a named format.
 * "a. m." / "p. m." are joined with a non-breaking space so they never wrap.
 */
export function formatZonedTime(epochMs: number, timeZone: string, format: TimeFormat): string {
  return formatter(timeZone, FORMAT_OPTIONS[format]).format(epochMs).replace(MERIDIEM, '$1. $2');
}

/**
 * Returns the local calendar date as `YYYY-MM-DD`.
 * Uses the `en-CA` locale because it formats dates in ISO order.
 */
export function toIsoDate(epochMs: number, timeZone: string): string {
  return formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA').format(
    epochMs,
  );
}
