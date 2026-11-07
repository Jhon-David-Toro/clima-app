import { Component, computed, input } from '@angular/core';
import { describeWeatherCode } from '../weather-codes';

/** Weather pictogram drawn with SVG, so it scales and follows the theme colors. */
@Component({
  selector: 'app-weather-icon',
  templateUrl: './weather-icon.html',
  styleUrl: './weather-icon.scss',
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class WeatherIcon {
  readonly code = input.required<number>();
  readonly isDay = input(true);
  /** Accessible name. Leave empty when the condition is already written next to the icon. */
  readonly label = input('');

  protected readonly condition = computed(() => describeWeatherCode(this.code()).condition);
}
