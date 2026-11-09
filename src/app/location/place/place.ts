import { GeocodingResult } from '../../weather/api/open-meteo.types';
import { isFiniteNumber, isRecord } from '../../shared/utils/type-guards';
import { Place } from './place.types';

/**
 * Builds a {@link Place} from a geocoding API result.
 * Combines `admin1` and `country` into a readable region string.
 */
export function placeFromGeocoding(result: GeocodingResult): Place {
  return {
    id: `geo-${result.id}`,
    name: result.name,
    region: [result.admin1, result.country].filter(Boolean).join(', '),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

/**
 * Builds a {@link Place} from raw coordinates.
 * Rounds to two decimal places (~1 km) so the id is stable for the same spot.
 */
export function placeFromCoordinates(
  latitude: number,
  longitude: number,
  name: string,
  region = '',
): Place {
  return {
    id: `pos-${latitude.toFixed(2)},${longitude.toFixed(2)}`,
    name,
    region,
    latitude,
    longitude,
  };
}

/** Returns `true` when the coordinates are within the valid WGS-84 range. */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

/** Runtime type-guard that validates a `Place` from untrusted data (storage, URL). */
export function isPlace(value: unknown): value is Place {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['region'] === 'string' &&
    isFiniteNumber(value['latitude']) &&
    isFiniteNumber(value['longitude']) &&
    isValidCoordinates(value['latitude'], value['longitude'])
  );
}
