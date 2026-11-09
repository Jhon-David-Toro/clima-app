/** A geographic place the user can select to view a forecast. */
export interface Place {
  readonly id: string;
  readonly name: string;
  /** State and country, for example "Antioquia, Colombia". */
  readonly region: string;
  readonly latitude: number;
  readonly longitude: number;
}
