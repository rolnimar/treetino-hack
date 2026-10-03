import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  TREETINO_PROGRAM_ID,
  type ApiHealth,
  type ProtocolInfo,
} from '@treetino/contracts';
import { createApplication } from '../dist/application.js';

describe('compiled NestJS application running on Bun', () => {
  let app: Awaited<ReturnType<typeof createApplication>>;
  let baseUrl: string;

  beforeAll(async () => {
    app = await createApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });
  afterAll(async () => {
    await app.close();
  });

  test('serves the health endpoint', async () => {
    const response = await fetch(baseUrl + '/api/health');
    expect(response.status).toBe(200);
    expect((await response.json()) as ApiHealth).toEqual({
      status: 'ok',
      service: 'treetino-backend',
    });
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
});
