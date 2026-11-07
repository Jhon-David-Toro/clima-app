import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { NotificationContent } from './alert-notification';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

@Service()
export class BrowserNotifications {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly permissionState = signal<NotificationPermissionState>(this.readPermission());

  readonly permission = this.permissionState.asReadonly();

  /** Must run from a user gesture, otherwise browsers ignore or penalize the request. */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.window || !('Notification' in this.window)) {
      return 'unsupported';
    }
    const permission = await this.window.Notification.requestPermission();
    this.permissionState.set(permission);
    return permission;
  }

  /** Shows a notification through the service worker, which mobile browsers require. */
  async show({ title, options }: NotificationContent): Promise<void> {
    if (this.permissionState() !== 'granted' || !this.window) {
      return;
    }
    const { navigator } = this.window;
    // `serviceWorker` is missing at runtime outside secure contexts, despite its DOM typing.
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
