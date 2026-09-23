import { TestBed } from '@angular/core/testing';

import { SqliteService } from '../../../core/database/sqlite.service';
import { CategorySqliteRepository } from './category.impl';

/**
 * Pruebas de la lógica de negocio del repositorio de categorías.
 *
 * Igual que en las tareas, SqliteService se reemplaza por una conexión falsa:
 * se verifican las validaciones, la conversión de filas y el SQL que se ejecuta.
 */
describe('CategorySqliteRepository', () => {
  let repository: CategorySqliteRepository;
  let db: { query: ReturnType<typeof vi.fn>; run: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    db = {
      query: vi.fn().mockResolvedValue({ values: [] }),
      run: vi.fn().mockResolvedValue({ changes: { lastId: 3 } }),
    };

    TestBed.configureTestingModule({
      providers: [
        CategorySqliteRepository,
        { provide: SqliteService, useValue: { getConnection: () => Promise.resolve(db) } },
      ],
    });
    repository = TestBed.inject(CategorySqliteRepository);
  });

  describe('create', () => {
    it('guarda el nombre sin espacios sobrantes y devuelve la categoría con el id generado', async () => {
      const category = await repository.create({ name: '  Trabajo ', color: '#6c8a95' });

      expect(db.run.mock.calls[0][1]).toEqual(['Trabajo', '#6c8a95']);
      expect(category).toEqual({ id: 3, name: 'Trabajo', color: '#6c8a95' });
    });

    it('rechaza un nombre vacío sin tocar la base de datos', async () => {
      await expect(repository.create({ name: '  ', color: null })).rejects.toThrow(
        'El nombre de la categoría no puede estar vacío.',
      );
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rechaza un nombre vacío sin tocar la base de datos', async () => {
      await expect(repository.update({ id: 1, name: '', color: null })).rejects.toThrow();
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('getAllWithTaskCount', () => {
    it('convierte las filas de SQLite, incluido el conteo de tareas', async () => {
      db.query.mockResolvedValue({ values: [{ id: 1, nombre: 'Casa', color: null, total_tareas: 4 }] });

      const categories = await repository.getAllWithTaskCount();

      expect(categories).toEqual([{ id: 1, name: 'Casa', color: null, taskCount: 4 }]);
    });
  });

  describe('delete', () => {
    it('solo elimina la categoría: sus tareas quedan sin categoría por ON DELETE SET NULL', async () => {
      await repository.delete(9);

      // Una sola sentencia: el repositorio no actualiza las tareas a mano, eso lo hace SQLite.
      expect(db.run).toHaveBeenCalledTimes(1);
      expect(db.run).toHaveBeenCalledWith('DELETE FROM categorias WHERE id = ?;', [9]);
    });
  });
});
