import { DOCUMENT, Service, inject } from '@angular/core';

/**
 * Typed wrapper around `localStorage`. Storage can be unavailable (private mode, quota, disabled
 * cookies), so every access degrades to the fallback instead of breaking the app.
 */
@Service()
export class BrowserStorage {
  private readonly storage = this.resolveStorage();

  read<T>(key: string, parse: (value: unknown) => T): T {
    try {
      const raw = this.storage?.getItem(key) ?? null;
      return parse(raw === null ? undefined : JSON.parse(raw));
    } catch {
      return parse(undefined);
    }
  }

  write(key: string, value: unknown): void {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch {
      // Storage is full or unavailable; the app keeps working with in-memory state.
    }
  }

  private resolveStorage(): Storage | null {
    try {
      return inject(DOCUMENT).defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
