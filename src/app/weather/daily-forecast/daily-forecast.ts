import { Component, computed, input } from '@angular/core';
import { TemperaturePipe } from '../../shared/temperature-pipe';
import { DisplayUnits } from '../../shared/units';
import { ZonedTimePipe } from '../../shared/zoned-time-pipe';
import { DailyPoint } from '../forecast';
import { temperatureColor } from '../temperature-color';
import { describeWeatherCode } from '../weather-codes';
import { WeatherIcon } from '../weather-icon/weather-icon';

const MIN_VISIBLE_PROBABILITY = 20;

interface DayRow {
  readonly day: DailyPoint;
  readonly label: string;
  /** Start and width of the min–max bar, as percentages of the 10-day range. */
  readonly offset: number;
  readonly span: number;
  readonly gradient: string;
}

@Component({
  selector: 'app-daily-forecast',
  imports: [TemperaturePipe, ZonedTimePipe, WeatherIcon],
  templateUrl: './daily-forecast.html',
  styleUrl: './daily-forecast.scss',
})
export class DailyForecast {
  readonly days = input.required<readonly DailyPoint[]>();
  readonly timeZone = input.required<string>();
  readonly units = input.required<DisplayUnits>();
  readonly currentTemperature = input.required<number>();

  protected readonly minVisibleProbability = MIN_VISIBLE_PROBABILITY;

  private readonly range = computed(() => {
    const days = this.days();
    const min = Math.min(...days.map((d) => d.temperatureMin));
    const max = Math.max(...days.map((d) => d.temperatureMax));
    return { min, span: max - min || 1 };
  });

  protected readonly rows = computed<readonly DayRow[]>(() => {
    const { min, span } = this.range();
    return this.days().map((day) => ({
      day,
      label: describeWeatherCode(day.weatherCode).label,
      offset: ((day.temperatureMin - min) / span) * 100,
      span: ((day.temperatureMax - day.temperatureMin) / span) * 100,
      gradient: `linear-gradient(90deg, ${temperatureColor(day.temperatureMin)}, ${temperatureColor(day.temperatureMax)})`,
    }));
  });

  /** Position of the current temperature on today's bar, clamped to the bar. */
  protected readonly nowOffset = computed(() => {
    const today = this.days()[0];
    if (!today) return null;
    const { min, span } = this.range();
    const clamped = Math.min(
      Math.max(this.currentTemperature(), today.temperatureMin),
      today.temperatureMax,
    );
    return ((clamped - min) / span) * 100;
  });

  /** Noon UTC keeps the weekday right in any time zone. */
  protected dateTime(day: DailyPoint): number {
    return Date.parse(`${day.date}T12:00:00Z`);
  }
}
