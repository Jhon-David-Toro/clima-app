import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isRecord } from '../../shared/utils/type-guards';
import { placeFromCoordinates } from './place';
import { Place } from './place.types';
import {
  FALLBACK_NAME,
  POSITION_TIMEOUT_MS,
  REVERSE_GEOCODING_URL,
} from './device-location.constants';
import { DeviceLocationStatus, ReverseGeocoding } from './device-location.types';

function parseReverseGeocoding(value: unknown): ReverseGeocoding {
  if (!isRecord(value)) return { name: FALLBACK_NAME, region: '' };
  const text = (key: string): string => {
    const field = value[key];
    return typeof field === 'string' ? field : '';
  };
  return {
    name: text('city') || text('locality') || FALLBACK_NAME,
    region: [text('principalSubdivision'), text('countryName')].filter(Boolean).join(', '),
  };
}

/** Wraps the browser Geolocation API and reverse-geocodes coordinates into a named place. */
@Service()
export class DeviceLocation {
  private readonly http = inject(HttpClient);
  private readonly geolocation = inject(DOCUMENT).defaultView?.navigator.geolocation ?? null;
  private readonly currentStatus = signal<DeviceLocationStatus>('idle');

  /** Current state of a locate request. */
  readonly status = this.currentStatus.asReadonly();
  readonly isSupported = this.geolocation !== null;

  /**
   * Requests the device position and reverse-geocodes it into a named place.
   * Resolves to `null` when the user denies permission or the API is unavailable.
   */
  async locate(): Promise<Place | null> {
    if (!this.geolocation) {
      this.currentStatus.set('unavailable');
      return null;
    }
    this.currentStatus.set('locating');
    try {
      const { coords } = await this.currentPosition(this.geolocation);
      const { name, region } = await this.reverseGeocode(coords.latitude, coords.longitude);
      this.currentStatus.set('idle');
      return placeFromCoordinates(coords.latitude, coords.longitude, name, region);
    } catch (error: unknown) {
      const denied =
        typeof GeolocationPositionError !== 'undefined' &&
        error instanceof GeolocationPositionError &&
        error.code === error.PERMISSION_DENIED;
      this.currentStatus.set(denied ? 'denied' : 'unavailable');
      return null;
    }
  }

  private currentPosition(geolocation: Geolocation): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: 5 * 60 * 1000,
      });
    });
  }

  /** The place name is a nicety: if the lookup fails the coordinates are still usable. */
  private async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocoding> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(REVERSE_GEOCODING_URL, {
          params: { latitude, longitude, localityLanguage: 'es' },
        }),
      );
      return parseReverseGeocoding(response);
    } catch {
      return { name: FALLBACK_NAME, region: '' };
    }
  }
}
