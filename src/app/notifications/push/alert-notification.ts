import { WeatherAlert } from '../../alerts/domain/weather-alert.types';
import { NotificationContent } from './alert-notification.types';

/**
 * Builds a {@link NotificationContent} payload for a weather alert.
 * `onActionClick` is read by Angular's service worker, which focuses the open app
 * or launches it when the notification is tapped.
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
