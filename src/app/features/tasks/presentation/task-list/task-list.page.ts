import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
  ModalController,
  ViewWillEnter,
} from '@ionic/angular';

import { FeatureFlagsService } from '../../../../core/feature-flags/feature-flags.service';
import { FeedbackService } from '../../../../core/feedback/feedback.service';
import { Category } from '../../../categories/domain/models/category.model';
import { CategoryRepository } from '../../../categories/domain/repositories/category.interface';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { CategoryChipComponent } from '../../../../shared/components/category-chip/category-chip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonListComponent } from '../../../../shared/components/skeleton-list/skeleton-list.component';
import { TaskCardComponent } from '../../../../shared/components/task-card/task-card.component';
import { NewTask, Task } from '../../domain/models/task.model';
import { TaskCategoryFilter, TaskFilter, TaskRepository, TaskStatusFilter } from '../../domain/repositories/task.interface';
import { TaskFormComponent } from '../task-form/task-form.component';

// Tareas por página: suficiente para llenar la pantalla con margen, sin cargar toda la tabla.
const PAGE_SIZE = 30;

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
    IonInfiniteScroll,
    IonInfiniteScrollContent,
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
  private readonly feedback = inject(FeedbackService);
  private readonly featureFlags = inject(FeatureFlagsService);

  readonly tasks = signal<Task[]>([]);
  readonly categories = signal<Category[]>([]);
  // Índice id → categoría: cada tarjeta resuelve su categoría en O(1) en vez de recorrer el arreglo
  // en cada render. Se recalcula solo cuando cambian las categorías.
  private readonly categoriesById = computed(() => new Map(this.categories().map((category) => [category.id, category])));
  readonly pendingCount = signal(0);
  // Solo es true durante la primera carga; las recargas posteriores no muestran el skeleton.
  readonly loading = signal(true);
  readonly status = signal<TaskStatusFilter>('all');
  readonly categoryKey = signal<CategoryKey>('all');
  // false cuando la última página trajo menos de PAGE_SIZE filas: ya no hay más que pedir.
  readonly hasMore = signal(false);

  // Identifica la consulta más reciente. Si los filtros cambian mientras otra consulta sigue en curso,
  // su respuesta (ya obsoleta) se descarta en lugar de pisar la lista nueva.
  private requestId = 0;

  readonly subtitle = computed(() => {
    const count = this.pendingCount();
    if (count === 0) return 'Todo listo';
    return count === 1 ? '1 tarea pendiente' : `${count} tareas pendientes`;
  });

  // Distingue "no hay ninguna tarea" de "ninguna tarea coincide con los filtros".
  readonly isUnfiltered = computed(() => this.status() === 'all' && this.categoryKey() === 'all');

  constructor() {
    // Remote Config puede cambiar el orden en vivo; al cambiar el flag se vuelve a consultar SQLite.
    // La primera carga la hace ionViewWillEnter, por eso se ignora mientras loading es true.
    effect(() => {
      this.featureFlags.completedLast();
      // untracked: loadTasks lee otros filtros que no deben disparar este effect.
      untracked(() => {
        if (!this.loading()) {
          this.refreshTasks();
        }
      });
    });
  }

  // Se ejecuta cada vez que la pestaña vuelve a mostrarse (no solo la primera vez).
  async ionViewWillEnter(): Promise<void> {
    await this.reloadCategories();

    // Si la categoría filtrada se eliminó desde la otra pestaña, se vuelve a "Todas".
    const key = this.categoryKey();
    if (typeof key === 'number' && !this.categories().some((category) => category.id === key)) {
      this.categoryKey.set('all');
      await this.loadTasks();
      return;
    }

    // Al volver a la pestaña se conservan las páginas ya cargadas (y la posición del scroll).
    await this.refreshTasks();
  }

  categoryOf(categoryId: number | null): Category | undefined {
    return categoryId === null ? undefined : this.categoriesById().get(categoryId);
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
      await this.feedback.attempt(
        async () => {
          await this.taskRepository.create(data);
          await this.refreshTasks();
        },
        { success: 'Tarea creada', error: 'No se pudo crear la tarea' },
      );
    }
  }

  async onEditTask(task: Task): Promise<void> {
    const data = await this.openForm(task);
    if (data) {
      await this.feedback.attempt(
        async () => {
          await this.taskRepository.update({ ...task, ...data });
          await this.refreshTasks();
        },
        { success: 'Tarea actualizada', error: 'No se pudo actualizar la tarea' },
      );
    }
  }

  async onToggleComplete(task: Task): Promise<void> {
    await this.feedback.attempt(
      async () => {
        await this.taskRepository.setCompleted(task.id, !task.completed);
        await this.refreshTasks();
      },
      { error: 'No se pudo actualizar la tarea' },
    );
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
            await this.feedback.attempt(
              async () => {
                await this.taskRepository.delete(task.id);
                await this.refreshTasks();
              },
              { success: 'Tarea eliminada', error: 'No se pudo eliminar la tarea' },
            );
          },
        },
      ],
    });
    await alert.present();
  }

  /** Infinite scroll: trae la siguiente página a partir de las filas ya cargadas. */
  async onLoadMore(event: InfiniteScrollCustomEvent): Promise<void> {
    const requestId = this.requestId;
    try {
      const page = await this.taskRepository.getByFilter(this.currentFilter(), {
        limit: PAGE_SIZE,
        offset: this.tasks().length,
      });

      // Si mientras tanto cambió un filtro o se refrescó la lista, esta página ya no aplica.
      if (requestId === this.requestId) {
        this.tasks.update((tasks) => [...tasks, ...page]);
        this.hasMore.set(page.length === PAGE_SIZE);
      }
    } catch (error) {
      await this.feedback.error('No se pudieron cargar más tareas', error);
    } finally {
      // Siempre se libera el spinner, incluso si la consulta falló.
      await event.target.complete();
    }
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
    // El formulario puede haber creado una categoría nueva (flag category_create_from_task),
    // incluso si luego se canceló la tarea; se recargan para mostrarla en los filtros.
    await this.reloadCategories();
    return role === 'save' ? data : null;
  }

  /** Primera página: al entrar o al cambiar un filtro. */
  private async loadTasks(): Promise<void> {
    await this.fetchTasks(PAGE_SIZE);
  }

  /**
   * Tras crear/editar/eliminar/marcar, vuelve a consultar solo las filas que ya estaban cargadas.
   * Así el orden queda correcto (p. ej. la tarea completada baja con el flag completedLast)
   * sin reordenar a mano en memoria y sin perder las páginas que el usuario ya recorrió.
   */
  private async refreshTasks(): Promise<void> {
    await this.fetchTasks(Math.max(this.tasks().length, PAGE_SIZE));
  }

  private async fetchTasks(limit: number): Promise<void> {
    const requestId = ++this.requestId;
    try {
      const [tasks, pendingCount] = await Promise.all([
        this.taskRepository.getByFilter(this.currentFilter(), { limit, offset: 0 }),
        this.taskRepository.countPending(),
      ]);

      // Una consulta más nueva ya está en curso (el usuario cambió de filtro): se descarta esta respuesta.
      if (requestId !== this.requestId) {
        return;
      }
      this.tasks.set(tasks);
      this.hasMore.set(tasks.length === limit);
      this.pendingCount.set(pendingCount);
    } catch (error) {
      await this.feedback.error('No se pudieron cargar las tareas', error);
    } finally {
      // Sin esto, un error en la primera carga dejaría el skeleton visible para siempre.
      if (requestId === this.requestId) {
        this.loading.set(false);
      }
    }
  }

  private async reloadCategories(): Promise<void> {
    try {
      this.categories.set(await this.categoryRepository.getAll());
    } catch (error) {
      await this.feedback.error('No se pudieron cargar las categorías', error);
    }
  }

  private currentFilter(): TaskFilter {
    return {
      category: this.buildCategoryFilter(this.categoryKey()),
      status: this.status(),
      order: this.featureFlags.completedLast() ? 'pendingFirst' : 'recent',
    };
  }

  private buildCategoryFilter(key: CategoryKey): TaskCategoryFilter {
    if (key === 'all') return { type: 'all' };
    if (key === 'none') return { type: 'none' };
    return { type: 'category', categoryId: key };
  }
}
