import { GeocodingResult } from '../weather/open-meteo';
import { isFiniteNumber, isRecord } from '../shared/type-guards';

export interface Place {
  readonly id: string;
  readonly name: string;
  /** State and country, for example "Antioquia, Colombia". */
  readonly region: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** Default location for a first visit. */
export const MEDELLIN: Place = {
  id: 'geo-3674962',
  name: 'Medellín',
  region: 'Antioquia, Colombia',
  latitude: 6.25184,
  longitude: -75.56359,
};

export function placeFromGeocoding(result: GeocodingResult): Place {
  return {
    id: `geo-${result.id}`,
    name: result.name,
    region: [result.admin1, result.country].filter(Boolean).join(', '),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

/** Rounds coordinates to about 1 km so the id is stable for the same spot. */
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

export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

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
