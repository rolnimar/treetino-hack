import { generateKeyPairSync, sign } from 'node:crypto';
import bs58 from 'bs58';
import { SignJWT } from 'jose';
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
    const previousSecret = process.env.AUTH_JWT_SECRET;
    process.env.AUTH_JWT_SECRET = 'test-only-secret-32-bytes-or-longer';
    const previousEnabled = process.env.INDEXER_ENABLED;
    database = await testDatabase();
    const previousPath = process.env.DATABASE_URL;
    process.env.INDEXER_ENABLED = 'false';
    process.env.DATABASE_URL = database.config.url;
    try {
      app = await createApplication({ logger: false });
    } finally {
      if (previousSecret === undefined) delete process.env.AUTH_JWT_SECRET;
      else process.env.AUTH_JWT_SECRET = previousSecret;
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

  test('wallet challenge, JWT guard, replay protection and revocation', async () => {
    const keys = generateKeyPairSync('ed25519');
    const wallet = bs58.encode(
      keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32),
    );
    const post = (path: string, body: unknown) =>
      fetch(baseUrl + '/api/' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const me = (token?: string) =>
      fetch(baseUrl + '/api/admin/me', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
    expect((await me()).status).toBe(401);
    expect((await me('garbage')).status).toBe(401);
    expect((await post('auth/challenge', { wallet: 'invalid' })).status).toBe(
      400,
    );
    expect((await post('auth/login', {})).status).toBe(400);
    const challenge = async () => {
      const response = await post('auth/challenge', { wallet });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain(wallet);
      const signature = bs58.encode(
        sign(null, Buffer.from(data.message), keys.privateKey),
      );
      return { challengeId: data.id, wallet, signature };
    };
    const unauthorized = await challenge();
    expect((await post('auth/login', unauthorized)).status).toBe(403);
    const [admin] =
      await database.sql`INSERT INTO admins (wallet) VALUES (${wallet}) RETURNING id, wallet`;
    expect(admin.id).toMatch(/^[0-9a-f-]{36}$/);
    const input = await challenge();
    const other = generateKeyPairSync('ed25519');
    const [row] =
      await database.sql`SELECT message FROM auth_challenges WHERE id = ${input.challengeId}`;
    expect(
      (
        await post('auth/login', {
          ...input,
          signature: bs58.encode(
            sign(null, Buffer.from(row.message), other.privateKey),
          ),
        })
      ).status,
    ).toBe(401);
    expect(
      (await post('auth/login', { ...input, signature: '!malformed' })).status,
    ).toBe(401);
    const results = await Promise.all([
      post('auth/login', input),
      post('auth/login', input),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 401]);
    const session = await results.find((r) => r.status === 201)!.json();
    expect(session.admin).toEqual({ id: admin.id, wallet });
    expect((await me(session.accessToken)).status).toBe(200);
    expect((await me(session.accessToken.slice(0, -4) + 'abcd')).status).toBe(
      401,
    );
    const expiredToken = await new SignJWT({ wallet, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(admin.id)
      .setIssuer('treetino')
      .setAudience('treetino-admin')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode('test-only-secret-32-bytes-or-longer'));
    expect((await me(expiredToken)).status).toBe(401);
    const expiredChallenge = await challenge();
    await database.sql`UPDATE auth_challenges SET expires_at = 0 WHERE id = ${expiredChallenge.challengeId}`;
    expect((await post('auth/login', expiredChallenge)).status).toBe(401);
    await database.sql`DELETE FROM admins WHERE id = ${admin.id}`;
    expect((await me(session.accessToken)).status).toBe(403);
    let rateLimited = false;
    for (let attempt = 0; attempt < 21; attempt++) {
      if ((await post('auth/challenge', { wallet })).status === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
    expect((await fetch(baseUrl + '/api/trees')).status).toBe(200);
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
      '/api/admin/me',
      '/api/auth/challenge',
      '/api/auth/login',
      '/api/events',
      '/api/events/status',
      '/api/health',
      '/api/protocol',
      '/api/trees',
      '/api/victron/demos',
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
