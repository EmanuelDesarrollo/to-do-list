import { SQLiteDBConnection } from '@capacitor-community/sqlite';

const SEED_COUNT = 500;
const SEED_TITLE_PREFIX = 'Tarea de prueba';

/**
 * Solo desarrollo: inserta tareas de prueba sin categoría para probar la paginación
 * (infinite scroll) con volumen. Se activa con environment.seedDemoTasks.
 *
 * - Es idempotente: si ya existen tareas de prueba, no vuelve a insertar.
 * - Una sola sentencia con un CTE recursivo que genera la secuencia 1..500 dentro de SQLite,
 *   en lugar de 500 INSERT desde JavaScript (una sola llamada al puente nativo).
 * - 1 de cada 3 queda completada, para probar también el flag tasks_completed_last.
 * - Fechas escalonadas por minuto hacia atrás para que el orden por fecha sea estable.
 *
 * Para eliminarlas: DELETE FROM tareas WHERE titulo LIKE 'Tarea de prueba %';
 */
export async function seedDemoTasks(connection: SQLiteDBConnection): Promise<void> {
  const existing = await connection.query('SELECT COUNT(*) AS total FROM tareas WHERE titulo LIKE ?;', [
    `${SEED_TITLE_PREFIX} %`,
  ]);
  if (((existing.values?.[0] as { total: number } | undefined)?.total ?? 0) > 0) {
    return;
  }

  await connection.run(
    `WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ?)
     INSERT INTO tareas (titulo, completada, categoria_id, fecha_creacion)
     SELECT ? || ' ' || n, CASE WHEN n % 3 = 0 THEN 1 ELSE 0 END, NULL,
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-' || n || ' minutes')
     FROM seq;`,
    [SEED_COUNT, SEED_TITLE_PREFIX],
  );
}
