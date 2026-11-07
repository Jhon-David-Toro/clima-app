import { DOCUMENT, DestroyRef, Service, computed, inject, signal } from '@angular/core';

/** Offers installing the app when the browser allows it. */
@Service()
export class InstallPrompt {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);

  readonly canInstall = computed(() => this.deferredPrompt() !== null);

  constructor() {
    const capture = (event: BeforeInstallPromptEvent): void => {
      event.preventDefault();
      this.deferredPrompt.set(event);
    };
    const clear = (): void => {
      this.deferredPrompt.set(null);
    };
    this.window?.addEventListener('beforeinstallprompt', capture);
    this.window?.addEventListener('appinstalled', clear);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('beforeinstallprompt', capture);
      this.window?.removeEventListener('appinstalled', clear);
    });
  }

  async install(): Promise<void> {
    const prompt = this.deferredPrompt();
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // A prompt event can only be used once.
    this.deferredPrompt.set(null);
  }
}
