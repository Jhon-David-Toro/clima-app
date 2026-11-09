import { compassPoint, convertTemperatureDelta, formatTemperature, formatWindSpeed } from './units';

describe('units', () => {
  it('formats temperatures without negative zero', () => {
    expect(formatTemperature(21.6, 'celsius')).toBe('22°');
    expect(formatTemperature(-0.3, 'celsius')).toBe('0°');
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°');
  });

  it('converts temperature differences without the Fahrenheit offset', () => {
    expect(convertTemperatureDelta(5, 'fahrenheit')).toBe(9);
    expect(convertTemperatureDelta(5, 'celsius')).toBe(5);
  });

  it('formats wind speed in every unit', () => {
    expect(formatWindSpeed(36, 'kmh')).toBe('36 km/h');
    expect(formatWindSpeed(36, 'ms')).toBe('10 m/s');
    expect(formatWindSpeed(36, 'mph')).toBe('22 mph');
  });

  it('names the compass point the wind comes from', () => {
    expect(compassPoint(0)).toBe('N');
    expect(compassPoint(225)).toBe('SO');
    expect(compassPoint(350)).toBe('N');
    expect(compassPoint(-90)).toBe('O');
  });
});
