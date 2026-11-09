import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AlertCenter } from '../../alerts/alert-center';
import { ALERT_KINDS, ALERT_KIND_LABELS } from '../../alerts/domain/weather-alert.constants';
import { AlertThresholds } from '../../alerts/domain/weather-alert.types';
import { BackgroundAlerts } from '../../notifications/background/background-alerts';
import { BrowserNotifications } from '../../notifications/push/browser-notifications';
import { TemperatureUnit, WindSpeedUnit } from '../../shared/utils/units.types';
import { Theme } from '../domain/app-settings.types';
import { SettingsStore } from '../store/settings-store';
import { THRESHOLD_FIELDS } from './settings-panel.constants';
import { SettingsForm, SettingsFormValue } from './settings-panel.types';

@Component({
  selector: 'app-settings-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  private readonly store = inject(SettingsStore);
  private readonly alertCenter = inject(AlertCenter);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly notificationPermission = inject(BrowserNotifications).permission;
  protected readonly backgroundStatus = inject(BackgroundAlerts).status;
  protected readonly notificationsEnabled = this.alertCenter.canNotify;
  protected readonly alertKinds = ALERT_KINDS;
  protected readonly alertLabels = ALERT_KIND_LABELS;
  protected readonly thresholdFields = THRESHOLD_FIELDS;

  protected readonly form = this.createForm();

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.valid) this.saveForm();
    });
  }

  /** Opens the settings dialog, resetting the form to the current store state. */
  open(): void {
    this.form.reset(this.formValueFromStore(), { emitEvent: false });
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  protected async toggleNotifications(): Promise<void> {
    if (this.notificationsEnabled()) {
      this.alertCenter.disableNotifications();
    } else {
      await this.alertCenter.enableNotifications();
    }
  }

  private createForm(): SettingsForm {
    const { units, alerts, theme } = this.store.settings();
    const fb = this.formBuilder;
    const threshold = (key: keyof AlertThresholds): FormControl<number> => {
      const field = THRESHOLD_FIELDS.find((fieldDef) => fieldDef.key === key);
      return fb.control(alerts.thresholds[key], [
        Validators.required,
        Validators.min(field?.min ?? -Infinity),
        Validators.max(field?.max ?? Infinity),
      ]);
    };
    return fb.group({
      temperature: fb.control<TemperatureUnit>(units.temperature),
      windSpeed: fb.control<WindSpeedUnit>(units.windSpeed),
      theme: fb.control<Theme>(theme),
      enabled: fb.group({
        storm: fb.control(alerts.enabled.storm),
        'heavy-rain': fb.control(alerts.enabled['heavy-rain']),
        rain: fb.control(alerts.enabled.rain),
        heat: fb.control(alerts.enabled.heat),
        cold: fb.control(alerts.enabled.cold),
        uv: fb.control(alerts.enabled.uv),
        wind: fb.control(alerts.enabled.wind),
        'air-quality': fb.control(alerts.enabled['air-quality']),
      }),
      thresholds: fb.group({
        rainProbability: threshold('rainProbability'),
        heat: threshold('heat'),
        cold: threshold('cold'),
        windGusts: threshold('windGusts'),
        uvIndex: threshold('uvIndex'),
        usAqi: threshold('usAqi'),
      }),
    });
  }

  private formValueFromStore(): SettingsFormValue {
    const { units, alerts, theme } = this.store.settings();
    return {
      temperature: units.temperature,
      windSpeed: units.windSpeed,
      theme,
      enabled: { ...alerts.enabled },
      thresholds: { ...alerts.thresholds },
    };
  }

  private saveForm(): void {
    const value = this.form.getRawValue();
    this.store.updateUnits({ temperature: value.temperature, windSpeed: value.windSpeed });
    this.store.setTheme(value.theme);
    this.store.updateAlerts({ enabled: value.enabled, thresholds: value.thresholds });
  }
}
