import { DestroyRef, Service, inject, signal } from '@angular/core';
import { TICK_MS } from './clock.constants';

/** Current time as a signal that ticks every minute, keeping time-based views fresh. */
@Service()
export class Clock {
  private readonly currentTime = signal(Date.now());

  /** Epoch-ms timestamp updated every {@link TICK_MS} milliseconds. */
  readonly now = this.currentTime.asReadonly();

  constructor() {
    const timer = setInterval(() => {
      this.currentTime.set(Date.now());
    }, TICK_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
    });
  }
}
