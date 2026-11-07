/** Event fired by the Periodic Background Sync API, missing from TypeScript's WebWorker library. */
interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}

interface ServiceWorkerGlobalScopeEventMap {
  periodicsync: PeriodicSyncEvent;
}
