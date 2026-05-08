// Plugin de autenticacion - verifica el JWT del usuario en rutas protegidas
import fp from 'fastify-plugin';
import { supabaseAnon } from '../lib/supabase.js';

export const authPlugin = fp(async function authPlugin(fastify) {
  fastify.decorate('requireAuth', async function (request, reply) {
    const auth = request.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return reply.code(401).send({ error: 'Missing Authorization header' });
    }
    const { data, error } = await supabaseAnon.auth.getUser(token);
    if (error || !data?.user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    request.user = { id: data.user.id, email: data.user.email };
  });
});
