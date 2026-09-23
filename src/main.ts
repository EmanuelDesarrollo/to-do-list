import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkboxOutline, checkmark, pricetagsOutline, trashOutline } from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { CategoryRepository } from './app/features/categories/domain/repositories/category.interface';
import { CategorySqliteRepository } from './app/features/categories/implementation/category.impl';
import { TaskRepository } from './app/features/tasks/domain/repositories/task.interface';
import { TaskSqliteRepository } from './app/features/tasks/implementation/task.impl';

// Registro único de todos los íconos que usa la app.
addIcons({ add, checkboxOutline, checkmark, pricetagsOutline, trashOutline });

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    { provide: TaskRepository, useClass: TaskSqliteRepository },
    { provide: CategoryRepository, useClass: CategorySqliteRepository },
  ],
});
