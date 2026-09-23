import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config';

// Nombres de los parámetros tal como están creados en la consola de Firebase Remote Config.
const FLAG_KEYS = {
  completedLast: 'tasks_completed_last',
  categoryFromTask: 'category_create_from_task',
} as const;

/**
 * Feature de flags controlados desde Firebase Remote Config.
 *
 * Es el único punto de la app que conoce Firebase: el resto solo lee signals booleanos,
 * así que presentación y repositorios no dependen del proveedor de configuración remota.
 *
 * Flujo:
 * 1. Los signals arrancan en false (función apagada) y la app es usable de inmediato.
 * 2. activate trae los valores publicados en la consola.
 * 3. En iOS/Android se escuchan actualizaciones en tiempo real: al publicar un cambio en la
 *    consola, la app lo aplica en vivo sin reiniciar.
 * Si algo falla, se mantienen los valores por defecto.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly _completedLast = signal(false);
  private readonly _categoryFromTask = signal(false);

  /** Ordena la lista de tareas con las pendientes primero y las completadas al final. */
  readonly completedLast = this._completedLast.asReadonly();
  /** Permite crear una categoría desde el formulario de tarea. */
  readonly categoryFromTask = this._categoryFromTask.asReadonly();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // En web no hay configuración de Firebase por ende acabamos el proceso.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Agregar valores por defecto en los key de firebase config.
      await FirebaseRemoteConfig.setDefaults({
        defaults: { [FLAG_KEYS.completedLast]: false, [FLAG_KEYS.categoryFromTask]: false },
      });
      // Verifica pasado 1 minuto ya que la configuración esta en segundos.
      await FirebaseRemoteConfig.fetchConfig({
        minimumFetchIntervalInSeconds: 60,
      });
      // Activa lo traído por fetchConfig para que getBoolean lo devuelva.
      await FirebaseRemoteConfig.activate();
    } catch (error) {
      console.warn('No se pudieron traer valores de Firebase', error);
    }

    try {
      await this.readFlags();

      // Actualizaciones en tiempo real: el evento solo avisa qué llaves cambiaron,
      await FirebaseRemoteConfig.addConfigUpdateListener(async (event, error) => {
        if (error || !event) {
          console.warn('[FeatureFlags] Error en actualización en tiempo real', error);
          return;
        }
        await FirebaseRemoteConfig.activate();
        await this.readFlags();
      });
    } catch (error) {
      console.warn('[FeatureFlags] Remote Config no disponible, se usan valores por defecto', error);
    }
  }

  private async readFlags(): Promise<void> {
    const [completedLast, categoryFromTask] = await Promise.all([
      FirebaseRemoteConfig.getBoolean({ key: FLAG_KEYS.completedLast }),
      FirebaseRemoteConfig.getBoolean({ key: FLAG_KEYS.categoryFromTask }),
    ]);

    console.log('====================================');
    console.log("Data de firebase:", completedLast, categoryFromTask);
    console.log('====================================');

    this._completedLast.set(completedLast.value);
    this._categoryFromTask.set(categoryFromTask.value);
  }
}
