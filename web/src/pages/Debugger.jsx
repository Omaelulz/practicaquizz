// Minijuego: Debugger - encuentra la linea con el bug en el codigo
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';

// Tiempo maximo por reto
const SECONDS_PER_CHALLENGE = 30;

// Pill que muestra la dificultad con color (verde/amarillo/rojo)
function DifficultyPill({ level }) {
  const map = { 1: ['Facil', 'success'], 2: ['Medio', 'accent'], 3: ['Dificil', 'danger'] };
  const [label, cls] = map[level] || map[1];
  return <span className={`pill ${cls}`}>{label}</span>;
}

function LangPill({ language }) {
  return <span className="pill">{language.toUpperCase()}</span>;
}

export default function Debugger() {
  const [challenges, setChallenges] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [selectedLine, setSelectedLine] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);       // per-challenge result after confirm
  const [answers, setAnswers] = useState([]);        // accumulated answers
  const [finalResult, setFinalResult] = useState(null);
  const [timer, setTimer] = useState(SECONDS_PER_CHALLENGE);
  const timerRef = useRef(null);

  // Fetch challenges on mount
  useEffect(() => {
    let cancelled = false;
    api.startDebugger()
      .then(d => { if (!cancelled) setChallenges(d.challenges); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // Timer logic
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    stopTimer();
    if (!confirmed) {
      // Auto-confirm with whatever is selected (or null)
      doConfirm(selectedLine);
    }
  }, [confirmed, selectedLine, stopTimer]);

  useEffect(() => {
    if (!challenges || finalResult) return;
    setTimer(SECONDS_PER_CHALLENGE);
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // use setTimeout to avoid setState during render
          setTimeout(() => handleTimeUp(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [idx, challenges, finalResult, stopTimer, handleTimeUp]);

  function doConfirm(line) {
    if (confirmed || !challenges) return;
    const ch = challenges[idx];
    setConfirmed(true);
    stopTimer();

    const ans = { challenge_id: ch.id, selected_line: line };
    setAnswers(prev => [...prev, ans]);

    // We don't know the answer client-side; we'll submit at end.
    // But we can mark it as "confirmed" so user moves on.
    setResult({ selected_line: line });
  }

  function handleConfirm() {
    if (selectedLine === null) return;
    doConfirm(selectedLine);
  }

  function handleNext() {
    if (idx < challenges.length - 1) {
      setIdx(idx + 1);
      setSelectedLine(null);
      setConfirmed(false);
      setResult(null);
    } else {
      // Submit all answers
      submitAll();
    }
  }

  async function submitAll() {
    try {
      // Collect all answers including current one already in state
      const allAnswers = [...answers];
      const res = await api.submitDebugger({ answers: allAnswers });
      setFinalResult(res);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleRestart() {
    setChallenges(null);
    setIdx(0);
    setSelectedLine(null);
    setConfirmed(false);
    setResult(null);
    setAnswers([]);
    setFinalResult(null);
    setError(null);
    api.startDebugger()
      .then(d => setChallenges(d.challenges))
      .catch(e => setError(e.message));
  }

  if (error) {
    return (
      <div className="container anim-fade-in-up">
        <div className="alert error">{error}</div>
      </div>
    );
  }

  if (!challenges) {
    return (
      <div className="container">
        <div className="loading-spinner" style={{ marginTop: 60 }} />
      </div>
    );
  }

  // ── Final results screen ──
  if (finalResult) {
    return (
      <div className="container-narrow anim-fade-in-up">
        <div className="center" style={{ marginBottom: 32 }}>
          <p className="h-section">Debugger - Resultados</p>
          <div className="score-big anim-glow">{finalResult.score}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            de {finalResult.max_score} puntos posibles
          </p>
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{finalResult.correct}</div>
            <div className="stat-label">Correctas</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{finalResult.total - finalResult.correct}</div>
            <div className="stat-label">Falladas</div>
          </div>
          <div className="stat">
            <div className="stat-value">{finalResult.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat">
            <div className="stat-value">{Math.round((finalResult.correct / finalResult.total) * 100)}%</div>
            <div className="stat-label">Acierto</div>
          </div>
        </div>

        <p className="h-2" style={{ marginBottom: 14 }}>Repaso</p>
        <div className="stack">
          {finalResult.results.map((r, i) => {
            const ch = challenges.find(c => c.id === r.challenge_id);
            return (
              <div key={r.challenge_id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {i + 1}. {ch?.title || r.challenge_id}
                  </span>
                  {ch && <LangPill language={ch.language} />}
                  <span className={`pill ${r.correct ? 'success' : 'danger'}`}>
                    {r.correct ? 'Correcto' : 'Incorrecto'}
                  </span>
                </div>
                {ch && (
                  <div style={{
                    background: 'var(--bg-1)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    marginBottom: 10,
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {ch.lines.map((line, li) => {
                      const isBuggy = li === r.buggy_line;
                      const isSelected = li === r.selected_line;
                      let bg = 'transparent';
                      if (isBuggy) bg = 'rgba(34,197,94,0.12)';
                      if (isSelected && !r.correct) bg = 'rgba(239,68,68,0.12)';
                      if (isSelected && r.correct) bg = 'rgba(34,197,94,0.12)';
                      let borderLeft = '3px solid transparent';
                      if (isBuggy) borderLeft = '3px solid var(--success)';
                      if (isSelected && !r.correct) borderLeft = '3px solid var(--danger)';

                      return (
                        <div key={li} style={{
                          display: 'flex',
                          padding: '2px 12px 2px 0',
                          background: bg,
                          borderLeft,
                        }}>
                          <span style={{
                            width: 36,
                            textAlign: 'right',
                            paddingRight: 10,
                            color: 'var(--fg-mute)',
                            userSelect: 'none',
                            flexShrink: 0,
                          }}>{li + 1}</span>
                          <span style={{ whiteSpace: 'pre', color: 'var(--fg)' }}>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="alert info" style={{ fontSize: 13 }}>
                  {r.explanation}
                </div>
              </div>
            );
          })}
        </div>

        <div className="center" style={{ marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={handleRestart}>
            Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Challenge screen ──
  const ch = challenges[idx];
  const isLast = idx === challenges.length - 1;
  const timerClass = timer <= 5 ? 'danger' : timer <= 10 ? 'warn' : '';

  return (
    <div className="container-narrow anim-fade-in-up">
      {/* Header */}
      <div className="quiz-header">
        <div>
          <p className="h-section" style={{ marginBottom: 4 }}>Debugger</p>
          <div className="muted" style={{ fontSize: 13 }}>
            Reto <strong>{idx + 1}</strong> de {challenges.length}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <DifficultyPill level={ch.difficulty} />
          <LangPill language={ch.language} />
          <div className={`timer ${timerClass}`}>
            {timer}s
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(idx / challenges.length) * 100}%` }} />
      </div>

      {/* Challenge card */}
      <div className="card-strong anim-card-in" key={ch.id}>
        <p className="h-2" style={{ marginBottom: 4 }}>{ch.title}</p>
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Haz clic en la linea que contiene el error
        </p>

        {/* Code editor */}
        <div style={{
          background: 'var(--bg-1)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          lineHeight: 1.7,
        }}>
          {ch.lines.map((line, li) => {
            const isSelected = selectedLine === li;
            const showBuggy = confirmed && result;
            // After confirm with final results, we don't yet know buggy_line client-side,
            // so we just highlight the selection and wait for final submit.
            let bg = 'transparent';
            let borderLeft = '3px solid transparent';
            let cursor = confirmed ? 'default' : 'pointer';

            if (isSelected && !confirmed) {
              bg = 'rgba(245,158,11,0.12)';
              borderLeft = '3px solid var(--warn)';
            }
            if (isSelected && confirmed) {
              bg = 'rgba(167,139,250,0.12)';
              borderLeft = '3px solid var(--accent)';
            }

            return (
              <div
                key={li}
                onClick={() => { if (!confirmed) setSelectedLine(li); }}
                style={{
                  display: 'flex',
                  padding: '3px 12px 3px 0',
                  background: bg,
                  borderLeft,
                  cursor,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!confirmed && selectedLine !== li) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!confirmed && selectedLine !== li) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  width: 40,
                  textAlign: 'right',
                  paddingRight: 12,
                  color: 'var(--fg-mute)',
                  userSelect: 'none',
                  flexShrink: 0,
                  fontSize: 13,
                }}>{li + 1}</span>
                <span style={{ whiteSpace: 'pre', color: 'var(--fg)' }}>{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="row-end" style={{ marginTop: 18, gap: 12 }}>
        {!confirmed ? (
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selectedLine === null}
          >
            Confirmar
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext}>
            {isLast ? 'Ver resultados' : 'Siguiente'}
          </button>
        )}
      </div>

      {confirmed && (
        <div className="center muted" style={{ marginTop: 14, fontSize: 13 }}>
          {selectedLine !== null
            ? 'Seleccion registrada. Avanza para ver el siguiente reto.'
            : 'Tiempo agotado. No se selecciono ninguna linea.'}
        </div>
      )}
    </div>
  );
}
