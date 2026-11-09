import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { NotificationContent } from './alert-notification.types';
import { NotificationPermissionState } from './browser-notifications.types';

/** Wraps the browser Notifications API and tracks permission state reactively. */
@Service()
export class BrowserNotifications {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly permissionState = signal<NotificationPermissionState>(this.readPermission());

  /** Current notification permission, including `'unsupported'` for browsers without the API. */
  readonly permission = this.permissionState.asReadonly();

  /**
   * Asks the user for notification permission.
   * Must be called from a user gesture; otherwise browsers ignore or penalise the request.
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.window || !('Notification' in this.window)) {
      return 'unsupported';
    }
    const permission = await this.window.Notification.requestPermission();
    this.permissionState.set(permission);
    return permission;
  }

  /**
   * Shows a notification via the service worker, which mobile browsers require.
   * Falls back to `new Notification()` when no service worker registration is found.
   */
  async show({ title, options }: NotificationContent): Promise<void> {
    if (this.permissionState() !== 'granted' || !this.window) return;
    const { navigator } = this.window;
    const registration =
      'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration) {
      await registration.showNotification(title, options);
    } else {
      new this.window.Notification(title, options);
    }
  }

  private readPermission(): NotificationPermissionState {
    return this.window && 'Notification' in this.window
      ? this.window.Notification.permission
      : 'unsupported';
  }
}
