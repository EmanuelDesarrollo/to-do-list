import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
  ModalController,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';

import { Category } from '../../../categories/domain/models/category.model';
import { CategoryRepository } from '../../../categories/domain/repositories/category.interface';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { CategoryChipComponent } from '../../../../shared/components/category-chip/category-chip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonListComponent } from '../../../../shared/components/skeleton-list/skeleton-list.component';
import { TaskCardComponent } from '../../../../shared/components/task-card/task-card.component';
import { NewTask, Task } from '../../domain/models/task.model';
import { TaskCategoryFilter, TaskRepository, TaskStatusFilter } from '../../domain/repositories/task.interface';
import { TaskFormComponent } from '../task-form/task-form.component';

// Chip de categoría seleccionado: 'all', 'none' (sin categoría) o el id de una categoría.
type CategoryKey = 'all' | 'none' | number;

@Component({
  selector: 'app-task-list',
  templateUrl: 'task-list.page.html',
  styleUrls: ['task-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonList,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    AppHeaderComponent,
    CategoryChipComponent,
    EmptyStateComponent,
    SkeletonListComponent,
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
  readonly pendingCount = signal(0);
  // Solo es true durante la primera carga; las recargas posteriores no muestran el skeleton.
  readonly loading = signal(true);
  readonly status = signal<TaskStatusFilter>('all');
  readonly categoryKey = signal<CategoryKey>('all');

  readonly subtitle = computed(() => {
    const count = this.pendingCount();
    if (count === 0) return 'Todo listo';
    return count === 1 ? '1 tarea pendiente' : `${count} tareas pendientes`;
  });

  // Distingue "no hay ninguna tarea" de "ninguna tarea coincide con los filtros".
  readonly isUnfiltered = computed(() => this.status() === 'all' && this.categoryKey() === 'all');

  // Se ejecuta cada vez que la pestaña vuelve a mostrarse (no solo la primera vez).
  async ionViewWillEnter(): Promise<void> {
    this.categories.set(await this.categoryRepository.getAll());

    // Si la categoría filtrada se eliminó desde la otra pestaña, se vuelve a "Todas".
    const key = this.categoryKey();
    if (typeof key === 'number' && !this.categories().some((category) => category.id === key)) {
      this.categoryKey.set('all');
    }

    await this.loadTasks();
  }

  categoryOf(categoryId: number | null): Category | undefined {
    return this.categories().find((category) => category.id === categoryId);
  }

  async onStatusChange(value: TaskStatusFilter): Promise<void> {
    this.status.set(value);
    await this.loadTasks();
  }

  async onCategoryChange(key: CategoryKey): Promise<void> {
    this.categoryKey.set(key);
    await this.loadTasks();
  }

  async onAddTask(): Promise<void> {
    const data = await this.openForm();
    if (data) {
      await this.taskRepository.create(data);
      await this.loadTasks();
      await this.presentToast('Tarea creada');
    }
  }

  async onEditTask(task: Task): Promise<void> {
    const data = await this.openForm(task);
    if (data) {
      await this.taskRepository.update({ ...task, ...data });
      await this.loadTasks();
      await this.presentToast('Tarea actualizada');
    }
  }

  async onToggleComplete(task: Task): Promise<void> {
    await this.taskRepository.setCompleted(task.id, !task.completed);
    await this.loadTasks();
  }

  async onDeleteTask(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      cssClass: 'app-confirm',
      header: '¿Eliminar tarea?',
      message: `"${task.title}" se eliminará. Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.taskRepository.delete(task.id);
            await this.loadTasks();
            await this.presentToast('Tarea eliminada');
          },
        },
      ],
    });
    await alert.present();
  }

  private async openForm(task?: Task): Promise<NewTask | null> {
    const modal = await this.modalController.create({
      component: TaskFormComponent,
      componentProps: { categories: this.categories(), task },
      cssClass: 'app-sheet',
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    return role === 'save' ? data : null;
  }

  private async loadTasks(): Promise<void> {
    const filter = { category: this.buildCategoryFilter(this.categoryKey()), status: this.status() };
    const [tasks, pendingCount] = await Promise.all([
      this.taskRepository.getByFilter(filter),
      this.taskRepository.countPending(),
    ]);
    this.tasks.set(tasks);
    this.pendingCount.set(pendingCount);
    this.loading.set(false);
  }

  private buildCategoryFilter(key: CategoryKey): TaskCategoryFilter {
    if (key === 'all') return { type: 'all' };
    if (key === 'none') return { type: 'none' };
    return { type: 'category', categoryId: key };
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
