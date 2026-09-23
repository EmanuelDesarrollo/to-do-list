import { NewTask, Task } from '../models/task.model';

// Filtro de tareas por categoria.
export type TaskCategoryFilter = { type: 'all' } | { type: 'none' } | { type: 'category'; categoryId: number };

// Filtro de tareas por estado.
export type TaskStatusFilter = 'all' | 'pending' | 'done';

// Orden de la lista: más recientes primero, o pendientes primero (y dentro de cada grupo, más recientes).
export type TaskOrder = 'recent' | 'pendingFirst';

// Combinación de filtros y orden; se resuelven juntos en una sola consulta.
export interface TaskFilter {
  category: TaskCategoryFilter;
  status: TaskStatusFilter;
  order: TaskOrder;
}

/**
 * Contrato que debe cumplir cualquier fuente de datos de tareas (SQLite, memoria, etc).
 *
 * Se declara como abstract class (y no como interface) porque las interfaces de TypeScript
 * desaparecen al compilar; la clase abstracta existe en runtime y Angular la usa directamente
 * como llave de inyección, sin necesidad de un InjectionToken ni de importar Angular aquí.
 */
export abstract class TaskRepository {
  abstract getByFilter(filter: TaskFilter): Promise<Task[]>;
  abstract countPending(): Promise<number>;
  abstract create(task: NewTask): Promise<Task>;
  abstract update(task: Task): Promise<void>;
  abstract delete(id: number): Promise<void>;
  abstract setCompleted(id: number, completed: boolean): Promise<void>;
}
