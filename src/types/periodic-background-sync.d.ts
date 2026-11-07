/**
 * Periodic Background Sync API, available in Chromium for installed PWAs and not yet in
 * TypeScript's DOM library. https://developer.mozilla.org/docs/Web/API/Web_Periodic_Background_Synchronization_API
 */
interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly periodicSync?: PeriodicSyncManager;
}
