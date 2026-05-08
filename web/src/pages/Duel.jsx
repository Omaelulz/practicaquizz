import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import QuestionCard from '../components/QuestionCard';

// Pagina del modo duelo 1v1 contra un bot
// El bot responde con un delay aleatorio y acierta segun la dificultad
const BOT_NAME = 'QuizBot 3000';
const BOT_ACCURACY = { 1: 0.7, 2: 0.5, 3: 0.3 }; // probabilidad de acertar

export default function Duel() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [given, setGiven] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [playerCorrect, setPlayerCorrect] = useState(0);
  const [botCorrect, setBotCorrect] = useState(0);
  const [botAnswering, setBotAnswering] = useState(false);
  const [botAnswered, setBotAnswered] = useState(false);
  const [flash, setFlash] = useState(null); // 'correct' | 'wrong' | null
  const [botFlash, setBotFlash] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);

  const startedAtRef = useRef(null);
  const answersRef = useRef([]);
  const botTimerRef = useRef(null);
  const questionsWithAnswersRef = useRef(null);

  // Fetch questions
  useEffect(() => {
    let cancelled = false;
    api.startDuel(slug)
      .then((d) => { if (!cancelled) setState(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [slug]);

  // Countdown before starting
  useEffect(() => {
    if (!state || started) return;
    if (countdown <= 0) {
      setStarted(true);
      startedAtRef.current = Date.now();
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [state, countdown, started]);

  // Bot answering logic per question
  useEffect(() => {
    if (!started || !state || finished) return;
    const q = state.questions[idx];
    if (!q) return;

    setBotAnswering(true);
    setBotAnswered(false);
    setBotFlash(null);

    const delay = 2000 + Math.random() * 4000; // 2-6 seconds
    botTimerRef.current = setTimeout(() => {
      const accuracy = BOT_ACCURACY[q.difficulty] ?? 0.5;
      const correct = Math.random() < accuracy;
      setBotAnswering(false);
      setBotAnswered(true);
      setBotFlash(correct ? 'correct' : 'wrong');

      if (correct) {
        const speedBonus = Math.max(0, Math.round(50 * (1 - (delay / 1000) / 30)));
        setBotScore((s) => s + 100 + speedBonus);
        setBotCorrect((c) => c + 1);
      }

      setTimeout(() => setBotFlash(null), 1200);
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [idx, started, state, finished]);

  const handleAnswer = useCallback(() => {
    if (answered || !state) return;
    setAnswered(true);

    const q = state.questions[idx];
    answersRef.current.push({ question_id: q.id, given });

    // We need server-side check, but for instant feedback we do a local check
    // We check against the question type heuristics
    // Since the answer is stripped, we track locally for UI only
    // The real score comes from the server on submit
    // For now, mark as "answered" and move on after delay
    // We'll show feedback based on server result at the end
    // Actually, for immediate feedback, we simulate locally:
    // The server will give the real score, but for UX we estimate
    const isCorrect = given !== null && given !== undefined && given !== '';

    // We don't know the answer client-side, so we just show "answered"
    // Real scoring happens on submit. But the spec says show correct/wrong immediately.
    // We'll mark it as pending and resolve on submit.
    // For a better UX, let's just show that the answer was submitted.
    setFlash('pending');

    setTimeout(() => {
      setFlash(null);
      setAnswered(false);
      setGiven(null);
      setBotAnswered(false);

      if (idx + 1 >= state.questions.length) {
        handleSubmit();
      } else {
        setIdx((i) => i + 1);
      }
    }, 800);
  }, [answered, state, idx, given]);

  const handleSkip = useCallback(() => {
    if (answered || !state) return;
    setAnswered(true);
    answersRef.current.push({ question_id: state.questions[idx].id, given: null });
    setFlash('wrong');

    setTimeout(() => {
      setFlash(null);
      setAnswered(false);
      setGiven(null);
      setBotAnswered(false);

      if (idx + 1 >= state.questions.length) {
        handleSubmit();
      } else {
        setIdx((i) => i + 1);
      }
    }, 800);
  }, [answered, state, idx]);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    const duration_sec = Math.floor((Date.now() - startedAtRef.current) / 1000);

    try {
      const res = await api.submitDuel({
        subject: slug,
        duration_sec,
        answers: answersRef.current
      });
      setResult(res);
      setPlayerScore(res.player.score);
      setBotScore(res.bot.score);
      setPlayerCorrect(res.player.correct);
      setBotCorrect(res.bot.correct);
      setFinished(true);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  /* ---- RENDER ---- */

  if (error) {
    return (
      <div className="container-narrow anim-fade-in-up">
        <div className="alert error">{error}</div>
        <button className="btn btn-ghost" onClick={() => nav(-1)} style={{ marginTop: 14 }}>
          ← Volver
        </button>
      </div>
    );
  }

  if (!state) {
    return <div className="container muted"><div className="loading-spinner" /></div>;
  }

  // Countdown screen
  if (!started) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8, color: 'var(--fg)' }}>Modo Duelo</h1>
        <p className="muted" style={{ marginBottom: 32 }}>Tu vs {BOT_NAME}</p>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          animation: 'pulse .6s ease-in-out infinite'
        }}>
          {countdown}
        </div>
        <p className="muted" style={{ marginTop: 24 }}>Preparate...</p>
      </div>
    );
  }

  // Results screen
  if (finished && result) {
    const playerWon = result.winner === 'player';
    const draw = result.winner === 'draw';

    return (
      <div className="container anim-fade-in-up" style={{ maxWidth: 700 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            color: draw ? 'var(--fg-dim)' : playerWon ? 'var(--success)' : 'var(--danger)',
            marginBottom: 8
          }}>
            {draw ? 'Empate!' : playerWon ? 'Victoria!' : 'Derrota...'}
          </h1>
          <p className="muted">
            {draw
              ? 'Igualados contra la maquina.'
              : playerWon
                ? 'Has derrotado a ' + BOT_NAME + '!'
                : BOT_NAME + ' te ha superado esta vez.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
          {/* Player card */}
          <div className="card" style={{
            textAlign: 'center',
            borderColor: playerWon ? 'var(--success)' : 'var(--border)'
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧑</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg)', marginBottom: 4 }}>Tu</div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: playerWon ? 'var(--success)' : 'var(--fg)'
            }}>
              {result.player.score}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {result.player.correct}/{result.player.total} correctas
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {result.player.duration_sec}s
            </div>
          </div>

          {/* VS */}
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--fg-mute)',
            fontFamily: 'var(--font-mono)'
          }}>
            VS
          </div>

          {/* Bot card */}
          <div className="card" style={{
            textAlign: 'center',
            borderColor: !playerWon && !draw ? 'var(--danger)' : 'var(--border)'
          }}>
            <div className="duel-bot-face" style={{ fontSize: 36, marginBottom: 8 }}>
              <span role="img" aria-label="robot">🤖</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg)', marginBottom: 4 }}>
              {BOT_NAME}
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: !playerWon && !draw ? 'var(--danger)' : 'var(--fg)'
            }}>
              {result.bot.score}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {result.bot.correct}/{result.bot.total} correctas
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {result.bot.duration_sec}s
            </div>
          </div>
        </div>

        {/* Review */}
        <details style={{ marginTop: 32 }}>
          <summary className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            Ver respuestas detalladas
          </summary>
          <div style={{ marginTop: 16 }}>
            {result.review.map((r, i) => (
              <div key={r.question_id} className="card" style={{
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: r.status === 'correct' ? 'var(--success)' : r.status === 'wrong' ? 'var(--danger)' : 'var(--fg-mute)'
              }}>
                <div style={{ fontSize: 13 }}>
                  <strong>Pregunta {i + 1}</strong>
                  <span style={{
                    marginLeft: 8,
                    color: r.status === 'correct' ? 'var(--success)' : r.status === 'wrong' ? 'var(--danger)' : 'var(--fg-mute)',
                    fontWeight: 600
                  }}>
                    {r.status === 'correct' ? 'Correcta' : r.status === 'wrong' ? 'Incorrecta' : 'Saltada'}
                  </span>
                </div>
                {r.explanation && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.explanation}</div>
                )}
                {r.status === 'wrong' && r.expected && (
                  <div style={{ fontSize: 12, marginTop: 4, color: 'var(--fg-mute)' }}>
                    Respuesta correcta: <strong>{Array.isArray(r.expected) ? r.expected[0] : r.expected}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => nav(`/subjects/${slug}`)}>
            ← Volver a asignatura
          </button>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Revancha
          </button>
        </div>
      </div>
    );
  }

  // Active duel screen
  const q = state.questions[idx];
  const total = state.questions.length;
  const progressPct = ((idx) / total) * 100;

  return (
    <div className="container anim-fade-in-up">
      {/* Header: split scoreboard */}
      <div className="duel-scoreboard">
        <div className="duel-player-side">
          <span style={{ fontSize: 24 }}>🧑</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>Tu</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 900,
              color: 'var(--accent)'
            }}>
              {playerCorrect}/{idx} ✓
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 16,
          fontWeight: 900,
          color: 'var(--fg-mute)',
          fontFamily: 'var(--font-mono)',
          alignSelf: 'center'
        }}>
          VS
        </div>

        <div className="duel-bot-side">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>{BOT_NAME}</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 900,
              color: 'var(--danger)'
            }}>
              {botCorrect}/{idx} ✓
            </div>
          </div>
          <span style={{ fontSize: 24 }}>🤖</span>
        </div>
      </div>

      {/* Bot status */}
      <div className="duel-bot-status" style={{
        textAlign: 'center',
        margin: '8px 0 4px',
        minHeight: 24
      }}>
        {botAnswering && (
          <span className="muted" style={{ fontSize: 13, animation: 'pulse .8s ease-in-out infinite' }}>
            {BOT_NAME} esta pensando...
          </span>
        )}
        {botFlash === 'correct' && (
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
            {BOT_NAME} acerto!
          </span>
        )}
        {botFlash === 'wrong' && (
          <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
            {BOT_NAME} fallo!
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="quiz-header">
        <div className="muted">Pregunta <strong>{idx + 1}</strong> / {total}</div>
        <div className="muted mono" style={{ fontSize: 13 }}>
          Dificultad: {q.difficulty === 1 ? 'Facil' : q.difficulty === 2 ? 'Media' : 'Dificil'}
        </div>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Question card with flash effect */}
      <div
        className={`card-strong anim-card-in ${flash === 'correct' ? 'duel-flash-correct' : ''} ${flash === 'wrong' ? 'duel-flash-wrong' : ''}`}
        key={q.id}
      >
        <QuestionCard question={q} value={given} onChange={setGiven} disabled={answered} />
      </div>

      {/* Actions */}
      <div className="row-end" style={{ marginTop: 18 }}>
        <button
          className="btn btn-ghost"
          onClick={handleSkip}
          disabled={answered || submitting}
        >
          Saltar
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAnswer}
          disabled={answered || submitting || given === null || given === undefined || given === ''}
        >
          Responder
        </button>
      </div>

      {/* Duel-specific styles (scoped) */}
      <style>{`
        .duel-scoreboard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 8px;
        }
        .duel-player-side,
        .duel-bot-side {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .duel-flash-correct {
          box-shadow: 0 0 0 2px var(--success), 0 0 20px rgba(34, 197, 94, 0.2) !important;
          transition: box-shadow 0.3s ease;
        }
        .duel-flash-wrong {
          box-shadow: 0 0 0 2px var(--danger), 0 0 20px rgba(239, 68, 68, 0.2) !important;
          transition: box-shadow 0.3s ease;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
