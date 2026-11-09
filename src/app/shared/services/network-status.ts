import { DOCUMENT, DestroyRef, Service, inject, signal } from '@angular/core';

@Service()
export class NetworkStatus {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly onlineState = signal(this.window?.navigator.onLine ?? true);

  readonly online = this.onlineState.asReadonly();

  constructor() {
    const update = (): void => {
      this.onlineState.set(this.window?.navigator.onLine ?? true);
    };
    this.window?.addEventListener('online', update);
    this.window?.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('online', update);
      this.window?.removeEventListener('offline', update);
    });
  }
}
