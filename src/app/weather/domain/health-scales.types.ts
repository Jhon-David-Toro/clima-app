/** Qualitative risk category used by UV and AQI scales. */
export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';

/** Label and risk level for a UV index or AQI reading. */
export interface ScaleReading {
  readonly label: string;
  readonly level: RiskLevel;
}
