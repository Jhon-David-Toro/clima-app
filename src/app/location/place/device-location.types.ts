export type DeviceLocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

export interface ReverseGeocoding {
  readonly name: string;
  readonly region: string;
}
