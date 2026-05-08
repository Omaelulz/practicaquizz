// Arranca el servidor Fastify para desarrollo local.
import { buildApp } from './app.js';

const fastify = await buildApp({
  logger: { transport: { target: 'pino-pretty' } }
});

const port = parseInt(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port, host });
  console.log(`API listening on http://${host}:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
