import { CurveLayout } from './temperature-curve.types';

/** Layout parameters for the hourly temperature curve SVG. */
export const LAYOUT: CurveLayout = { columnWidth: 64, height: 56, padding: 8 };

/** Below this precipitation probability, showing a percentage is noise. */
export const MIN_VISIBLE_PROBABILITY = 20;
