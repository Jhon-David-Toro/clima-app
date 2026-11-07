import { Component, DOCUMENT, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertCenter } from './alerts/alert-center';
import { BackgroundAlerts } from './notifications/background-alerts';
import { AppUpdates } from './pwa/app-updates';
import { SettingsStore } from './settings/settings-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly settings = inject(SettingsStore);

  protected readonly updates = inject(AppUpdates);

  constructor() {
    // Created eagerly so alerts are notified and synced even before their panel renders.
    inject(AlertCenter);
    inject(BackgroundAlerts);

    effect(() => {
      const theme = this.settings.theme();
      if (theme === 'system') {
        delete this.root.dataset['theme'];
      } else {
        this.root.dataset['theme'] = theme;
      }
    });
  }
}
