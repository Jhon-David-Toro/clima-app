import { Service, computed, effect, inject, signal } from '@angular/core';
import { AlertPreferences } from '../alerts/weather-alert';
import { BrowserStorage } from '../shared/browser-storage';
import { DisplayUnits } from '../shared/units';
import { AppSettings, Theme, normalizeSettings } from './app-settings';

const STORAGE_KEY = 'clima-app:settings';

@Service()
export class SettingsStore {
  private readonly storage = inject(BrowserStorage);
  private readonly state = signal<AppSettings>(this.storage.read(STORAGE_KEY, normalizeSettings));

  readonly settings = this.state.asReadonly();
  readonly units = computed(() => this.state().units);
  readonly alerts = computed(() => this.state().alerts);
  readonly notifications = computed(() => this.state().notifications);
  readonly theme = computed(() => this.state().theme);

  constructor() {
    effect(() => {
      this.storage.write(STORAGE_KEY, this.state());
    });
  }

  updateUnits(units: DisplayUnits): void {
    this.state.update((settings) => ({ ...settings, units }));
  }

  updateAlerts(alerts: AlertPreferences): void {
    this.state.update((settings) => ({ ...settings, alerts }));
  }

  setNotifications(notifications: boolean): void {
    this.state.update((settings) => ({ ...settings, notifications }));
  }

  setTheme(theme: Theme): void {
    this.state.update((settings) => ({ ...settings, theme }));
  }
}
