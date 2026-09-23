import { Category, CategoryWithCount, NewCategory } from '../models/category.model';

/**
 * Contrato que debe cumplir cualquier fuente de datos de categorías (SQLite, memoria, etc).
 *
 * Se declara como abstract class (y no como interface) porque las interfaces de TypeScript
 * desaparecen al compilar; la clase abstracta existe en runtime y Angular la usa directamente
 * como llave de inyección, sin necesidad de un InjectionToken ni de importar Angular aquí.
 */
export abstract class CategoryRepository {
  abstract getAll(): Promise<Category[]>;
  abstract getAllWithTaskCount(): Promise<CategoryWithCount[]>;
  abstract create(category: NewCategory): Promise<Category>;
  abstract update(category: Category): Promise<void>;
  abstract delete(id: number): Promise<void>;
}
