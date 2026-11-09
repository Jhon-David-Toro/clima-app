import { AlertSeverity } from '../domain/weather-alert.types';

/** Spanish label displayed for each severity level. */
export const SEVERITY_LABELS: Readonly<Record<AlertSeverity, string>> = {
  danger: 'Peligro',
  warning: 'Precaución',
  info: 'Aviso',
};
