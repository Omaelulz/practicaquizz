// Rutas del catalogo - devuelve asignaturas y jefes disponibles
import { supabaseAdmin } from '../lib/supabase.js';

export default async function catalogRoutes(fastify) {
  // GET /subjects - lista de asignaturas con su jefe asociado
  fastify.get('/subjects', async (request, reply) => {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('id, slug, name, description, color, icon, boss:bosses(id, slug, name, title, theme_color, image_url)')
      .order('id');
    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });

  // GET /bosses - lista de todos los jefes
  fastify.get('/bosses', async (request, reply) => {
    const { data, error } = await supabaseAdmin
      .from('bosses')
      .select('*')
      .order('id');
    if (error) return reply.code(500).send({ error: error.message });
    return data;
  });
}
