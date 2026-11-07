import { DestroyRef, Service, inject, signal } from '@angular/core';

const TICK_MS = 60_000;

/** Current time as a signal that ticks every minute, so time-based views stay fresh. */
@Service()
export class Clock {
  private readonly currentTime = signal(Date.now());

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
