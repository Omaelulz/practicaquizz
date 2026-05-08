// Rutas del ranking - global, por asignatura, por jefe y estadisticas del usuario
import { supabaseAdmin } from '../lib/supabase.js';

export default async function leaderboardRoutes(fastify) {
  // Ranking global - top jugadores de toda la app
  fastify.get('/leaderboard/global', async (request, reply) => {
    const limit = Math.min(parseInt(request.query.limit) || 20, 100);
    const { data, error } = await supabaseAdmin
      .from('leaderboard_global')
      .select('*')
      .limit(limit);
    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Ranking por asignatura
  fastify.get('/leaderboard/subject/:slug', async (request, reply) => {
    const { slug } = request.params;
    const limit = Math.min(parseInt(request.query.limit) || 20, 100);
    const { data, error } = await supabaseAdmin
      .from('leaderboard_by_subject')
      .select('*')
      .eq('subject_slug', slug)
      .order('best_score', { ascending: false })
      .limit(limit);
    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Salon de la fama de jefes derrotados
  fastify.get('/leaderboard/boss/:slug', async (request, reply) => {
    const { slug } = request.params;
    const limit = Math.min(parseInt(request.query.limit) || 20, 100);
    const { data, error } = await supabaseAdmin
      .from('boss_hall_of_fame')
      .select('*')
      .eq('boss_slug', slug)
      .limit(limit);
    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // Estadisticas del usuario logueado - perfil, intentos recientes y jefes vencidos
  fastify.get('/me/stats', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const userId = request.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', userId)
      .single();

    const { data: attempts } = await supabaseAdmin
      .from('attempts')
      .select('subject_id, mode, score, correct, wrong, total, finished_at')
      .eq('user_id', userId)
      .order('finished_at', { ascending: false })
      .limit(20);

    const { data: bossWins } = await supabaseAdmin
      .from('boss_fights')
      .select('boss_id, score, won, finished_at, boss:bosses(name, slug)')
      .eq('user_id', userId)
      .eq('won', true);

    return { profile, attempts: attempts || [], bossWins: bossWins || [] };
  });
}
