import { FormControl, FormGroup } from '@angular/forms';
import { AlertKind, AlertThresholds } from '../../alerts/domain/weather-alert.types';
import { TemperatureUnit, WindSpeedUnit } from '../../shared/utils/units.types';
import { Theme } from '../domain/app-settings.types';

export interface SettingsFormValue {
  readonly temperature: TemperatureUnit;
  readonly windSpeed: WindSpeedUnit;
  readonly theme: Theme;
  readonly enabled: Record<AlertKind, boolean>;
  readonly thresholds: AlertThresholds;
}

export type Controls<T> = { [K in keyof T]-?: FormControl<T[K]> };

export type SettingsForm = FormGroup<{
  temperature: FormControl<TemperatureUnit>;
  windSpeed: FormControl<WindSpeedUnit>;
  theme: FormControl<Theme>;
  enabled: FormGroup<Controls<Record<AlertKind, boolean>>>;
  thresholds: FormGroup<Controls<AlertThresholds>>;
}>;

/** Metadata for a numeric alert threshold field in the settings form. */
export interface ThresholdField {
  readonly key: keyof AlertThresholds;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
}
