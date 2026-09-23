import { TestBed } from '@angular/core/testing';

import { SqliteService } from '../../../core/database/sqlite.service';
import { TaskFilter } from '../domain/repositories/task.interface';
import { TaskSqliteRepository } from './task.impl';

/**
 * Pruebas de la lógica de negocio del repositorio de tareas.
 *
 * SQLite es un plugin nativo que no existe al correr las pruebas, así que se reemplaza
 * SqliteService por una conexión falsa. Las pruebas verifican qué SQL y qué parámetros
 * arma el repositorio (filtros, orden, paginación) y sus validaciones.
 *
 * Nota: la API es la misma de Jest; solo cambia `jest.fn()` por `vi.fn()`.
 */
describe('TaskSqliteRepository', () => {
  let repository: TaskSqliteRepository;
  let db: { query: ReturnType<typeof vi.fn>; run: ReturnType<typeof vi.fn> };

  // Filtro base: todas las tareas, más recientes primero.
  const allTasks: TaskFilter = { category: { type: 'all' }, status: 'all', order: 'recent' };
  const firstPage = { limit: 30, offset: 0 };

  // SQL y parámetros de la primera llamada a db.query().
  const lastQuery = () => ({ sql: db.query.mock.calls[0][0] as string, params: db.query.mock.calls[0][1] as unknown[] });

  beforeEach(() => {
    db = {
      query: vi.fn().mockResolvedValue({ values: [] }),
      run: vi.fn().mockResolvedValue({ changes: { lastId: 7 } }),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskSqliteRepository,
        { provide: SqliteService, useValue: { getConnection: () => Promise.resolve(db) } },
      ],
    });
    repository = TestBed.inject(TaskSqliteRepository);
  });

  describe('getByFilter', () => {
    it('sin filtros no agrega WHERE, ordena por fecha y pagina', async () => {
      await repository.getByFilter(allTasks, firstPage);

      const { sql, params } = lastQuery();
      expect(sql).not.toContain('WHERE');
      expect(sql).toContain('ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?');
      expect(params).toEqual([30, 0]);
    });

    it('"Sin categoría" filtra por categoria_id IS NULL', async () => {
      await repository.getByFilter({ ...allTasks, category: { type: 'none' } }, firstPage);

      expect(lastQuery().sql).toContain('WHERE categoria_id IS NULL');
    });

    it('combina categoría y estado con parámetros, en el mismo orden que los "?"', async () => {
      const filter: TaskFilter = { category: { type: 'category', categoryId: 4 }, status: 'done', order: 'recent' };
      await repository.getByFilter(filter, { limit: 30, offset: 60 });

      const { sql, params } = lastQuery();
      expect(sql).toContain('WHERE categoria_id = ? AND completada = ?');
      // categoryId, completada (done = 1), limit, offset
      expect(params).toEqual([4, 1, 30, 60]);
    });

    it('con el orden "pendingFirst" deja las completadas al final', async () => {
      await repository.getByFilter({ ...allTasks, order: 'pendingFirst' }, firstPage);

      expect(lastQuery().sql).toContain('ORDER BY completada ASC, fecha_creacion DESC');
    });

    it('convierte las filas de SQLite al modelo del dominio', async () => {
      db.query.mockResolvedValue({
        values: [{ id: 1, titulo: 'Pagar la luz', completada: 1, categoria_id: null, fecha_creacion: '2026-09-23' }],
      });

      const tasks = await repository.getByFilter(allTasks, firstPage);

      expect(tasks).toEqual([
        { id: 1, title: 'Pagar la luz', completed: true, categoryId: null, createdAt: '2026-09-23' },
      ]);
    });
  });

  describe('create', () => {
    it('guarda el título sin espacios sobrantes y devuelve la tarea con el id generado', async () => {
      const task = await repository.create({ title: '  Pagar la luz  ', categoryId: 2 });

      expect(db.run.mock.calls[0][1]).toEqual(['Pagar la luz', 2, expect.any(String)]);
      expect(task).toMatchObject({ id: 7, title: 'Pagar la luz', completed: false, categoryId: 2 });
    });

    it('rechaza un título vacío sin tocar la base de datos', async () => {
      await expect(repository.create({ title: '   ', categoryId: null })).rejects.toThrow(
        'El título de la tarea no puede estar vacío.',
      );
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rechaza un título vacío sin tocar la base de datos', async () => {
      const task = { id: 1, title: '', completed: false, categoryId: null, createdAt: '2026-09-23' };

      await expect(repository.update(task)).rejects.toThrow();
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('setCompleted', () => {
    it('guarda el estado como 1 / 0, porque SQLite no tiene tipo booleano', async () => {
      await repository.setCompleted(5, true);
      await repository.setCompleted(5, false);

      expect(db.run.mock.calls[0][1]).toEqual([1, 5]);
      expect(db.run.mock.calls[1][1]).toEqual([0, 5]);
    });
  });
});
