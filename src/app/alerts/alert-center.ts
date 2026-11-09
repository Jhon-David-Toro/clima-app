import { Service, computed, effect, inject, signal } from '@angular/core';
import { LocationStore } from '../location/store/location-store';
import { alertNotification } from '../notifications/push/alert-notification';
import {
  NOTIFIED_ALERTS_KEY,
  notifiedKey,
  parseNotifiedAlerts,
  pruneNotified,
} from '../notifications/background/background-config';
import { BrowserNotifications } from '../notifications/push/browser-notifications';
import { SettingsStore } from '../settings/store/settings-store';
import { Clock } from '../shared/services/clock';
import { readValue, writeValue } from '../shared/storage/key-value-db';
import { ForecastStore } from '../weather/store/forecast-store';
import { evaluateAlerts } from './rules/alert-rules';
import { AlertContext } from './rules/alert-rules.types';
import { WeatherAlert } from './domain/weather-alert.types';

/** Evaluates alert rules against the live forecast and manages in-app + push notifications. */
@Service()
export class AlertCenter {
  private readonly forecastStore = inject(ForecastStore);
  private readonly location = inject(LocationStore);
  private readonly settings = inject(SettingsStore);
  private readonly clock = inject(Clock);
  private readonly notifications = inject(BrowserNotifications);
  private readonly dismissedIds = signal<ReadonlySet<string>>(new Set());

  /** Every alert for the selected place, including dismissed ones. */
  readonly alerts = computed<readonly WeatherAlert[]>(() => {
    const forecast = this.forecastStore.forecast();
    if (!forecast) return [];
    const context: AlertContext = {
      hourly: forecast.hourly,
      airQuality: this.forecastStore.airQuality(),
      timeZone: forecast.timeZone,
      now: this.clock.now(),
      units: this.settings.units(),
    };
    return evaluateAlerts(context, this.settings.alerts());
  });

  /** Alerts the person has not dismissed in the current session. */
  readonly visibleAlerts = computed(() =>
    this.alerts().filter((alert) => !this.dismissedIds().has(alert.id)),
  );

  /** `true` when the person has opted in AND the browser has granted notification permission. */
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

  /** Hides `alert` from the visible list for the current session. */
  dismiss(alert: WeatherAlert): void {
    this.dismissedIds.update((ids) => new Set(ids).add(alert.id));
  }

  /**
   * Turns notifications on, requesting browser permission when needed.
   * Returns `true` when notifications are now active.
   */
  async enableNotifications(): Promise<boolean> {
    const permission =
      this.notifications.permission() === 'granted'
        ? 'granted'
        : await this.notifications.requestPermission();
    const granted = permission === 'granted';
    this.settings.setNotifications(granted);
    return granted;
  }

  /** Turns notifications off without revoking browser permission. */
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
      await writeValue(NOTIFIED_ALERTS_KEY, { ...notified, ...Object.fromEntries(marked) });
    } catch {
      // Notifications are best effort; alerts remain visible inside the app.
    }
  }
}
