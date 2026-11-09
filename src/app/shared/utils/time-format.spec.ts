import { HOUR_MS, TIME_ZONE, localTime } from '../../../testing/forecast-fixtures';
import { formatZonedTime, toIsoDate } from './time-format';

describe('time format', () => {
  it('formats in the location time zone with a non-breaking meridiem', () => {
    expect(formatZonedTime(localTime(1, 15), TIME_ZONE, 'time')).toBe('3:00 p. m.');
    expect(formatZonedTime(localTime(1, 9), TIME_ZONE, 'hour')).toBe('9 a. m.');
  });

  it('uses the local calendar date, not the UTC one', () => {
    // 23:00 in Bogotá is already the next day in UTC.
    expect(toIsoDate(localTime(1, 23), TIME_ZONE)).toBe('2026-11-07');
    expect(toIsoDate(localTime(1, 23) + HOUR_MS, TIME_ZONE)).toBe('2026-11-08');
  });
});
