import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('./dist/', import.meta.url));
const backend = new URL(process.env.BACKEND_URL ?? 'http://localhost:3000');
const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid PORT');
if (!['http:', 'https:'].includes(backend.protocol))
  throw new Error('Invalid BACKEND_URL');

Bun.serve({
  hostname: '0.0.0.0',
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ status: 'ok' });
    if (url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, backend);
      const headers = new Headers(request.headers);
      headers.delete('host');
      try {
        return await fetch(target, {
          method: request.method,
          headers,
          body: request.body,
          redirect: 'manual',
        });
      } catch {
        return Response.json({ error: 'Backend unavailable' }, { status: 502 });
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }
    let path: string;
    try {
      path = resolve(dist, '.' + decodeURIComponent(url.pathname));
    } catch {
      return new Response('Bad request', { status: 400 });
    }
    if (path !== resolve(dist) && !path.startsWith(resolve(dist) + sep)) {
      return new Response('Not found', { status: 404 });
    }
    const file = Bun.file(
      path === resolve(dist) ? resolve(dist, 'index.html') : path,
    );
    if (await file.exists())
      return new Response(request.method === 'HEAD' ? null : file, {
        headers: { 'Content-Type': file.type },
      });
    if (url.pathname.startsWith('/assets/'))
      return new Response('Not found', { status: 404 });
    const index = Bun.file(resolve(dist, 'index.html'));
    return new Response(request.method === 'HEAD' ? null : index, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
});
