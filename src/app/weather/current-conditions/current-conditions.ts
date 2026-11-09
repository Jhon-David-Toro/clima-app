import { Component, computed, input } from '@angular/core';
import { Place } from '../../location/place/place.types';
import { TemperaturePipe } from '../../shared/pipes/temperature-pipe';
import { DisplayUnits } from '../../shared/utils/units.types';
import { ZonedTimePipe } from '../../shared/pipes/zoned-time-pipe';
import { DailyPoint, Forecast } from '../domain/forecast';
import { ForecastInsight } from '../domain/forecast-insights.types';
import { describeWeatherCode } from '../domain/weather-codes';
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
