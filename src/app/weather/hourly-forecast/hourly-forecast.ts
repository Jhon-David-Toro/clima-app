import { Component, computed, input } from '@angular/core';
import { TemperaturePipe } from '../../shared/temperature-pipe';
import { DisplayUnits } from '../../shared/units';
import { ZonedTimePipe } from '../../shared/zoned-time-pipe';
import { HourlyPoint } from '../forecast';
import { describeWeatherCode } from '../weather-codes';
import { WeatherIcon } from '../weather-icon/weather-icon';
import { CurveLayout, curvePoints, smoothPath } from './temperature-curve';

const LAYOUT: CurveLayout = { columnWidth: 64, height: 56, padding: 8 };
/** Below this probability, showing a percentage is noise. */
const MIN_VISIBLE_PROBABILITY = 20;

@Component({
  selector: 'app-hourly-forecast',
  imports: [TemperaturePipe, ZonedTimePipe, WeatherIcon],
  templateUrl: './hourly-forecast.html',
  styleUrl: './hourly-forecast.scss',
})
export class HourlyForecast {
  readonly hours = input.required<readonly HourlyPoint[]>();
  readonly timeZone = input.required<string>();
  readonly units = input.required<DisplayUnits>();

  protected readonly layout = LAYOUT;
  protected readonly minVisibleProbability = MIN_VISIBLE_PROBABILITY;

  protected readonly points = computed(() =>
    curvePoints(
      this.hours().map((hour) => hour.temperature),
      LAYOUT,
    ),
  );
  protected readonly path = computed(() => smoothPath(this.points()));
  protected readonly width = computed(() => this.hours().length * LAYOUT.columnWidth);

  protected describe(hour: HourlyPoint): string {
    return describeWeatherCode(hour.weatherCode).label;
  }
}
