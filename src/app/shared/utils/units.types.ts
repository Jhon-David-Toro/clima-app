/** Temperature unit choice for display. */
export type TemperatureUnit = 'celsius' | 'fahrenheit';

/** Wind speed unit choice for display. */
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms';

/** Combined unit preferences passed through the app. */
export interface DisplayUnits {
  readonly temperature: TemperatureUnit;
  readonly windSpeed: WindSpeedUnit;
}
