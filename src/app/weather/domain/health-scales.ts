/** Public health scales used to explain UV and air quality readings. */
import { ScaleReading } from './health-scales.types';

/**
 * Returns the WHO UV index category for a given UV index value.
 * @param uvIndex - UV index value (0–11+).
 */
export function uvCategory(uvIndex: number): ScaleReading {
  if (uvIndex < 3) return { label: 'Bajo', level: 'low' };
  if (uvIndex < 6) return { label: 'Moderado', level: 'moderate' };
  if (uvIndex < 8) return { label: 'Alto', level: 'high' };
  if (uvIndex < 11) return { label: 'Muy alto', level: 'very-high' };
  return { label: 'Extremo', level: 'extreme' };
}

/**
 * Returns the US EPA AQI category for a given US AQI value.
 * @param usAqi - US Air Quality Index value (0–500+).
 */
export function aqiCategory(usAqi: number): ScaleReading {
  if (usAqi <= 50) return { label: 'Buena', level: 'low' };
  if (usAqi <= 100) return { label: 'Moderada', level: 'moderate' };
  if (usAqi <= 150) return { label: 'Dañina para grupos sensibles', level: 'high' };
  if (usAqi <= 200) return { label: 'Dañina', level: 'very-high' };
  return { label: 'Muy dañina', level: 'extreme' };
}
