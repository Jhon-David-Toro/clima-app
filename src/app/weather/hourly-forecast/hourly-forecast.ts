import { Component, computed, input } from '@angular/core';
import { TemperaturePipe } from '../../shared/pipes/temperature-pipe';
import { DisplayUnits } from '../../shared/utils/units.types';
import { ZonedTimePipe } from '../../shared/pipes/zoned-time-pipe';
import { HourlyPoint } from '../domain/forecast';
import { describeWeatherCode } from '../domain/weather-codes';
import { WeatherIcon } from '../weather-icon/weather-icon';
import { curvePoints, smoothPath } from './temperature-curve';
import { LAYOUT, MIN_VISIBLE_PROBABILITY } from './hourly-forecast.constants';

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

  /** Returns the Spanish weather description for a given hourly point. */
  protected describe(hour: HourlyPoint): string {
    return describeWeatherCode(hour.weatherCode).label;
  }
}
