import { EpochMs } from '../../weather/domain/forecast';

/** All supported alert categories. */
export type AlertKind =
  'storm' | 'heavy-rain' | 'rain' | 'heat' | 'cold' | 'uv' | 'wind' | 'air-quality';

/** How urgent an alert is. Controls color-coding and sort order. */
export type AlertSeverity = 'info' | 'warning' | 'danger';

/** A single actionable alert with a human-readable message. */
export interface WeatherAlert {
  /** Stable per kind and local day, so the same alert is notified only once. */
  readonly id: string;
  readonly kind: AlertKind;
  readonly severity: AlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly startsAt: EpochMs;
}

/** Minimum values that trigger each alert category. */
export interface AlertThresholds {
  /** Minimum precipitation probability, in percent. */
  readonly rainProbability: number;
  /** Minimum apparent temperature, in °C. */
  readonly heat: number;
  /** Maximum temperature, in °C. */
  readonly cold: number;
  /** Minimum wind gust speed, in km/h. */
  readonly windGusts: number;
  readonly uvIndex: number;
  readonly usAqi: number;
}

/** Which alert kinds are on and what thresholds they use. */
export interface AlertPreferences {
  readonly enabled: Readonly<Record<AlertKind, boolean>>;
  readonly thresholds: AlertThresholds;
}
