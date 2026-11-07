import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DisplayUnits, compassPoint } from '../../shared/units';
import { WindSpeedPipe } from '../../shared/wind-speed-pipe';
import { ZonedTimePipe } from '../../shared/zoned-time-pipe';
import { AirQuality, CurrentConditions, DailyPoint, HourlyPoint } from '../forecast';
import { aqiCategory, uvCategory } from '../health-scales';

/** The UV bar tops out at 11+, the start of the "extreme" category. */
const UV_SCALE_MAX = 11;
const AQI_SCALE_MAX = 300;

@Component({
  selector: 'app-weather-details',
  imports: [DecimalPipe, WindSpeedPipe, ZonedTimePipe],
  templateUrl: './weather-details.html',
  styleUrl: './weather-details.scss',
})
export class WeatherDetails {
  readonly current = input.required<CurrentConditions>();
  readonly currentHour = input.required<HourlyPoint | undefined>();
  readonly today = input.required<DailyPoint | undefined>();
  readonly airQuality = input.required<AirQuality | null>();
  readonly timeZone = input.required<string>();
  readonly units = input.required<DisplayUnits>();
  readonly now = input.required<number>();

  protected readonly windFrom = computed(() => compassPoint(this.current().windDirection));

  protected readonly uv = computed(() => {
    const value = this.currentHour()?.uvIndex ?? 0;
    return {
      value: Math.round(value),
      category: uvCategory(value),
      position: (Math.min(value, UV_SCALE_MAX) / UV_SCALE_MAX) * 100,
    };
  });

  protected readonly air = computed(() => {
    const air = this.airQuality();
    if (!air) return null;
    return {
      value: Math.round(air.usAqi),
      pm25: air.pm25,
      category: aqiCategory(air.usAqi),
      position: (Math.min(air.usAqi, AQI_SCALE_MAX) / AQI_SCALE_MAX) * 100,
    };
  });

  protected readonly humidityNote = computed(() => {
    const humidity = this.current().relativeHumidity;
    if (humidity < 30) return 'Aire seco';
    if (humidity <= 60) return 'Confortable';
    return 'Aire húmedo';
  });

  protected readonly visibilityKm = computed(() => (this.currentHour()?.visibility ?? 0) / 1000);

  /** Sun position along the arc, from 0 at sunrise to 1 at sunset; `null` at night. */
  protected readonly sun = computed(() => {
    const day = this.today();
    if (!day) return null;
    const progress = (this.now() - day.sunrise) / (day.sunset - day.sunrise);
    const daylightMinutes = Math.round((day.sunset - day.sunrise) / 60_000);
    const isUp = progress >= 0 && progress <= 1;
    // Point on a semicircle of radius 80 centered at (100, 100) in the SVG.
    const angle = Math.PI * (1 - Math.min(Math.max(progress, 0), 1));
    return {
      sunrise: day.sunrise,
      sunset: day.sunset,
      isUp,
      x: 100 + 80 * Math.cos(angle),
      y: 100 - 80 * Math.sin(angle),
      daylight: `${Math.floor(daylightMinutes / 60)} h ${daylightMinutes % 60} min`,
    };
  });
}
