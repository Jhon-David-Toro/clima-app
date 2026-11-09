import { Service, computed, effect, inject, signal } from '@angular/core';
import { AlertPreferences } from '../../alerts/domain/weather-alert.types';
import { BrowserStorage } from '../../shared/services/browser-storage';
import { DisplayUnits } from '../../shared/utils/units.types';
import { normalizeSettings } from '../domain/app-settings';
import { AppSettings, Theme } from '../domain/app-settings.types';
import { STORAGE_KEY } from './settings-store.constants';

/** Persists user settings in localStorage and exposes reactive slices. */
@Service()
export class SettingsStore {
  private readonly storage = inject(BrowserStorage);
  private readonly state = signal<AppSettings>(this.storage.read(STORAGE_KEY, normalizeSettings));

  /** Full settings snapshot. */
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
    this.state.update((s) => ({ ...s, units }));
  }

  updateAlerts(alerts: AlertPreferences): void {
    this.state.update((s) => ({ ...s, alerts }));
  }

  setNotifications(notifications: boolean): void {
    this.state.update((s) => ({ ...s, notifications }));
  }

  setTheme(theme: Theme): void {
    this.state.update((s) => ({ ...s, theme }));
  }
}
