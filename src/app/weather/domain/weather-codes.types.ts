/** High-level sky/precipitation classification derived from a WMO code. */
export type SkyCondition =
  'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

/** Human-readable label and sky condition for a WMO weather code. */
export interface WeatherCodeInfo {
  readonly label: string;
  readonly condition: SkyCondition;
}
