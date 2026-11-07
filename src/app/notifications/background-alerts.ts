import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';
import { LocationStore } from '../location/location-store';
import { SettingsStore } from '../settings/settings-store';
import { deleteValue, writeValue } from '../shared/key-value-db';
import { BACKGROUND_CONFIG_KEY, BackgroundConfig, PERIODIC_SYNC_TAG } from './background-config';
import { BrowserNotifications } from './browser-notifications';

/** Browsers treat this as a minimum; the real interval depends on how often the app is used. */
const MIN_SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000;

export type BackgroundCheckStatus = 'unsupported' | 'inactive' | 'active';

/**
 * Keeps the service worker informed so it can check alerts with the app closed, using
 * Periodic Background Sync where the browser supports it (Chromium, installed app).
 */
@Service()
export class BackgroundAlerts {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly location = inject(LocationStore);
  private readonly settings = inject(SettingsStore);
  private readonly notifications = inject(BrowserNotifications);
  private readonly statusState = signal<BackgroundCheckStatus>('inactive');

  readonly status = this.statusState.asReadonly();

  private readonly config = computed<BackgroundConfig | null>(() => {
    if (!this.settings.notifications() || this.notifications.permission() !== 'granted') {
      return null;
    }
    const place = this.location.selected();
    return {
      placeName: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      units: this.settings.units(),
      alerts: this.settings.alerts(),
    };
  });

  constructor() {
    effect(() => {
      const config = this.config();
      void this.sync(config);
    });
  }

  private async sync(config: BackgroundConfig | null): Promise<void> {
    try {
      if (config) {
        await writeValue(BACKGROUND_CONFIG_KEY, config);
      } else {
        await deleteValue(BACKGROUND_CONFIG_KEY);
      }
      await this.updateRegistration(config !== null);
    } catch {
      // IndexedDB or the service worker are unavailable; alerts still work while the app is open.
      this.statusState.set('unsupported');
    }
  }

  private async updateRegistration(enabled: boolean): Promise<void> {
    const navigator = this.window?.navigator;
    // `serviceWorker` is missing at runtime outside secure contexts, despite its DOM typing.
    const registration =
      navigator && 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistration()
        : undefined;
    const periodicSync = registration?.periodicSync;
    if (!periodicSync) {
      this.statusState.set('unsupported');
      return;
    }
    if (enabled) {
      await periodicSync.register(PERIODIC_SYNC_TAG, { minInterval: MIN_SYNC_INTERVAL_MS });
      this.statusState.set('active');
    } else {
      await periodicSync.unregister(PERIODIC_SYNC_TAG);
      this.statusState.set('inactive');
    }
  }
}
