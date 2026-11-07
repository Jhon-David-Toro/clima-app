import { Component, computed, input } from '@angular/core';
import { Place } from '../../location/place';
import { TemperaturePipe } from '../../shared/temperature-pipe';
import { DisplayUnits } from '../../shared/units';
import { ZonedTimePipe } from '../../shared/zoned-time-pipe';
import { DailyPoint, Forecast } from '../forecast';
import { ForecastInsight } from '../forecast-insights';
import { describeWeatherCode } from '../weather-codes';
import { WeatherIcon } from '../weather-icon/weather-icon';

@Component({
  selector: 'app-current-conditions',
  imports: [TemperaturePipe, ZonedTimePipe, WeatherIcon],
  templateUrl: './current-conditions.html',
  styleUrl: './current-conditions.scss',
})
export class CurrentConditions {
  readonly place = input.required<Place>();
  readonly forecast = input.required<Forecast>();
  readonly today = input.required<DailyPoint | undefined>();
  readonly insight = input.required<ForecastInsight | null>();
  readonly units = input.required<DisplayUnits>();

  protected readonly current = computed(() => this.forecast().current);
  protected readonly conditionLabel = computed(
    () => describeWeatherCode(this.current().weatherCode).label,
  );
}
