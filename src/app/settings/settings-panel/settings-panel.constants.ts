import { ThresholdField } from './settings-panel.types';

/** Form fields for configuring alert thresholds, with their display labels and valid ranges. */
export const THRESHOLD_FIELDS: readonly ThresholdField[] = [
  { key: 'rainProbability', label: 'Lluvia desde', unit: '%', min: 10, max: 100 },
  { key: 'heat', label: 'Calor desde', unit: '°C', min: 20, max: 50 },
  { key: 'cold', label: 'Frío desde', unit: '°C', min: -30, max: 20 },
  { key: 'windGusts', label: 'Ráfagas desde', unit: 'km/h', min: 20, max: 150 },
  { key: 'uvIndex', label: 'UV desde', unit: '', min: 3, max: 11 },
  { key: 'usAqi', label: 'AQI desde', unit: '', min: 51, max: 300 },
];
