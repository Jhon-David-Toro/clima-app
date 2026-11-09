import { AirQuality, HourlyPoint } from '../../weather/domain/forecast';
import { DisplayUnits } from '../../shared/utils/units.types';
import { AlertPreferences, WeatherAlert } from '../domain/weather-alert.types';

/** All data an alert rule needs to evaluate conditions. */
export interface AlertContext {
  readonly hourly: readonly HourlyPoint[];
  readonly airQuality: AirQuality | null;
  readonly timeZone: string;
  readonly now: number;
  readonly units: DisplayUnits;
}

/** First and most extreme hourly point that satisfy a predicate. */
export interface Match {
  readonly first: HourlyPoint;
  readonly peak: HourlyPoint;
}

/** A function that evaluates one alert category and returns an alert or null. */
export type Rule = (
  hours: readonly HourlyPoint[],
  preferences: AlertPreferences,
  context: AlertContext,
) => WeatherAlert | null;
