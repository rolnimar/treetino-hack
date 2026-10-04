import 'reflect-metadata';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { DatabaseConfig } from '../dist/database/database.config.js';

// Each test gets its own database. Never truncate or drop the developer database.
export async function testDatabase() {
  const base = new DatabaseConfig();
  const admin = postgres(process.env.TEST_DATABASE_URL ?? base.url, {
    max: 1,
    onnotice: () => {},
  });
  const name = 'treetino_test_' + randomUUID().replaceAll('-', '');
  try {
    await admin.unsafe(`CREATE DATABASE "${name}"`);
  } catch (error) {
    await admin.end();
    throw error;
  }
  const url = new URL(process.env.TEST_DATABASE_URL ?? base.url);
  url.pathname = '/' + name;
  const config = { ...base, url: url.toString() };
  const sql = postgres(config.url, { max: 1, onnotice: () => {} });
  return {
    config,
    sql,
    async cleanup() {
      await sql.end();
      try {
        await admin.unsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
      } finally {
        await admin.end();
      }
    },
  };
}
