import { DisplayUnits, WindSpeedUnit } from './units.types';

/** Metric defaults shown on a first visit. */
export const DEFAULT_UNITS: DisplayUnits = { temperature: 'celsius', windSpeed: 'kmh' };

/** Abbreviated unit label for each wind speed unit. */
export const WIND_SPEED_LABELS: Readonly<Record<WindSpeedUnit, string>> = {
  kmh: 'km/h',
  mph: 'mph',
  ms: 'm/s',
};

/** Spanish compass-point abbreviations, clockwise from north. */
export const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
