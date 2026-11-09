import { SkyCondition } from '../weather/domain/weather-codes.types';

/** All sky conditions that have a matching CSS animation, excluding drizzle (mapped to rain). */
export type SkyPalette = Exclude<SkyCondition, 'drizzle'>;
