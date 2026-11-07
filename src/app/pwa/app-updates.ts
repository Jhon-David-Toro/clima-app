import { DOCUMENT, Service, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs';

/** Tells the person when a new version was downloaded, so they choose when to reload. */
@Service()
export class AppUpdates {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);

  readonly updateReady = toSignal(
    this.swUpdate.versionUpdates.pipe(
      filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
      map(() => true),
    ),
    { initialValue: false },
  );

  async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    this.document.location.reload();
  }
}
