import { Rgb } from './temperature-color.types';

/** Color stops for the temperature scale, from freezing blue to scorching red. */
export const STOPS: readonly (readonly [celsius: number, color: Rgb])[] = [
  [-10, [91, 108, 255]],
  [0, [76, 141, 246]],
  [10, [63, 183, 201]],
  [18, [57, 181, 138]],
  [24, [242, 194, 48]],
  [30, [240, 138, 36]],
  [38, [214, 64, 64]],
];
