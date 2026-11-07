import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isRecord } from '../shared/type-guards';
import { Place, placeFromCoordinates } from './place';

/** Free reverse geocoding endpoint designed for client-side use, without an API key. */
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const POSITION_TIMEOUT_MS = 10_000;
const FALLBACK_NAME = 'Tu ubicación';

export type DeviceLocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

interface ReverseGeocoding {
  readonly name: string;
  readonly region: string;
}

function parseReverseGeocoding(value: unknown): ReverseGeocoding {
  if (!isRecord(value)) {
    return { name: FALLBACK_NAME, region: '' };
  }
  const text = (key: string): string => {
    const field = value[key];
    return typeof field === 'string' ? field : '';
  };
  return {
    name: text('city') || text('locality') || FALLBACK_NAME,
    region: [text('principalSubdivision'), text('countryName')].filter(Boolean).join(', '),
  };
}

@Service()
export class DeviceLocation {
  private readonly http = inject(HttpClient);
  private readonly geolocation = inject(DOCUMENT).defaultView?.navigator.geolocation ?? null;
  private readonly currentStatus = signal<DeviceLocationStatus>('idle');

  readonly status = this.currentStatus.asReadonly();
  readonly isSupported = this.geolocation !== null;

  /** Asks for the device position. Resolves to `null` when it is denied or unavailable. */
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
