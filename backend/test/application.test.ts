import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  TREETINO_PROGRAM_ID,
  type ApiHealth,
  type ProtocolInfo,
} from '@treetino/contracts';
import { testDatabase } from './database.fixture';
import { createApplication } from '../dist/application.js';

describe('compiled NestJS application running on Bun', () => {
  let app: Awaited<ReturnType<typeof createApplication>>;
  let baseUrl: string;
  let database: Awaited<ReturnType<typeof testDatabase>>;

  beforeAll(async () => {
    const previousEnabled = process.env.INDEXER_ENABLED;
    database = await testDatabase();
    const previousPath = process.env.DATABASE_URL;
    process.env.INDEXER_ENABLED = 'false';
    process.env.DATABASE_URL = database.config.url;
    try {
      app = await createApplication({ logger: false });
    } finally {
      if (previousEnabled === undefined) delete process.env.INDEXER_ENABLED;
      else process.env.INDEXER_ENABLED = previousEnabled;
      if (previousPath === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousPath;
    }
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });
  afterAll(async () => {
    await app.close();
    await database.cleanup();
  });

  test('serves the health endpoint', async () => {
    const response = await fetch(baseUrl + '/api/health');
    expect(response.status).toBe(200);
    expect((await response.json()) as ApiHealth).toEqual({
      status: 'ok',
      service: 'treetino-backend',
    });
  });

  test('serves Swagger UI, assets, and documented API schemas', async () => {
    const ui = await fetch(baseUrl + '/api/docs');
    expect(ui.status).toBe(200);
    expect(await ui.text()).toContain('swagger-ui');
    expect(
      (await fetch(baseUrl + '/api/docs/swagger-ui-bundle.js')).status,
    ).toBe(200);
    const response = await fetch(baseUrl + '/api/docs-json');
    expect(response.status).toBe(200);
    const document = await response.json();
    expect(Object.keys(document.paths).sort()).toEqual([
      '/api/events',
      '/api/events/status',
      '/api/health',
      '/api/protocol',
      '/api/trees',
    ]);
    const parameters = document.paths['/api/trees'].get.parameters;
    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === 'phase',
      ).schema.enum,
    ).toEqual(['funding', 'funded', 'purchased', 'active']);
    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === 'limit',
      ).schema,
    ).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      default: 100,
    });
    expect(document.components.schemas.TreeDto.properties.target.type).toBe(
      'string',
    );
    expect(document.components.schemas.TreeDto.properties.id.format).toBe(
      'uuid',
    );
    expect(
      document.components.schemas.IndexerStatusDto.properties.cursor.nullable,
    ).toBe(true);
  });

  test('resolves Nest dependency injection and uses the generated program address', async () => {
    const response = await fetch(baseUrl + '/api/protocol');
    expect(response.status).toBe(200);
    expect((await response.json()) as ProtocolInfo).toEqual({
      name: 'treetino',
      network: 'devnet',
      programId: TREETINO_PROGRAM_ID,
    });
  });

  test('serves indexer status and validates history pagination', async () => {
    const status = await fetch(baseUrl + '/api/events/status');
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({
      enabled: false,
      cursor: null,
      events: 0,
    });
    expect(await (await fetch(baseUrl + '/api/events')).json()).toEqual({
      events: [],
      nextCursor: 0,
    });
    for (const query of ['after=-1', 'limit=1001', 'after=1.5', 'limit=abc']) {
      expect((await fetch(baseUrl + '/api/events?' + query)).status).toBe(400);
    }
  });
});
