import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AlertCenter } from '../../alerts/alert-center';
import {
  ALERT_KINDS,
  ALERT_KIND_LABELS,
  AlertKind,
  AlertThresholds,
} from '../../alerts/weather-alert';
import { BackgroundAlerts } from '../../notifications/background-alerts';
import { BrowserNotifications } from '../../notifications/browser-notifications';
import { TemperatureUnit, WindSpeedUnit } from '../../shared/units';
import { Theme } from '../app-settings';
import { SettingsStore } from '../settings-store';

interface SettingsFormValue {
  readonly temperature: TemperatureUnit;
  readonly windSpeed: WindSpeedUnit;
  readonly theme: Theme;
  readonly enabled: Record<AlertKind, boolean>;
  readonly thresholds: AlertThresholds;
}

type Controls<T> = { [K in keyof T]-?: FormControl<T[K]> };

type SettingsForm = FormGroup<{
  temperature: FormControl<TemperatureUnit>;
  windSpeed: FormControl<WindSpeedUnit>;
  theme: FormControl<Theme>;
  enabled: FormGroup<Controls<Record<AlertKind, boolean>>>;
  thresholds: FormGroup<Controls<AlertThresholds>>;
}>;

interface ThresholdField {
  readonly key: keyof AlertThresholds;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
}

const THRESHOLD_FIELDS: readonly ThresholdField[] = [
  { key: 'rainProbability', label: 'Lluvia desde', unit: '%', min: 10, max: 100 },
  { key: 'heat', label: 'Calor desde', unit: '°C', min: 20, max: 50 },
  { key: 'cold', label: 'Frío desde', unit: '°C', min: -30, max: 20 },
  { key: 'windGusts', label: 'Ráfagas desde', unit: 'km/h', min: 20, max: 150 },
  { key: 'uvIndex', label: 'UV desde', unit: '', min: 3, max: 11 },
  { key: 'usAqi', label: 'AQI desde', unit: '', min: 51, max: 300 },
];

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
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      if (this.form.valid) {
        this.saveForm();
      }
    });
  }

  open(): void {
    this.form.reset(this.formValueFromStore(), { emitEvent: false });
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
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
      const field = THRESHOLD_FIELDS.find((f) => f.key === key);
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
