import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { buildForecastResponse, TIME_ZONE } from '../../../testing/forecast-fixtures';
import { MEDELLIN } from '../../location/place/place.constants';
import { ForecastStore } from './forecast-store';
import { AIR_QUALITY_URL, FORECAST_URL } from '../api/open-meteo.constants';

describe('ForecastStore', () => {
  let store: ForecastStore;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ForecastStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => {
    http.verify();
  });

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('requests the forecast for the selected place and maps it', async () => {
    const request = http.expectOne((req) => req.url === FORECAST_URL);
    http
      .expectOne((req) => req.url === AIR_QUALITY_URL)
      .flush({
        current: { time: 1_794_000_000, us_aqi: 42, pm2_5: 8, pm10: 12 },
      });

    expect(request.request.params.get('latitude')).toBe(String(MEDELLIN.latitude));
    expect(request.request.params.get('past_days')).toBe('1');
    expect(store.isLoading()).toBe(true);

    request.flush(buildForecastResponse());
    await settle();

    expect(store.forecast()?.timeZone).toBe(TIME_ZONE);
    expect(store.airQuality()?.usAqi).toBe(42);
    expect(store.isLoading()).toBe(false);
  });

  it('exposes the error and no forecast when the request fails', async () => {
    http.expectOne((req) => req.url === AIR_QUALITY_URL).flush({});
    http
      .expectOne((req) => req.url === FORECAST_URL)
      .flush('Servicio no disponible', { status: 503, statusText: 'Service Unavailable' });
    await settle();

    expect(store.forecast()).toBeNull();
    expect(store.airQuality()).toBeNull();
    expect(store.error()).toBeDefined();
  });

  it('treats a malformed payload as an error', async () => {
    http.expectOne((req) => req.url === AIR_QUALITY_URL).flush({});
    http.expectOne((req) => req.url === FORECAST_URL).flush({ timezone: 'UTC' });
    await settle();

    expect(store.forecast()).toBeNull();
    expect(store.error()?.message).toContain('formato esperado');
  });
});
