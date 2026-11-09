import {
  Component,
  DOCUMENT,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AlertList } from '../alerts/alert-list/alert-list';
import { CitySearch } from '../location/city-search/city-search';
import { DeviceLocation } from '../location/place/device-location';
import { LocationStore } from '../location/store/location-store';
import { isValidCoordinates, placeFromCoordinates } from '../location/place/place';
import { Place } from '../location/place/place.types';
import { InstallPrompt } from '../pwa/install-prompt';
import { SettingsPanel } from '../settings/settings-panel/settings-panel';
import { SettingsStore } from '../settings/store/settings-store';
import { Clock } from '../shared/services/clock';
import { NetworkStatus } from '../shared/services/network-status';
import { ZonedTimePipe } from '../shared/pipes/zoned-time-pipe';
import { formatTemperature } from '../shared/utils/units';
import { CurrentConditions } from '../weather/current-conditions/current-conditions';
import { DailyForecast } from '../weather/daily-forecast/daily-forecast';
import { ForecastStore } from '../weather/store/forecast-store';
import { HourlyForecast } from '../weather/hourly-forecast/hourly-forecast';
import { describeWeatherCode } from '../weather/domain/weather-codes';
import { WeatherDetails } from '../weather/weather-details/weather-details';
import { TOAST_DURATION_MS } from './forecast-page.constants';
import { SkyPalette } from './forecast-page.types';

@Component({
  selector: 'app-forecast-page',
  imports: [
    AlertList,
    CitySearch,
    CurrentConditions,
    DailyForecast,
    HourlyForecast,
    SettingsPanel,
    WeatherDetails,
    ZonedTimePipe,
  ],
  templateUrl: './forecast-page.html',
  styleUrl: './forecast-page.scss',
})
export class ForecastPage implements OnInit {
  /** Query parameters bound by the router that make a forecast URL shareable. */
  readonly lat = input<string>();
  readonly lon = input<string>();
  readonly name = input<string>();
  readonly region = input<string>();

  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly deviceLocation = inject(DeviceLocation);

  protected readonly location = inject(LocationStore);
  protected readonly forecastStore = inject(ForecastStore);
  protected readonly settings = inject(SettingsStore);
  protected readonly installPrompt = inject(InstallPrompt);
  protected readonly online = inject(NetworkStatus).online;
  protected readonly now = inject(Clock).now;

  protected readonly forecast = this.forecastStore.forecast;
  protected readonly locating = computed(() => this.deviceLocation.status() === 'locating');
  protected readonly canLocate = this.deviceLocation.isSupported;
  protected readonly toast = signal<string | null>(null);

  protected readonly today = computed(() => this.forecastStore.upcomingDays()[0]);
  protected readonly currentHour = computed(() => this.forecastStore.next24Hours()[0]);

  protected readonly sky = computed<SkyPalette>(() => {
    const current = this.forecast()?.current;
    if (!current) return 'partly-cloudy';
    const { condition } = describeWeatherCode(current.weatherCode);
    return condition === 'drizzle' ? 'rain' : condition;
  });
  protected readonly daypart = computed(() =>
    (this.forecast()?.current.isDay ?? true) ? 'day' : 'night',
  );

  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      this.syncUrl(this.location.selected());
    });
    effect(() => {
      this.title.setTitle(this.pageTitle());
    });
  }

  ngOnInit(): void {
    this.applyDeepLink();
  }

  protected selectPlace(place: Place): void {
    this.location.select(place);
  }

  protected async useDeviceLocation(): Promise<void> {
    const place = await this.deviceLocation.locate();
    if (place) {
      this.location.select(place);
      return;
    }
    this.showToast(
      this.deviceLocation.status() === 'denied'
        ? 'Permite el acceso a tu ubicación en el navegador para usar esta opción.'
        : 'No se pudo obtener tu ubicación. Busca la ciudad por su nombre.',
    );
  }

  protected toggleFavorite(): void {
    const wasFavorite = this.location.isSelectedFavorite();
    if (!wasFavorite && !this.location.canAddFavorite()) {
      this.showToast('Ya tienes 8 lugares guardados. Quita uno para guardar este.');
      return;
    }
    this.location.toggleSelectedFavorite();
    this.showToast(wasFavorite ? 'Lugar quitado de guardados.' : 'Lugar guardado.');
  }

  /**
   * Shares the current page URL via the Web Share API, or copies it to the clipboard
   * when the browser has no share sheet.
   */
  protected async share(): Promise<void> {
    const navigator = this.window?.navigator;
    const url = this.window?.location.href;
    if (!navigator || !url) return;
    const text = this.pageTitle();
    const data: ShareData = { title: text, text, url };
    try {
      if (typeof navigator.canShare === 'function' && navigator.canShare(data)) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        this.showToast('Enlace copiado.');
      }
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.showToast('No se pudo compartir. Copia la dirección de la página.');
      }
    }
  }

  protected retry(): void {
    this.forecastStore.refresh();
  }

  private pageTitle(): string {
    const place = this.location.selected();
    const current = this.forecast()?.current;
    if (!current) return `${place.name}: Clima`;
    const temperature = formatTemperature(current.temperature, this.settings.units().temperature);
    const condition = describeWeatherCode(current.weatherCode).label.toLowerCase();
    return `${place.name}: ${temperature}, ${condition}`;
  }

  private applyDeepLink(): void {
    const latitude = Number(this.lat());
    const longitude = Number(this.lon());
    const name = this.name()?.trim() ?? '';
    const hasCoords =
      this.lat() !== undefined &&
      this.lon() !== undefined &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      isValidCoordinates(latitude, longitude);
    if (hasCoords) {
      this.location.select(
        placeFromCoordinates(
          latitude,
          longitude,
          name === '' ? 'Ubicación compartida' : name,
          this.region() ?? '',
        ),
      );
    }
  }

  private syncUrl(place: Place): void {
    void this.router.navigate([], {
      queryParams: {
        lat: place.latitude.toFixed(4),
        lon: place.longitude.toFixed(4),
        name: place.name,
        region: place.region || null,
      },
      replaceUrl: true,
    });
  }

  private showToast(message: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
    }, TOAST_DURATION_MS);
  }
}
