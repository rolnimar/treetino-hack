import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { DatabaseConfig } from './database.config';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: PostgresJsDatabase<typeof schema>;
  private readonly client;

  private constructor(config: DatabaseConfig) {
    this.client = postgres(config.url, {
      max: 10,
      connect_timeout: 10,
      connection: { search_path: config.schema },
      onnotice: () => {},
    });
    this.db = drizzle({ client: this.client, schema });
  }

  static async create(config: DatabaseConfig) {
    // A single-connection pool keeps the session lock across migration statements.
    // Concurrent backend starts cannot apply the same migration twice.
    const client = postgres(config.url, {
      max: 1,
      connect_timeout: 10,
      connection: { search_path: config.schema },
      onnotice: () => {},
    });
    try {
      await client`SELECT pg_advisory_lock(hashtext(${`treetino-migrations:${config.schema}`}))`;
      await migrate(drizzle(client), {
        migrationsFolder: config.migrationsFolder,
        migrationsSchema:
          config.schema === 'public' ? 'drizzle' : config.schema,
      });
    } finally {
      // Closing the session releases the advisory lock on success or failure.
      await client.end();
    }
    return new DatabaseService(config);
  }

  async onApplicationShutdown() {
    await this.client.end();
  }
}
