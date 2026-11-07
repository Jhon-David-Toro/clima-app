import { curvePoints, smoothPath } from './temperature-curve';

const LAYOUT = { columnWidth: 64, height: 56, padding: 8 };

describe('temperature curve', () => {
  it('centers points in their column and maps the range to the height', () => {
    const points = curvePoints([10, 20, 15], LAYOUT);

    expect(points).toEqual([
      { x: 32, y: 48 },
      { x: 96, y: 8 },
      { x: 160, y: 28 },
    ]);
  });

  it('draws a flat line when every value is the same', () => {
    const points = curvePoints([18, 18], LAYOUT);

    expect(points.every((p) => p.y === points[0]?.y)).toBe(true);
  });

  it('builds one Bézier segment per pair of points', () => {
    const path = smoothPath(curvePoints([10, 20, 15], LAYOUT));

    expect(path.startsWith('M32.0,48.0')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(2);
    expect(smoothPath([])).toBe('');
  });
});
