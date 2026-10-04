import 'reflect-metadata';
import { DatabaseConfig } from '../src/database/database.config';
import { DatabaseService } from '../src/database/database.service';

const database = await DatabaseService.create(new DatabaseConfig());
await database.onApplicationShutdown();
console.log('PostgreSQL migrations applied');
