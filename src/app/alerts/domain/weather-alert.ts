import { SEVERITY_RANK } from './weather-alert.constants';
import { WeatherAlert } from './weather-alert.types';

/**
 * Sorts alerts by urgency (danger → warning → info) then by start time.
 * Used to order the alert list and deduplicate notifications.
 */
export function compareAlerts(a: WeatherAlert, b: WeatherAlert): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.startsAt - b.startsAt;
}
