import { Component, OnInit, inject, signal } from '@angular/core';
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
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular';

import { CategoryChipComponent } from '../../../../shared/components/category-chip/category-chip.component';
import { Category } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/repositories/category.interface';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-category-list',
  templateUrl: 'category-list.page.html',
  styleUrls: ['category-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonSpinner,
    CategoryChipComponent,
  ],
})
export class CategoryListPage implements OnInit {
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
  }

  async onAddCategory(): Promise<void> {
    const modal = await this.modalController.create({ component: CategoryFormComponent });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      await this.categoryRepository.create(data);
      await this.loadCategories();
      await this.presentToast('Categoría creada.');
    }
  }

  async onEditCategory(category: Category): Promise<void> {
    const modal = await this.modalController.create({
      component: CategoryFormComponent,
      componentProps: { category },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      await this.categoryRepository.update({ ...category, ...data });
      await this.loadCategories();
      await this.presentToast('Categoría actualizada.');
    }
  }

  async onDeleteCategory(category: Category): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar categoría',
      message: `Las tareas de "${category.name}" quedarán sin categoría. ¿Deseas continuar?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.categoryRepository.delete(category.id);
            await this.loadCategories();
            await this.presentToast('Categoría eliminada.');
          },
        },
      ],
    });
    await alert.present();
  }

  private async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.categories.set(await this.categoryRepository.getAll());
    this.loading.set(false);
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
