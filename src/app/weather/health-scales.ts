/** Public health scales used to explain UV and air quality readings. */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';

export interface ScaleReading {
  readonly label: string;
  readonly level: RiskLevel;
}

/** WHO UV index categories. */
export function uvCategory(uvIndex: number): ScaleReading {
  if (uvIndex < 3) return { label: 'Bajo', level: 'low' };
  if (uvIndex < 6) return { label: 'Moderado', level: 'moderate' };
  if (uvIndex < 8) return { label: 'Alto', level: 'high' };
  if (uvIndex < 11) return { label: 'Muy alto', level: 'very-high' };
  return { label: 'Extremo', level: 'extreme' };
}

/** US EPA Air Quality Index categories. */
export function aqiCategory(usAqi: number): ScaleReading {
  if (usAqi <= 50) return { label: 'Buena', level: 'low' };
  if (usAqi <= 100) return { label: 'Moderada', level: 'moderate' };
  if (usAqi <= 150) return { label: 'Dañina para grupos sensibles', level: 'high' };
  if (usAqi <= 200) return { label: 'Dañina', level: 'very-high' };
  return { label: 'Muy dañina', level: 'extreme' };
}
