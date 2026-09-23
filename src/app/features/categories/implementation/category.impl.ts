import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../../../core/database/sqlite.service';
import { Category, NewCategory } from '../domain/models/category.model';
import { CategoryRepository } from '../domain/repositories/category.interface';

// Forma cruda de una fila de la tabla "categorias".
interface CategoryRow {
  id: number;
  nombre: string;
  color: string | null;
}

/**
 * Implementación del repositorio de categorias.
 */
@Injectable()
export class CategorySqliteRepository implements CategoryRepository {
  private readonly sqliteService = inject(SqliteService);

  async getAll(): Promise<Category[]> {
    const db = await this.sqliteService.getConnection();
    const result = await db.query('SELECT * FROM categorias ORDER BY nombre ASC;');
    return this.mapRows(result.values);
  }

  async create(category: NewCategory): Promise<Category> {
    const name = this.requireName(category.name);
    const db = await this.sqliteService.getConnection();
    const result = await db.run('INSERT INTO categorias (nombre, color) VALUES (?, ?);', [name, category.color]);

    return { id: result.changes?.lastId ?? 0, name, color: category.color };
  }

  async update(category: Category): Promise<void> {
    const db = await this.sqliteService.getConnection();
    await db.run('UPDATE categorias SET nombre = ?, color = ? WHERE id = ?;', [
      this.requireName(category.name),
      category.color,
      category.id,
    ]);
  }

  async delete(id: number): Promise<void> {
    const db = await this.sqliteService.getConnection();
    await db.run('DELETE FROM categorias WHERE id = ?;', [id]);
  }

  private requireName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('El nombre de la categoría no puede estar vacío.');
    }
    return trimmed;
  }

  private mapRows(rows: CategoryRow[] | undefined): Category[] {
    return (rows ?? []).map((row) => ({ id: row.id, name: row.nombre, color: row.color }));
  }
}
