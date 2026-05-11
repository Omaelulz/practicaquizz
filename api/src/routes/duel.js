import { supabaseAdmin } from '../lib/supabase.js';
import { generateAIQuestions, isAIEnabled } from '../lib/aiQuestions.js';

// Modo duelo: 10 preguntas contra un bot simulado
const DUEL_QUESTIONS = 10;

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

function publicQuestion(q) {
  const { answer, ...rest } = q;
  return rest;
}

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
      const accepted = Array.isArray(expected) ? expected : [expected];
      const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      return accepted.some((a) => norm(a) === norm(given));
    }
    default:
      return false;
  }
}

// Simula la respuesta del bot
// Acierta mas en preguntas faciles y menos en dificiles
function simulateBot(question) {
  const accuracyByDiff = { 1: 0.7, 2: 0.5, 3: 0.3 };
  const accuracy = accuracyByDiff[question.difficulty] ?? 0.5;
  const correct = Math.random() < accuracy;
  // Bot takes 2-8 seconds per question (simulated)
  const time_sec = 2 + Math.random() * 6;
  return { correct, time_sec: Math.round(time_sec * 10) / 10 };
}

export default async function duelRoutes(fastify) {
  // GET /duel/start?subject=slug
  // Returns 10 mixed-difficulty questions for the duel.
  fastify.get('/duel/start', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject } = request.query;
    if (!subject) return reply.code(400).send({ error: 'subject is required' });

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id, slug, name, description, color')
      .eq('slug', subject)
      .single();
    if (e1 || !subj) return reply.code(404).send({ error: 'subject not found' });

    let picked = null;
    if (isAIEnabled()) {
      const aiRows = await aiPickQuestions(fastify, subj, DUEL_QUESTIONS);
      if (aiRows && aiRows.length > 0) {
        picked = [...aiRows].sort(() => Math.random() - 0.5);
      }
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
        ...pickRandom(byDiff[1], 3),
        ...pickRandom(byDiff[2], 4),
        ...pickRandom(byDiff[3], 3)
      ].sort(() => Math.random() - 0.5);
      while (picked.length < DUEL_QUESTIONS && questions.length > picked.length) {
        const candidate = questions[Math.floor(Math.random() * questions.length)];
        if (!picked.find((p) => p.id === candidate.id)) picked.push(candidate);
      }
    }

    return {
      subject: subj,
      config: {
        total_questions: picked.length,
        seconds_per_question: 30
      },
      questions: picked.map(publicQuestion)
    };
  });

  // POST /duel/submit
  // Body: { subject, duration_sec, answers: [{question_id, given}] }
  // Simulates a bot opponent and returns comparison results. Does NOT save to DB.
  fastify.post('/duel/submit', { preHandler: [fastify.requireAuth] }, async (request, reply) => {
    const { subject, duration_sec = 0, answers = [] } = request.body || {};
    if (!subject || !Array.isArray(answers)) {
      return reply.code(400).send({ error: 'invalid payload' });
    }

    const { data: subj, error: e1 } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('slug', subject)
      .single();
    if (e1 || !subj) return reply.code(404).send({ error: 'subject not found' });

    // Fetch questions with answers for grading
    const ids = answers.map((a) => a.question_id).filter(Boolean);
    const { data: qs, error: e2 } = await supabaseAdmin
      .from('questions')
      .select('id, type, answer, difficulty, explanation')
      .in('id', ids);
    if (e2) return reply.code(500).send({ error: e2.message });

    const qMap = new Map(qs.map((q) => [q.id, q]));

    // Grade player answers
    let playerCorrect = 0, playerWrong = 0, playerSkipped = 0;
    let playerScore = 0;
    const review = [];
    const avgTimePerQ = answers.length > 0 ? duration_sec / answers.length : 30;

    for (const a of answers) {
      const q = qMap.get(a.question_id);
      if (!q) continue;

      if (a.given === null || a.given === undefined || a.given === '') {
        playerSkipped++;
        review.push({ question_id: q.id, status: 'skipped', expected: q.answer, explanation: q.explanation });
        continue;
      }

      const ok = checkAnswer(q, a.given);
      if (ok) {
        playerCorrect++;
        // 100 pts base + speed bonus (faster = more bonus, max 50)
        const speedBonus = Math.max(0, Math.round(50 * (1 - avgTimePerQ / 30)));
        playerScore += 100 + speedBonus;
        review.push({ question_id: q.id, status: 'correct', explanation: q.explanation });
      } else {
        playerWrong++;
        review.push({ question_id: q.id, status: 'wrong', expected: q.answer, given: a.given, explanation: q.explanation });
      }
    }

    // Simulate bot
    let botCorrect = 0, botWrong = 0;
    let botScore = 0;
    let botTotalTime = 0;
    const botResults = [];

    for (const a of answers) {
      const q = qMap.get(a.question_id);
      if (!q) continue;

      const sim = simulateBot(q);
      botTotalTime += sim.time_sec;

      if (sim.correct) {
        botCorrect++;
        const speedBonus = Math.max(0, Math.round(50 * (1 - sim.time_sec / 30)));
        botScore += 100 + speedBonus;
        botResults.push({ question_id: q.id, correct: true, time_sec: sim.time_sec });
      } else {
        botWrong++;
        botResults.push({ question_id: q.id, correct: false, time_sec: sim.time_sec });
      }
    }

    const total = answers.length;
    const winner = playerScore > botScore ? 'player' : playerScore < botScore ? 'bot' : 'draw';

    return {
      player: {
        correct: playerCorrect,
        wrong: playerWrong,
        skipped: playerSkipped,
        total,
        score: playerScore,
        duration_sec
      },
      bot: {
        name: 'QuizBot 3000',
        correct: botCorrect,
        wrong: botWrong,
        total,
        score: botScore,
        duration_sec: Math.round(botTotalTime),
        results: botResults
      },
      winner,
      review
    };
  });
}
