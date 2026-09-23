import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/**
 * Controla el modo claro/oscuro agregando o quitando la clase .ion-palette-dark en <html>
 *
 * El modo inicial es el del sistema operativo y se sigue en vivo si el usuario lo cambia.
 * El botón del header permite alternarlo manualmente solo durante la sesión: no se guarda.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // DOCUMENT es el `document` del WebView, inyectado por Angular en lugar de usar la global.
  private readonly document = inject(DOCUMENT);
  private readonly systemDark = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');

  readonly dark = signal(this.systemDark?.matches ?? false);

  constructor() {
    this.apply(this.dark());
    this.systemDark?.addEventListener('change', (event) => this.set(event.matches));
  }

  toggle(): void {
    this.set(!this.dark());
  }

  private set(dark: boolean): void {
    this.dark.set(dark);
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    this.document.documentElement.classList.toggle('ion-palette-dark', dark);
  }
}
