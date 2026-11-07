/** Geometry for the hourly temperature curve, kept apart from the component to test it. */

export interface CurvePoint {
  readonly x: number;
  readonly y: number;
}

export interface CurveLayout {
  readonly columnWidth: number;
  readonly height: number;
  /** Vertical breathing room so the stroke is never clipped. */
  readonly padding: number;
}

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

/** Smooth SVG path through every point, using Catmull-Rom splines converted to Béziers. */
export function smoothPath(points: readonly CurvePoint[]): string {
  const [first] = points;
  if (!first) return '';
  let path = `M${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}
