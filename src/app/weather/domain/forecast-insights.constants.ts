/** Hours ahead to scan for the forecast headline. */
export const HORIZON_HOURS = 12;

/** Hours ahead to scan when looking for a good outing window. */
export const OUTING_HORIZON_HOURS = 14;

/** Width of the outing window in hours. */
export const OUTING_WINDOW_HOURS = 2;

/** Precipitation probability (%) that counts as likely rain in the headline. */
export const RAIN_PROBABILITY = 50;

/** Probability below which we consider conditions dry. */
export const DRY_PROBABILITY = 30;

/** UV index at or above which sunlight is considered strong. */
export const STRONG_SUN_UV = 8;

/** Temperature difference (°) that warrants a comparison headline. */
export const NOTABLE_DIFFERENCE = 2;

/** Outing score above which no window is considered pleasant. */
export const MAX_PLEASANT_SCORE = 60;

/** Apparent temperature (°C) used as the comfort baseline for outing scoring. */
export const IDEAL_APPARENT_TEMPERATURE = 21;
