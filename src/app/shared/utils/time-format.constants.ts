import { TimeFormat } from './time-format.types';

/** BCP 47 locale used throughout the app. */
export const APP_LOCALE = 'es-CO';

/** `Intl.DateTimeFormat` options for each named format. */
export const FORMAT_OPTIONS: Readonly<Record<TimeFormat, Intl.DateTimeFormatOptions>> = {
  hour: { hour: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  weekday: { weekday: 'short' },
  'weekday-long': { weekday: 'long' },
  'day-month': { day: 'numeric', month: 'short' },
};

/** Keeps "a. m." and "p. m." together so they never break across lines. */
export const MERIDIEM = /([ap])\.\s(m\.)/g;
