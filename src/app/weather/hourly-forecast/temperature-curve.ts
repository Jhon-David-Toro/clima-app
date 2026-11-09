/** Geometry for the hourly temperature curve, kept apart from the component to test it. */
import { CurveLayout, CurvePoint } from './temperature-curve.types';

/**
 * Converts an array of temperature values into SVG (x, y) coordinates.
 * Y is inverted so higher temperatures appear at the top of the chart.
 */
export function curvePoints(values: readonly number[], layout: CurveLayout): CurvePoint[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usable = layout.height - layout.padding * 2;
  return values.map((value, index) => ({
    x: index * layout.columnWidth + layout.columnWidth / 2,
    y: layout.padding + (1 - (value - min) / range) * usable,
  }));
}

/**
 * Builds a smooth SVG path through every point using Catmull-Rom splines converted to Béziers.
 * Returns an empty string when `points` is empty.
 */
export function smoothPath(points: readonly CurvePoint[]): string {
  const [first] = points;
  if (!first) return '';
  let path = `M${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    // Catmull-Rom uses four points to derive two Bézier control points for the segment [segStart → segEnd].
    const beforeStart = points[i - 1] ?? points[i]; // clamped at the first point
    const segStart = points[i];
    const segEnd = points[i + 1];
    const afterEnd = points[i + 2] ?? segEnd; // clamped at the last point
    if (!beforeStart || !segStart || !segEnd || !afterEnd) continue;
    const ctrl1X = segStart.x + (segEnd.x - beforeStart.x) / 6;
    const ctrl1Y = segStart.y + (segEnd.y - beforeStart.y) / 6;
    const ctrl2X = segEnd.x - (afterEnd.x - segStart.x) / 6;
    const ctrl2Y = segEnd.y - (afterEnd.y - segStart.y) / 6;
    path += ` C${ctrl1X.toFixed(1)},${ctrl1Y.toFixed(1)} ${ctrl2X.toFixed(1)},${ctrl2Y.toFixed(1)} ${segEnd.x.toFixed(1)},${segEnd.y.toFixed(1)}`;
  }
  return path;
}
