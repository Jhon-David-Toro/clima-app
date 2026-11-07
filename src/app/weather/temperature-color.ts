/** Color scale for temperatures, from freezing blue to scorching red. */

type Rgb = readonly [number, number, number];

const STOPS: readonly (readonly [celsius: number, color: Rgb])[] = [
  [-10, [91, 108, 255]],
  [0, [76, 141, 246]],
  [10, [63, 183, 201]],
  [18, [57, 181, 138]],
  [24, [242, 194, 48]],
  [30, [240, 138, 36]],
  [38, [214, 64, 64]],
];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const channel = (i: 0 | 1 | 2): number => Math.round(a[i] + (b[i] - a[i]) * t);
  return [channel(0), channel(1), channel(2)];
}

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
