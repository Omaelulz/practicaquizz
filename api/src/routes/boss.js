import { supabaseAdmin } from '../lib/supabase.js';
import { generateAIQuestions, isAIEnabled } from '../lib/aiQuestions.js';

// Configuracion del modo jefe final
// El jefe tiene vida (HP) y el jugador tiene concentracion
// Acertar hace dano al jefe, fallar baja tu concentracion
const DAMAGE = { 1: 80, 2: 110, 3: 160 }; // dano segun dificultad
const QUESTIONS_PER_FIGHT = 30;
const SECONDS_PER_QUESTION = 30;
const PLAYER_HP_START = 100;
const PLAYER_HP_LOSS_PER_WRONG = 15;

async function aiPickQuestions(fastify, subject, count) {
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
    const { data, error } = await supabaseAdmin.from('questions').insert(rows).select('*');
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

// En modo jefe la respuesta viaja al cliente para que el HUD pueda
// reaccionar al instante (solo aciertos quitan vida al jefe).
// El score real lo sigue calculando el servidor en /boss/submit.
function publicQuestion(q) {
  return q;
}

// Comprueba si la respuesta del jugador es correcta
// Soporta multiple_choice, true_false, fill_code, code_output y er_diagram
function checkAnswer(question, given) {
  const expected = question.answer;
  switch (question.type) {
    case 'multiple_choice':
      return Number(given) === Number(expected);
    case 'true_false':
      return String(given).toLowerCase() === String(expected).toLowerCase();
    case 'fill_code':
    case 'code_output':
    case 'er_diagram': {
      // Puede haber varias respuestas validas, se normalizan y comparan
      const accepted = Array.isArray(expected) ? expected : [expected];
      const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      return accepted.some((a) => norm(a) === norm(given));
    }
    default:
      return false;
  }
}

export default async function bossRoutes(fastify) {
  // GET /boss/start?subject=programacion
  // Eligibility: must have at least one exam attempt with score >= 3000 in this subject.
  fastify.get('/boss/start', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject } = request.query;
    if (!subject) return reply.code(400).send({ error: 'subject required' });

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id, slug, name, description, color, boss:bosses(id, slug, name, title, description, image_url, max_hp, theme_color, taunts)')
      .eq('slug', subject)
      .single();
    if (e1 || !subj) return reply.code(404).send({ error: 'subject not found' });
    if (!subj.boss) return reply.code(404).send({ error: 'no boss for this subject' });

    let picked = null;
    if (isAIEnabled()) {
      const aiRows = await aiPickQuestions(fastify, subj, QUESTIONS_PER_FIGHT);
      if (aiRows && aiRows.length > 0) picked = aiRows;
    }

    if (!picked) {
      const { data: questions, error: e2 } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('subject_id', subj.id);
      if (e2) return reply.code(500).send({ error: e2.message });
      const byDiff = { 1: [], 2: [], 3: [] };
      for (const q of questions) byDiff[q.difficulty]?.push(q);
      const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
      picked = [
        ...pickRandom(byDiff[1], 5),
        ...pickRandom(byDiff[2], 15),
        ...pickRandom(byDiff[3], 10)
      ];
      while (picked.length < QUESTIONS_PER_FIGHT && questions.length > picked.length) {
        const candidate = questions[Math.floor(Math.random() * questions.length)];
        if (!picked.find((p) => p.id === candidate.id)) picked.push(candidate);
      }
    }

    return {
      subject: subj,
      boss: subj.boss,
      config: {
        total_questions: picked.length,
        seconds_per_question: SECONDS_PER_QUESTION,
        player_hp_start: PLAYER_HP_START,
        boss_hp_start: subj.boss.max_hp
      },
      questions: picked.map(publicQuestion)
    };
  });

  // POST /boss/submit
  // Body: { subject, duration_sec, answers: [{question_id, given}] }
  fastify.post('/boss/submit', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject, duration_sec = 0, answers = [] } = request.body || {};
    if (!subject || !Array.isArray(answers)) {
      return reply.code(400).send({ error: 'invalid payload' });
    }

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id, boss:bosses(id, max_hp)')
      .eq('slug', subject)
      .single();
    if (e1 || !subj?.boss) return reply.code(404).send({ error: 'boss not found' });

    const ids = answers.map((a) => a.question_id).filter(Boolean);
    const { data: qs, error: e2 } = await supabaseAdmin
      .from('questions')
      .select('id, type, answer, difficulty, explanation')
      .in('id', ids);
    if (e2) return reply.code(500).send({ error: e2.message });

    const qMap = new Map(qs.map((q) => [q.id, q]));

    let bossHp = subj.boss.max_hp;
    let playerHp = PLAYER_HP_START;
    let damageDealt = 0;
    let correct = 0, wrong = 0;
    const review = [];

    for (const a of answers) {
      const q = qMap.get(a.question_id);
      if (!q) continue;
      const ok = checkAnswer(q, a.given);
      if (ok) {
        const dmg = DAMAGE[q.difficulty] || 100;
        bossHp = Math.max(0, bossHp - dmg);
        damageDealt += dmg;
        correct++;
        review.push({ question_id: q.id, status: 'correct', damage: dmg });
      } else {
        playerHp = Math.max(0, playerHp - PLAYER_HP_LOSS_PER_WRONG);
        wrong++;
        review.push({ question_id: q.id, status: 'wrong', expected: q.answer, given: a.given });
      }
      if (playerHp <= 0) break;
    }

    const won = bossHp <= 0 && playerHp > 0;
    const timeLimitSec = QUESTIONS_PER_FIGHT * SECONDS_PER_QUESTION;
    const timeLeft = Math.max(0, timeLimitSec - duration_sec);

    // Score: damage dealt + remaining HP bonus + time bonus, x2 if won
    let score = damageDealt + playerHp * 5 + timeLeft * 2;
    if (won) score *= 2;
    score = Math.round(score);

    const { data: fight, error: e3 } = await supabaseAdmin
      .from('boss_fights')
      .insert({
        user_id: request.user.id,
        boss_id: subj.boss.id,
        subject_id: subj.id,
        won,
        hp_left: bossHp,
        time_left_sec: timeLeft,
        score
      })
      .select()
      .single();
    if (e3) return reply.code(500).send({ error: e3.message });

    return {
      fight,
      summary: { won, correct, wrong, damageDealt, bossHpLeft: bossHp, playerHpLeft: playerHp, timeLeft, score },
      review
    };
  });
}
