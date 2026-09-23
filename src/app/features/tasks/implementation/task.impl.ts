import { Injectable, inject } from '@angular/core';
import { SqliteService } from '../../../core/database/sqlite.service';
import { NewTask, Task } from '../domain/models/task.model';
import { TaskFilter, TaskRepository } from '../domain/repositories/task.interface';

interface TaskRow {
  id: number;
  titulo: string;
  completada: number;
  categoria_id: number | null;
  fecha_creacion: string;
}

/**
 * Implementación del repositorio de tareas.
 */
@Injectable()
export class TaskSqliteRepository implements TaskRepository {
  private readonly sqliteService = inject(SqliteService);

  async getByFilter(filter: TaskFilter): Promise<Task[]> {
    const db = await this.sqliteService.getConnection();

    // Los filtros se resuelven en SQL (no con .filter() en memoria) para traer solo las filas
    // necesarias. Las condiciones se arman dinámicamente y siempre con parámetros "?".
    const conditions: string[] = [];
    const params: (number | string)[] = [];

    switch (filter.category.type) {
      case 'none':
        conditions.push('categoria_id IS NULL');
        break;
      case 'category':
        // Consulta cubierta por idx_tareas_categoria.
        conditions.push('categoria_id = ?');
        params.push(filter.category.categoryId);
        break;
    }

    if (filter.status !== 'all') {
      conditions.push('completada = ?');
      params.push(filter.status === 'done' ? 1 : 0);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(`SELECT * FROM tareas ${where} ORDER BY fecha_creacion DESC;`, params);
    return this.mapRows(result.values);
  }

  async countPending(): Promise<number> {
    const db = await this.sqliteService.getConnection();
    const result = await db.query('SELECT COUNT(*) AS total FROM tareas WHERE completada = 0;');
    return (result.values?.[0] as { total: number } | undefined)?.total ?? 0;
  }

  async create(task: NewTask): Promise<Task> {
    const title = this.requireTitle(task.title);
    const db = await this.sqliteService.getConnection();
    const createdAt = new Date().toISOString();

    const result = await db.run('INSERT INTO tareas (titulo, completada, categoria_id, fecha_creacion) VALUES (?, 0, ?, ?);', [
      title,
      task.categoryId,
      createdAt,
    ]);

    return {
      id: result.changes?.lastId ?? 0,
      title,
      completed: false,
      categoryId: task.categoryId,
      createdAt,
    };
  }

  async update(task: Task): Promise<void> {
    const db = await this.sqliteService.getConnection();
    await db.run('UPDATE tareas SET titulo = ?, categoria_id = ? WHERE id = ?;', [
      this.requireTitle(task.title),
      task.categoryId,
      task.id,
    ]);
  }

  async delete(id: number): Promise<void> {
    const db = await this.sqliteService.getConnection();
    await db.run('DELETE FROM tareas WHERE id = ?;', [id]);
  }

  async setCompleted(id: number, completed: boolean): Promise<void> {
    const db = await this.sqliteService.getConnection();
    await db.run('UPDATE tareas SET completada = ? WHERE id = ?;', [completed ? 1 : 0, id]);
  }

  private requireTitle(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('El título de la tarea no puede estar vacío.');
    }
    return trimmed;
  }

  private mapRows(rows: TaskRow[] | undefined): Task[] {
    return (rows ?? []).map((row) => ({
      id: row.id,
      title: row.titulo,
      completed: row.completada === 1,
      categoryId: row.categoria_id,
      createdAt: row.fecha_creacion,
    }));
  }
}
