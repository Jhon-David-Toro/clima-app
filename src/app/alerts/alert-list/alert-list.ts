import { Component, computed, inject, signal } from '@angular/core';
import { BrowserNotifications } from '../../notifications/browser-notifications';
import { AlertCenter } from '../alert-center';
import { AlertSeverity, WeatherAlert } from '../weather-alert';

const SEVERITY_LABELS: Readonly<Record<AlertSeverity, string>> = {
  danger: 'Peligro',
  warning: 'Precaución',
  info: 'Aviso',
};

@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.scss',
})
export class AlertList {
  private readonly alertCenter = inject(AlertCenter);
  private readonly notifications = inject(BrowserNotifications);

  protected readonly alerts = this.alertCenter.visibleAlerts;
  protected readonly hiddenCount = computed(
    () => this.alertCenter.alerts().length - this.alerts().length,
  );
  protected readonly severityLabels = SEVERITY_LABELS;
  protected readonly isEnabling = signal(false);

  protected readonly notificationState = computed(() => {
    const permission = this.notifications.permission();
    if (permission === 'unsupported') return 'unsupported';
    if (permission === 'denied') return 'blocked';
    return this.alertCenter.canNotify() ? 'active' : 'available';
  });

  protected dismiss(alert: WeatherAlert): void {
    this.alertCenter.dismiss(alert);
  }

  protected async enableNotifications(): Promise<void> {
    this.isEnabling.set(true);
    try {
      await this.alertCenter.enableNotifications();
    } finally {
      this.isEnabling.set(false);
    }
  }
}
