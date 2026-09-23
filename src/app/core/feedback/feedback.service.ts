import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

/**
 * Feedback visual tras las acciones del usuario (toasts de éxito y de error).
 *
 * Centraliza el manejo de errores de la capa de presentación: cualquier fallo de SQLite o de una
 * validación del repositorio se muestra como toast en vez de quedar como una promesa rechazada
 * sin que el usuario se entere.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly toastController = inject(ToastController);

  /**
   * Ejecuta una acción y muestra el toast correspondiente según su resultado.
   * Devuelve true si la acción terminó bien.
   */
  async attempt(action: () => Promise<unknown>, messages: { success?: string; error: string }): Promise<boolean> {
    try {
      await action();
      if (messages.success) {
        await this.success(messages.success);
      }
      return true;
    } catch (error) {
      await this.error(messages.error, error);
      return false;
    }
  }

  async success(message: string): Promise<void> {
    await this.present(message, 'app-toast', 2000);
  }

  async error(message: string, cause?: unknown): Promise<void> {
    // El detalle técnico va a la consola; al usuario se le muestra un mensaje comprensible.
    console.error(`[Feedback] ${message}`, cause);
    await this.present(message, 'app-toast app-toast--error', 3000);
  }

  private async present(message: string, cssClass: string, duration: number): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      positionAnchor: 'app-tab-bar',
      cssClass,
    });
    await toast.present();
  }
}
