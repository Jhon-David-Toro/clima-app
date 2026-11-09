/** Plain-language weather advice derived from a forecast. */
export interface ForecastInsight {
  readonly headline: string;
  /** Best two-hour daylight window to be outdoors, or `null` when no window is pleasant. */
  readonly outingWindow: string | null;
}
