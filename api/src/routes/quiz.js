import { supabaseAdmin } from '../lib/supabase.js';
import { generateAIQuestions, isAIEnabled } from '../lib/aiQuestions.js';

// Configuracion de cada modo de juego
// count = numero de preguntas, secondsPerQuestion = tiempo por pregunta (null = sin limite)
const MODE_CONFIG = {
  exam:   { count: 45, secondsPerQuestion: 60 },
  sprint: { count: 10, secondsPerQuestion: 30 },
  daily:  { count: 5,  secondsPerQuestion: 45 },
  study:  { count: 20, secondsPerQuestion: null }
};

// Genera preguntas con IA y las inserta en la tabla questions para que
// /quiz/submit pueda leerlas con su respuesta. Devuelve las filas insertadas.
// Si la IA falla, devuelve null para que el caller haga fallback a DB.
async function generateAndInsertQuestions(fastify, subject, count) {
  try {
    const generated = await generateAIQuestions({
      subjectSlug: subject.slug,
      subjectName: subject.name,
      subjectDescription: subject.description,
      count
    });
    const rows = generated.map((q) => ({
      subject_id: subject.id,
      type: q.type,
      difficulty: q.difficulty,
      statement: q.statement,
      code_snippet: q.code_snippet,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      tags: q.tags
    }));
    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(rows)
      .select('*');
    if (error) {
      fastify.log.error({ err: error }, 'No se pudieron insertar preguntas IA');
      return null;
    }
    return data;
  } catch (err) {
    fastify.log.warn({ err: err.message }, 'Generación IA falló, usando preguntas de DB');
    return null;
  }
}

// Quita la respuesta para no enviarla al navegador
function publicQuestion(q) {
  const { answer, ...rest } = q;
  return rest;
}

// Valida la respuesta del usuario comparandola con la correcta
function checkAnswer(question, given) {
  const expected = question.answer;
  switch (question.type) {
    case 'multiple_choice':
      return { correct: Number(given) === Number(expected), expected };
    case 'true_false':
      return { correct: String(given).toLowerCase() === String(expected).toLowerCase(), expected };
    case 'fill_code':
    case 'code_output':
    case 'er_diagram': {
      // expected is array of accepted answers OR a single string
      const accepted = Array.isArray(expected) ? expected : [expected];
      const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      const givenN = norm(given);
      const correct = accepted.some((a) => norm(a) === givenN);
      return { correct, expected: accepted[0] };
    }
    default:
      return { correct: false, expected };
  }
}

export default async function quizRoutes(fastify) {
  // GET /quiz/start?subject=programacion&mode=exam
  // Returns randomized questions WITHOUT the answer field, plus mode config.
  fastify.get('/quiz/start', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject, mode = 'exam' } = request.query;
    if (!subject) return reply.code(400).send({ error: 'subject is required' });
    if (!MODE_CONFIG[mode]) return reply.code(400).send({ error: 'invalid mode' });

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id, slug, name, description, color, boss:bosses(id, slug, name, theme_color)')
      .eq('slug', subject)
      .single();
    if (e1 || !subj) return reply.code(404).send({ error: 'subject not found' });

    const config = MODE_CONFIG[mode];

    // Primero intentamos generar las preguntas con IA. Si falla o no hay clave,
    // caemos al banco de preguntas de la base de datos.
    let picked = null;
    if (isAIEnabled()) {
      const aiRows = await generateAndInsertQuestions(fastify, subj, config.count);
      if (aiRows && aiRows.length > 0) picked = aiRows;
    }

    if (!picked) {
      const { data: questions, error: e2 } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('subject_id', subj.id);
      if (e2) return reply.code(500).send({ error: e2.message });
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      picked = shuffled.slice(0, Math.min(config.count, shuffled.length));
    }

    return {
      subject: subj,
      mode,
      config,
      questions: picked.map(publicQuestion)
    };
  });

  // POST /quiz/submit
  // Body: { subject, mode, duration_sec, answers: [{question_id, given}] }
  fastify.post('/quiz/submit', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject, mode, duration_sec = 0, answers = [] } = request.body || {};
    if (!subject || !mode || !Array.isArray(answers)) {
      return reply.code(400).send({ error: 'invalid payload' });
    }
    if (!MODE_CONFIG[mode]) return reply.code(400).send({ error: 'invalid mode' });

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('slug', subject)
      .single();
    if (e1 || !subj) return reply.code(404).send({ error: 'subject not found' });

    // Fetch the questions answered (with the real answer field)
    const ids = answers.map((a) => a.question_id).filter(Boolean);
    const { data: qs, error: e2 } = await supabaseAdmin
      .from('questions')
      .select('id, type, answer, explanation, difficulty')
      .in('id', ids);
    if (e2) return reply.code(500).send({ error: e2.message });

    const qMap = new Map(qs.map((q) => [q.id, q]));

    let correct = 0, wrong = 0, skipped = 0;
    const review = [];
    for (const a of answers) {
      const q = qMap.get(a.question_id);
      if (!q) continue;
      if (a.given === null || a.given === undefined || a.given === '') {
        skipped++;
        review.push({ question_id: q.id, status: 'skipped', expected: q.answer, explanation: q.explanation });
        continue;
      }
      const { correct: ok, expected } = checkAnswer(q, a.given);
      if (ok) {
        correct++;
        review.push({ question_id: q.id, status: 'correct', explanation: q.explanation });
      } else {
        wrong++;
        review.push({ question_id: q.id, status: 'wrong', expected, given: a.given, explanation: q.explanation });
      }
    }

    // Score: 100 per correct, -25 per wrong, time bonus on exam mode
    const total = correct + wrong + skipped;
    let score = correct * 100 - wrong * 25;
    if (mode === 'exam') {
      const expectedDuration = total * 60;
      const timeBonus = Math.max(0, Math.round((expectedDuration - duration_sec) / 5));
      score += timeBonus;
    }
    score = Math.max(0, score);

    // Save attempt
    const { data: attempt, error: e3 } = await supabaseAdmin
      .from('attempts')
      .insert({
        user_id: request.user.id,
        subject_id: subj.id,
        mode,
        total,
        correct,
        wrong,
        skipped,
        score,
        duration_sec
      })
      .select()
      .single();
    if (e3) return reply.code(500).send({ error: e3.message });

    return { attempt, summary: { total, correct, wrong, skipped, score }, review };
  });
}
