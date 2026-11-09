/**
 * Entry point of the app's service worker. The build prepends `importScripts('./ngsw-worker.js')`
 * so Angular's worker keeps handling caching and updates, and this file adds background alert
 * checks with the same rules the app uses.
 */
import { evaluateAlerts } from '../app/alerts/rules/alert-rules';
import { AlertContext } from '../app/alerts/rules/alert-rules.types';
import { alertNotification } from '../app/notifications/push/alert-notification';
import {
  BACKGROUND_CONFIG_KEY,
  NOTIFIED_ALERTS_KEY,
  PERIODIC_SYNC_TAG,
  notifiedKey,
  parseBackgroundConfig,
  parseNotifiedAlerts,
  pruneNotified,
} from '../app/notifications/background/background-config';
import { BackgroundConfig } from '../app/notifications/background/background-config.types';
import { readValue, writeValue } from '../app/shared/storage/key-value-db';
import { AirQuality } from '../app/weather/domain/forecast';
import { mapAirQuality, mapForecast } from '../app/weather/domain/forecast-mapper';
import { AIR_QUALITY_URL, FORECAST_URL } from '../app/weather/api/open-meteo.constants';
import {
  airQualityParams,
  buildUrl,
  forecastParams,
  parseAirQualityResponse,
  parseForecastResponse,
} from '../app/weather/api/open-meteo';

declare const self: ServiceWorkerGlobalScope;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const body: unknown = await response.json();
  return body;
}

async function fetchAirQuality(config: BackgroundConfig): Promise<AirQuality | null> {
  try {
    const raw = await fetchJson(buildUrl(AIR_QUALITY_URL, airQualityParams(config)));
    return mapAirQuality(parseAirQualityResponse(raw));
  } catch {
    return null;
  }
}

async function checkAlerts(): Promise<void> {
  const config = await readValue(BACKGROUND_CONFIG_KEY, parseBackgroundConfig);
  if (!config) return;
  const now = Date.now();
  const [raw, airQuality] = await Promise.all([
    fetchJson(buildUrl(FORECAST_URL, forecastParams(config))),
    fetchAirQuality(config),
  ]);
  const forecast = mapForecast(parseForecastResponse(raw), now);
  const context: AlertContext = {
    hourly: forecast.hourly,
    airQuality,
    timeZone: forecast.timeZone,
    now,
    units: config.units,
  };
  const alerts = evaluateAlerts(context, config.alerts);

  const notified = pruneNotified(await readValue(NOTIFIED_ALERTS_KEY, parseNotifiedAlerts), now);
  const fresh = alerts.filter(
    (alert) => notified[notifiedKey(config.placeName, alert.id)] === undefined,
  );
  for (const alert of fresh) {
    const { title, options } = alertNotification(alert, config.placeName);
    await self.registration.showNotification(title, options);
  }
  const marked = fresh.map((alert) => [notifiedKey(config.placeName, alert.id), now] as const);
  await writeValue(NOTIFIED_ALERTS_KEY, { ...notified, ...Object.fromEntries(marked) });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(checkAlerts());
  }
});
