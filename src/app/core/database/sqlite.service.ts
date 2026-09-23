import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DATABASE_NAME = 'todo_list_db';
const DATABASE_VERSION = 1;

/**
 * Punto único de acceso a SQLite: abre/reutiliza la conexión y crea el esquema
 * de la base de datos al iniciar la app.
 */
@Injectable({ providedIn: 'root' })
export class SqliteService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private connection?: SQLiteDBConnection;
  private readonly ready: Promise<SQLiteDBConnection> = this.initDatabase();

  /** Devuelve la conexión ya abierta, esperando a que la inicialización termine. */
  async getConnection(): Promise<SQLiteDBConnection> {
    return this.ready;
  }

  private async initDatabase(): Promise<SQLiteDBConnection> {
    const existingConnection = await this.sqlite.isConnection(DATABASE_NAME, false);
    this.connection = existingConnection.result
      ? await this.sqlite.retrieveConnection(DATABASE_NAME, false)
      : await this.sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', DATABASE_VERSION, false);

    await this.connection.open();

    // Esto es importante, es la configuración para que funcione el ON DELETE SET NULL
    await this.connection.execute('PRAGMA foreign_keys = ON;');

    await this.createSchema(this.connection);

    return this.connection;
  }

  private async createSchema(connection: SQLiteDBConnection): Promise<void> {
    const schema = `
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        completada INTEGER DEFAULT 0,
        categoria_id INTEGER,
        fecha_creacion TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tareas_categoria ON tareas(categoria_id);
    `;

    await connection.execute(schema);
  }
}
