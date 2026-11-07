import { DEFAULT_SETTINGS, normalizeSettings } from './app-settings';

describe('normalizeSettings', () => {
  it('returns the defaults for missing or corrupt data', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('not an object')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const settings = normalizeSettings({
      units: { temperature: 'fahrenheit', windSpeed: 'knots' },
      alerts: {
        enabled: { storm: false, rain: 'yes' },
        thresholds: { heat: 35, cold: Number.NaN },
      },
      notifications: true,
      theme: 'sepia',
    });

    expect(settings.units).toEqual({ temperature: 'fahrenheit', windSpeed: 'kmh' });
    expect(settings.alerts.enabled.storm).toBe(false);
    expect(settings.alerts.enabled.rain).toBe(true);
    expect(settings.alerts.thresholds.heat).toBe(35);
    expect(settings.alerts.thresholds.cold).toBe(DEFAULT_SETTINGS.alerts.thresholds.cold);
    expect(settings.notifications).toBe(true);
    expect(settings.theme).toBe('system');
  });
});
