import { DOCUMENT, DestroyRef, Service, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LocationStore } from '../../location/store/location-store';
import { Clock } from '../../shared/services/clock';
import { SettingsStore } from '../../settings/store/settings-store';
import { toIsoDate } from '../../shared/utils/time-format';
import { Forecast } from '../domain/forecast';
import { buildInsight } from '../domain/forecast-insights';
import { mapAirQuality, mapForecast, upcomingHours } from '../domain/forecast-mapper';
import { REFRESH_INTERVAL_MS, STALE_AFTER_MS } from './forecast-store.constants';
import { AIR_QUALITY_URL, FORECAST_URL } from '../api/open-meteo.constants';
import {
  airQualityParams,
  forecastParams,
  parseAirQualityResponse,
  parseForecastResponse,
} from '../api/open-meteo';

/** Fetches and caches the weather forecast, refreshing periodically and on tab focus. */
@Service()
export class ForecastStore {
  private readonly location = inject(LocationStore);
  private readonly settings = inject(SettingsStore);
  private readonly clock = inject(Clock);
  private readonly document = inject(DOCUMENT);

  private readonly coordinates = computed(
    () => {
      const { latitude, longitude } = this.location.selected();
      return { latitude, longitude };
    },
    { equal: (a, b) => a.latitude === b.latitude && a.longitude === b.longitude },
  );

  private readonly forecastResource = httpResource(
    () => ({ url: FORECAST_URL, params: { ...forecastParams(this.coordinates()) } }),
    { parse: (raw: unknown) => mapForecast(parseForecastResponse(raw), Date.now()) },
  );

  /** Air quality is secondary: when it fails, the rest of the forecast still shows. */
  private readonly airQualityResource = httpResource(
    () => ({ url: AIR_QUALITY_URL, params: { ...airQualityParams(this.coordinates()) } }),
    { parse: (raw: unknown) => mapAirQuality(parseAirQualityResponse(raw)) },
  );

  /** Current forecast, or `null` while the first fetch is in progress. */
  readonly forecast = computed<Forecast | null>(() =>
    this.forecastResource.hasValue() ? this.forecastResource.value() : null,
  );
  readonly airQuality = computed(() =>
    this.airQualityResource.hasValue() ? this.airQualityResource.value() : null,
  );
  readonly isLoading = this.forecastResource.isLoading;
  readonly error = this.forecastResource.error;

  /** Next 24 hourly points from the current hour onwards. */
  readonly next24Hours = computed(() => {
    const forecast = this.forecast();
    return forecast ? upcomingHours(forecast.hourly, this.clock.now(), 24) : [];
  });

  /** Daily points from today onwards; the API also returns yesterday for comparisons. */
  readonly upcomingDays = computed(() => {
    const forecast = this.forecast();
    if (!forecast) return [];
    const today = toIsoDate(this.clock.now(), forecast.timeZone);
    const index = forecast.daily.findIndex((day) => day.date === today);
    return index === -1 ? [] : forecast.daily.slice(index);
  });

  /** Plain-language insight derived from the current forecast. */
  readonly insight = computed(() => {
    const forecast = this.forecast();
    return forecast ? buildInsight(forecast, this.clock.now(), this.settings.units()) : null;
  });

  constructor() {
    const timer = setInterval(() => {
      this.refresh();
    }, REFRESH_INTERVAL_MS);
    const refreshIfStale = (): void => {
      const fetchedAt = this.forecast()?.fetchedAt ?? 0;
      if (this.document.visibilityState === 'visible' && Date.now() - fetchedAt > STALE_AFTER_MS) {
        this.refresh();
      }
    };
    this.document.addEventListener('visibilitychange', refreshIfStale);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      this.document.removeEventListener('visibilitychange', refreshIfStale);
    });
  }

  /** Reloads both the forecast and air-quality resources. */
  refresh(): void {
    this.forecastResource.reload();
    this.airQualityResource.reload();
  }
}
