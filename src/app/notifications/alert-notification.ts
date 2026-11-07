import { WeatherAlert } from '../alerts/weather-alert';

export interface NotificationContent {
  readonly title: string;
  readonly options: NotificationOptions;
}

/**
 * Builds the notification for an alert. `onActionClick` is read by Angular's service worker,
 * which focuses the open app or opens it when the notification is clicked.
 */
export function alertNotification(alert: WeatherAlert, placeName: string): NotificationContent {
  return {
    title: `${alert.title} en ${placeName}`,
    options: {
      body: alert.message,
      tag: alert.id,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/badge-72x72.png',
      lang: 'es',
      data: {
        onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: './' } },
      },
    },
  };
}
