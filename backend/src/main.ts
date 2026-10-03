import { createApplication } from './application';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const app = await createApplication();
// Dual-stack listener also supports Railway's private IPv6 network.
await app.listen(port, '::');
