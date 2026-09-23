import { NewTask, Task } from '../models/task.model';

// Filtro de tareas por categoria.
export type TaskCategoryFilter = { type: 'all' } | { type: 'none' } | { type: 'category'; categoryId: number };

/**
 * Contrato que debe cumplir cualquier fuente de datos de tareas (SQLite, memoria, etc).
 *
 * Se declara como abstract class (y no como interface) porque las interfaces de TypeScript
 * desaparecen al compilar; la clase abstracta existe en runtime y Angular la usa directamente
 * como llave de inyección, sin necesidad de un InjectionToken ni de importar Angular aquí.
 */
export abstract class TaskRepository {
  abstract getByFilter(filter: TaskCategoryFilter): Promise<Task[]>;
  abstract create(task: NewTask): Promise<Task>;
  abstract update(task: Task): Promise<void>;
  abstract delete(id: number): Promise<void>;
  abstract setCompleted(id: number, completed: boolean): Promise<void>;
}
