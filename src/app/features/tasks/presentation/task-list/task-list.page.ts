import { Component, inject, signal } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';

import { Category } from '../../../categories/domain/models/category.model';
import { CategoryRepository } from '../../../categories/domain/repositories/category.interface';
import { TaskCardComponent } from '../../../../shared/components/task-card/task-card.component';
import { Task } from '../../domain/models/task.model';
import { TaskCategoryFilter, TaskRepository } from '../../domain/repositories/task.interface';
import { TaskFormComponent } from '../task-form/task-form.component';

// tipo del filtro seleccionado en el <ion-select>: 'all', 'none' o el id de una categoría.
type FilterKey = 'all' | 'none' | number;

@Component({
  selector: 'app-task-list',
  templateUrl: 'task-list.page.html',
  styleUrls: ['task-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    TaskCardComponent,
  ],
})
export class TaskListPage implements ViewWillEnter {
  private readonly taskRepository = inject(TaskRepository);
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly tasks = signal<Task[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly selectedFilterKey = signal<FilterKey>('all');

  // Se ejecuta cada vez que la pestaña vuelve a mostrarse (no solo la primera vez).
  async ionViewWillEnter(): Promise<void> {
    this.categories.set(await this.categoryRepository.getAll());
    await this.loadTasks();
  }

  categoryOf(categoryId: number | null): Category | undefined {
    return this.categories().find((category) => category.id === categoryId);
  }

  async onFilterChange(value: FilterKey): Promise<void> {
    this.selectedFilterKey.set(value);
    await this.loadTasks();
  }

  async onAddTask(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskFormComponent,
      componentProps: { categories: this.categories() },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      await this.taskRepository.create(data);
      await this.loadTasks();
      await this.presentToast('Tarea creada.');
    }
  }

  async onEditTask(task: Task): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskFormComponent,
      componentProps: { categories: this.categories(), task },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' && data) {
      await this.taskRepository.update({ ...task, ...data });
      await this.loadTasks();
      await this.presentToast('Tarea actualizada.');
    }
  }

  async onToggleComplete(task: Task): Promise<void> {
    await this.taskRepository.setCompleted(task.id, !task.completed);
    await this.loadTasks();
  }

  async onDeleteTask(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar tarea',
      message: `¿Seguro que deseas eliminar "${task.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.taskRepository.delete(task.id);
            await this.loadTasks();
            await this.presentToast('Tarea eliminada.');
          },
        },
      ],
    });
    await alert.present();
  }

  private async loadTasks(): Promise<void> {
    this.loading.set(true);
    this.tasks.set(await this.taskRepository.getByFilter(this.buildFilter(this.selectedFilterKey())));
    this.loading.set(false);
  }

  private buildFilter(key: FilterKey): TaskCategoryFilter {
    if (key === 'all') return { type: 'all' };
    if (key === 'none') return { type: 'none' };
    return { type: 'category', categoryId: key };
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
