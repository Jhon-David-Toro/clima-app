/** Color scale for temperatures, from freezing blue to scorching red. */
import { STOPS } from './temperature-color.constants';
import { Rgb } from './temperature-color.types';

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const channel = (i: 0 | 1 | 2): number => Math.round(a[i] + (b[i] - a[i]) * t);
  return [channel(0), channel(1), channel(2)];
}

/**
 * Returns a CSS `rgb()` color string for a temperature in Celsius.
 * Interpolates between the nearest two stops in the scale.
 */
export function temperatureColor(celsius: number): string {
  const first = STOPS[0];
  const last = STOPS[STOPS.length - 1];
  if (!first || !last) return 'currentColor';

  let color: Rgb = celsius <= first[0] ? first[1] : last[1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    const lower = STOPS[i];
    const upper = STOPS[i + 1];
    if (lower && upper && celsius >= lower[0] && celsius <= upper[0]) {
      color = mix(lower[1], upper[1], (celsius - lower[0]) / (upper[0] - lower[0]));
      break;
    }
  }
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}
