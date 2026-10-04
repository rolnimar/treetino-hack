import { z } from 'zod';
const errorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
});
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
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = errorSchema.safeParse(body);
    throw new ApiError(
      parsed.success ? String(parsed.data.message) : 'Backend request failed',
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
