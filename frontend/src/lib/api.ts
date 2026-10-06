import { z } from 'zod';
const errorSchema = z.union([
  z
    .object({ message: z.union([z.string(), z.array(z.string())]) })
    .transform(({ message }) => String(message)),
  z.object({ error: z.string() }).transform(({ error }) => error),
]);
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
) {
  const response = await fetch(`/api/${path}`, options);
  const text = await response.text();
  const request = `${options.method ?? 'GET'} /api/${path} (HTTP ${response.status})`;
  if (!text.trim())
    throw new ApiError(
      `Backend returned an empty response for ${request}`,
      response.status,
    );
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(
      `Backend returned invalid JSON for ${request}`,
      response.status,
    );
  }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? parsed.data : `Backend request failed: ${request}`,
      response.status,
    );
  }
  return schema.parse(body);
}
export function jsonBody(value: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  };
}
