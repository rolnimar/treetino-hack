import { afterEach, expect, spyOn, test } from 'bun:test';
import { z } from 'zod';
import { api, ApiError } from '../src/lib/api';

let stub: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;
afterEach(() => stub?.mockRestore());

test('nullable API responses accept JSON null without a parsing error', async () => {
  stub = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(null));
  expect(
    await api(
      'admin/trees/test/mock-reporter',
      z.object({ wallet: z.string() }).nullable(),
    ),
  ).toBeNull();
});

test('empty responses identify the failing endpoint and preserve HTTP status', async () => {
  for (const status of [200, 401, 502]) {
    stub?.mockRestore();
    stub = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status }),
    );
    const error = await api('admin/trees/test/mock-reporter', z.null()).catch(
      (error) => error,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.message).toBe(
      `Backend returned an empty response for GET /api/admin/trees/test/mock-reporter (HTTP ${status})`,
    );
  }
});

test('proxy failures and non-JSON responses show useful errors without echoing response contents', async () => {
  stub = spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({ error: 'Backend unavailable' }, { status: 502 }),
  );
  await expect(api('admin/me', z.object({ id: z.string() }))).rejects.toThrow(
    'Backend unavailable',
  );
  stub.mockResolvedValue(
    new Response('<html>private upstream details</html>', { status: 503 }),
  );
  const error = await api('admin/me', z.null()).catch((error) => error);
  expect(error.message).toBe(
    'Backend returned invalid JSON for GET /api/admin/me (HTTP 503)',
  );
  expect(error.message).not.toContain('private');
});
