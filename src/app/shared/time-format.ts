/**
 * Time formatting in the forecast location's time zone, which may differ from the device's.
 * Formatters are cached because building `Intl.DateTimeFormat` instances is expensive.
 */

export const APP_LOCALE = 'es-CO';

export type TimeFormat = 'hour' | 'time' | 'weekday' | 'weekday-long' | 'day-month';

const FORMAT_OPTIONS: Readonly<Record<TimeFormat, Intl.DateTimeFormatOptions>> = {
  hour: { hour: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  weekday: { weekday: 'short' },
  'weekday-long': { weekday: 'long' },
  'day-month': { day: 'numeric', month: 'short' },
};

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

/** Keeps "a. m." and "p. m." together, so they never break across lines. */
const MERIDIEM = /([ap])\.\s(m\.)/g;

export function formatZonedTime(epochMs: number, timeZone: string, format: TimeFormat): string {
  return formatter(timeZone, FORMAT_OPTIONS[format])
    .format(epochMs)
    .replace(MERIDIEM, '$1.\u00a0$2');
}

/** Local calendar date as `YYYY-MM-DD`. The `en-CA` locale formats dates in that order. */
export function toIsoDate(epochMs: number, timeZone: string): string {
  return formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA').format(
    epochMs,
  );
}
