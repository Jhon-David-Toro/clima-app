import { Service, computed, effect, inject, signal } from '@angular/core';
import { LocationStore } from '../location/location-store';
import { alertNotification } from '../notifications/alert-notification';
import {
  NOTIFIED_ALERTS_KEY,
  notifiedKey,
  parseNotifiedAlerts,
  pruneNotified,
} from '../notifications/background-config';
import { BrowserNotifications } from '../notifications/browser-notifications';
import { SettingsStore } from '../settings/settings-store';
import { Clock } from '../shared/clock';
import { readValue, writeValue } from '../shared/key-value-db';
import { ForecastStore } from '../weather/forecast-store';
import { evaluateAlerts } from './alert-rules';
import { WeatherAlert } from './weather-alert';

@Service()
export class AlertCenter {
  private readonly forecastStore = inject(ForecastStore);
  private readonly location = inject(LocationStore);
  private readonly settings = inject(SettingsStore);
  private readonly clock = inject(Clock);
  private readonly notifications = inject(BrowserNotifications);
  private readonly dismissedIds = signal<ReadonlySet<string>>(new Set());

  /** Every alert for the selected place, including the ones the person dismissed. */
  readonly alerts = computed<readonly WeatherAlert[]>(() => {
    const forecast = this.forecastStore.forecast();
    if (!forecast) return [];
    return evaluateAlerts(
      {
        hourly: forecast.hourly,
        airQuality: this.forecastStore.airQuality(),
        timeZone: forecast.timeZone,
        now: this.clock.now(),
        units: this.settings.units(),
      },
      this.settings.alerts(),
    );
  });

  readonly visibleAlerts = computed(() =>
    this.alerts().filter((alert) => !this.dismissedIds().has(alert.id)),
  );

  readonly canNotify = computed(
    () => this.settings.notifications() && this.notifications.permission() === 'granted',
  );

  constructor() {
    effect(() => {
      const alerts = this.alerts();
      if (this.canNotify() && alerts.length > 0) {
        void this.notifyNew(alerts, this.location.selected().name);
      }
    });
  }

  dismiss(alert: WeatherAlert): void {
    this.dismissedIds.update((ids) => new Set(ids).add(alert.id));
  }

  /** Turns notifications on, asking for permission first. Returns whether they are active. */
  async enableNotifications(): Promise<boolean> {
    const permission =
      this.notifications.permission() === 'granted'
        ? 'granted'
        : await this.notifications.requestPermission();
    const granted = permission === 'granted';
    this.settings.setNotifications(granted);
    return granted;
  }

  disableNotifications(): void {
    this.settings.setNotifications(false);
  }

  /** The service worker shares the notified record, so an alert is never notified twice. */
  private async notifyNew(alerts: readonly WeatherAlert[], placeName: string): Promise<void> {
    try {
      const now = Date.now();
      const notified = pruneNotified(
        await readValue(NOTIFIED_ALERTS_KEY, parseNotifiedAlerts),
        now,
      );
      const fresh = alerts.filter(
        (alert) => notified[notifiedKey(placeName, alert.id)] === undefined,
      );
      for (const alert of fresh) {
        await this.notifications.show(alertNotification(alert, placeName));
      }
      const marked = fresh.map((alert) => [notifiedKey(placeName, alert.id), now] as const);
      const updated = { ...notified, ...Object.fromEntries(marked) };
      await writeValue(NOTIFIED_ALERTS_KEY, updated);
    } catch {
      // Notifications are best effort; alerts remain visible inside the app.
    }
  }
}
