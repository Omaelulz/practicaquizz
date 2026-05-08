// Construye la instancia Fastify con todas las rutas registradas.
// Se reutiliza tanto en el servidor local (server.js) como en la Netlify Function.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';

import { authPlugin } from './plugins/auth.js';
import catalogRoutes from './routes/catalog.js';
import quizRoutes from './routes/quiz.js';
import bossRoutes from './routes/boss.js';
import leaderboardRoutes from './routes/leaderboard.js';
import duelRoutes from './routes/duel.js';
import minigameRoutes from './routes/minigames.js';
import debuggerRoutes from './routes/debugger.js';

export async function buildApp(opts = {}) {
  const fastify = Fastify({ logger: opts.logger ?? false });

  await fastify.register(cors, {
    origin: (process.env.WEB_ORIGIN || '*').split(','),
    credentials: true
  });

  await fastify.register(authPlugin);

  fastify.get('/health', async () => ({ status: 'ok', service: 'quiz-daw-api' }));

  await fastify.register(catalogRoutes);
  await fastify.register(quizRoutes);
  await fastify.register(bossRoutes);
  await fastify.register(leaderboardRoutes);
  await fastify.register(duelRoutes);
  await fastify.register(minigameRoutes);
  await fastify.register(debuggerRoutes);

  return fastify;
}
