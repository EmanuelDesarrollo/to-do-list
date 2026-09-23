import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { FeatureFlagsService } from './core/feature-flags/feature-flags.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Se instancia al arrancar para aplicar el tema antes de pintar la primera pantalla.
    inject(ThemeService);
    // Se instancia al arrancar para empezar a traer los valores de Firebase Remote Config.
    inject(FeatureFlagsService);
  }
}
