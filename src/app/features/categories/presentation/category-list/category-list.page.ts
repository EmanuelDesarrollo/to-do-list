import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';

import { TaskRepository } from '../../../tasks/domain/repositories/task.interface';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { NEUTRAL_CATEGORY_COLOR } from '../../../../shared/components/color-palette-picker/color-palette-picker.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonListComponent } from '../../../../shared/components/skeleton-list/skeleton-list.component';
import { Category, CategoryWithCount, NewCategory } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/repositories/category.interface';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-category-list',
  templateUrl: 'category-list.page.html',
  styleUrls: ['category-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    AppHeaderComponent,
    EmptyStateComponent,
    SkeletonListComponent,
  ],
})
export class CategoryListPage implements ViewWillEnter {
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly taskRepository = inject(TaskRepository);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly neutralColor = NEUTRAL_CATEGORY_COLOR;
  readonly categories = signal<CategoryWithCount[]>([]);
  readonly pendingCount = signal(0);
  // Solo es true durante la primera carga; las recargas posteriores no muestran el skeleton.
  readonly loading = signal(true);

  readonly subtitle = computed(() => {
    const count = this.pendingCount();
    if (count === 0) return 'Todo listo';
    return count === 1 ? '1 tarea pendiente' : `${count} tareas pendientes`;
  });

  // Se recarga al volver a la pestaña para reflejar tareas creadas/eliminadas en la otra.
  async ionViewWillEnter(): Promise<void> {
    await this.loadCategories();
  }

  countLabel(category: CategoryWithCount): string {
    return category.taskCount === 1 ? '1 tarea' : `${category.taskCount} tareas`;
  }

  async onAddCategory(): Promise<void> {
    const data = await this.openForm();
    if (data) {
      await this.categoryRepository.create(data);
      await this.loadCategories();
      await this.presentToast('Categoría creada');
    }
  }

  async onEditCategory(category: CategoryWithCount): Promise<void> {
    const data = await this.openForm(category);
    if (data) {
      await this.categoryRepository.update({ id: category.id, ...data });
      await this.loadCategories();
      await this.presentToast('Categoría actualizada');
    }
  }

  async onDeleteCategory(category: CategoryWithCount): Promise<void> {
    const detail =
      category.taskCount === 0
        ? 'Esta acción no se puede deshacer.'
        : `${this.countLabel(category)} quedará${category.taskCount === 1 ? '' : 'n'} sin categoría.`;

    const alert = await this.alertController.create({
      cssClass: 'app-confirm',
      header: '¿Eliminar categoría?',
      message: `"${category.name}" se eliminará. ${detail}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            // Las tareas asociadas quedan sin categoría vía ON DELETE SET NULL en SQLite.
            await this.categoryRepository.delete(category.id);
            await this.loadCategories();
            await this.presentToast('Categoría eliminada');
          },
        },
      ],
    });
    await alert.present();
  }

  private async openForm(category?: Category): Promise<NewCategory | null> {
    const modal = await this.modalController.create({
      component: CategoryFormComponent,
      componentProps: { category },
      cssClass: 'app-sheet',
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    return role === 'save' ? data : null;
  }

  private async loadCategories(): Promise<void> {
    const [categories, pendingCount] = await Promise.all([
      this.categoryRepository.getAllWithTaskCount(),
      this.taskRepository.countPending(),
    ]);
    this.categories.set(categories);
    this.pendingCount.set(pendingCount);
    this.loading.set(false);
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      positionAnchor: 'app-tab-bar',
      cssClass: 'app-toast',
    });
    await toast.present();
  }
}
