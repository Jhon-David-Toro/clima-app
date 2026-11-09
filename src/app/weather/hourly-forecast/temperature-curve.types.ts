/** A single (x, y) point on the temperature curve SVG. */
export interface CurvePoint {
  readonly x: number;
  readonly y: number;
}

/** Sizing parameters that control the temperature curve SVG layout. */
export interface CurveLayout {
  readonly columnWidth: number;
  readonly height: number;
  /** Vertical breathing room so the stroke is never clipped. */
  readonly padding: number;
}
