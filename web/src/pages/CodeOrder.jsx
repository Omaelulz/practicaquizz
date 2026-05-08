// Minijuego: Ordena el Codigo - arrastra lineas para ordenar codigo correctamente
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../lib/api';

// Colores por lenguaje para las badges
const LANG_COLORS = {
  java: '#f89820',
  html: '#e44d26',
  css: '#264de4',
  sql: '#336791'
};

const DIFFICULTY_LABELS = {
  1: 'Facil',
  2: 'Medio',
  3: 'Dificil'
};

// 60 segundos por reto
const TIMER_SECONDS = 60;

const styles = {
  wrapper: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  langBadge: (lang) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: LANG_COLORS[lang] || '#666',
    color: '#fff',
    marginRight: 8
  }),
  diffBadge: (d) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    background: d === 3 ? 'rgba(239,68,68,0.2)' : d === 2 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
    color: d === 3 ? '#ef4444' : d === 2 ? '#f59e0b' : '#22c55e'
  }),
  codeArea: {
    background: 'var(--bg-1)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 0',
    marginTop: 12,
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    lineHeight: 1.7,
    userSelect: 'none'
  },
  codeLine: (isDragging, isDragOver) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '6px 16px',
    cursor: 'grab',
    transition: 'background 0.15s, transform 0.15s, opacity 0.15s',
    opacity: isDragging ? 0.4 : 1,
    background: isDragOver ? 'rgba(167,139,250,0.15)' : 'transparent',
    borderTop: isDragOver ? '2px solid var(--accent)' : '2px solid transparent',
    position: 'relative'
  }),
  lineNum: {
    width: 32,
    textAlign: 'right',
    color: 'var(--fg-mute)',
    fontSize: 12,
    marginRight: 12,
    flexShrink: 0,
    fontFamily: 'var(--font-mono)',
    pointerEvents: 'none'
  },
  lineText: {
    flex: 1,
    whiteSpace: 'pre',
    color: 'var(--fg)',
    pointerEvents: 'none'
  },
  dragHandle: {
    color: 'var(--fg-mute)',
    marginRight: 8,
    fontSize: 14,
    pointerEvents: 'none',
    flexShrink: 0
  },
  timer: (urgent) => ({
    fontSize: 22,
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: urgent ? '#ef4444' : 'var(--fg)',
    animation: urgent ? 'pulse 0.5s infinite alternate' : 'none'
  }),
  resultOverlay: (status) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius)',
    fontSize: 28,
    fontWeight: 800,
    zIndex: 10,
    background: status === 'perfect'
      ? 'rgba(34,197,94,0.15)'
      : status === 'partial'
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(239,68,68,0.15)',
    color: status === 'perfect' ? '#22c55e' : status === 'partial' ? '#f59e0b' : '#ef4444',
    animation: 'fadeIn 0.3s ease-out'
  }),
  scoreCard: {
    textAlign: 'center',
    padding: 40,
    marginTop: 40
  },
  bigScore: {
    fontSize: 72,
    fontWeight: 900,
    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
};

const styleSheet = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse {
    from { opacity: 1; }
    to { opacity: 0.5; }
  }
  .code-line-drag:active {
    cursor: grabbing;
  }
`;

export default function CodeOrder() {
  const [phase, setPhase] = useState('loading'); // loading, playing, checking, summary
  const [challenges, setChallenges] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lines, setLines] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [checkResult, setCheckResult] = useState(null); // { status, points }
  const [allAnswers, setAllAnswers] = useState([]);
  const [finalResults, setFinalResults] = useState(null);
  const timerRef = useRef(null);
  const touchDragRef = useRef({ idx: null, startY: 0, currentY: 0 });

  // Load challenges
  useEffect(() => {
    let cancelled = false;
    api.startCodeOrder()
      .then((data) => {
        if (cancelled) return;
        setChallenges(data.challenges);
        setLines(data.challenges[0].lines);
        setPhase('playing');
        startTimer();
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; clearInterval(timerRef.current); };
  }, []);

  function startTimer() {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') {
      handleCheck();
    }
  }, [timeLeft, phase]);

  const challenge = challenges[currentIdx];

  // --- Drag & Drop handlers ---
  function handleDragStart(e, idx) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx.toString());
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  }

  function handleDragLeave() {
    setDragOverIdx(null);
  }

  function handleDrop(e, dropIdx) {
    e.preventDefault();
    const fromIdx = dragIdx;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newLines = [...lines];
    const [moved] = newLines.splice(fromIdx, 1);
    newLines.splice(dropIdx, 0, moved);
    setLines(newLines);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  // --- Touch drag handlers ---
  function handleTouchStart(e, idx) {
    const touch = e.touches[0];
    touchDragRef.current = { idx, startY: touch.clientY, currentY: touch.clientY };
    setDragIdx(idx);
  }

  function handleTouchMove(e, idx) {
    e.preventDefault();
    const touch = e.touches[0];
    touchDragRef.current.currentY = touch.clientY;

    // Find which line we're hovering over
    const elements = document.querySelectorAll('[data-line-idx]');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const overIdx = parseInt(el.getAttribute('data-line-idx'));
        setDragOverIdx(overIdx);
        break;
      }
    }
  }

  function handleTouchEnd() {
    const fromIdx = touchDragRef.current.idx;
    const toIdx = dragOverIdx;
    if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
      const newLines = [...lines];
      const [moved] = newLines.splice(fromIdx, 1);
      newLines.splice(toIdx, 0, moved);
      setLines(newLines);
    }
    touchDragRef.current = { idx: null, startY: 0, currentY: 0 };
    setDragIdx(null);
    setDragOverIdx(null);
  }

  // --- Check & navigation ---
  function handleCheck() {
    clearInterval(timerRef.current);
    setPhase('checking');

    const answer = {
      challenge_id: challenge.id,
      ordered_lines: [...lines]
    };
    setAllAnswers((prev) => [...prev, answer]);

    // Preview result locally
    const correct = challenges[currentIdx].lines;
    // We don't have correct order on client, but we stored it in allAnswers
    // We'll show a placeholder until final submit
    setCheckResult({ status: 'pending' });

    // If last challenge, submit everything
    if (currentIdx === challenges.length - 1) {
      const finalAnswers = [...allAnswers, answer];
      api.submitCodeOrder({ answers: finalAnswers })
        .then((data) => {
          setFinalResults(data);
          // Show the result for this challenge
          const thisResult = data.results.find((r) => r.challenge_id === challenge.id);
          setCheckResult(thisResult || { status: 'wrong', points: 0 });
          setTimeout(() => setPhase('summary'), 2000);
        })
        .catch((e) => setError(e.message));
    } else {
      // Submit partial to get this result (we'll submit all at the end)
      // For immediate feedback, submit just this one
      api.submitCodeOrder({ answers: [answer] })
        .then((data) => {
          const r = data.results[0];
          setCheckResult(r);
          // Auto-advance after showing result
          setTimeout(() => {
            setCurrentIdx((i) => i + 1);
            setLines(challenges[currentIdx + 1].lines);
            setCheckResult(null);
            setPhase('playing');
            startTimer();
          }, 2000);
        })
        .catch((e) => setError(e.message));
    }
  }

  function handleRestart() {
    setPhase('loading');
    setChallenges([]);
    setCurrentIdx(0);
    setLines([]);
    setAllAnswers([]);
    setFinalResults(null);
    setCheckResult(null);
    setError(null);
    api.startCodeOrder()
      .then((data) => {
        setChallenges(data.challenges);
        setLines(data.challenges[0].lines);
        setPhase('playing');
        startTimer();
      })
      .catch((e) => setError(e.message));
  }

  // --- Render ---
  if (error) {
    return (
      <div className="container anim-fade-in-up">
        <div className="alert error">{error}</div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="container">
        <div className="loading-spinner" style={{ marginTop: 60 }} />
      </div>
    );
  }

  if (phase === 'summary' && finalResults) {
    return (
      <div style={styles.wrapper} className="anim-fade-in-up">
        <style>{styleSheet}</style>
        <div className="card" style={styles.scoreCard}>
          <h2 style={{ marginBottom: 8, fontSize: 22 }}>Ordena el Codigo - Resultados</h2>
          <div style={styles.bigScore}>{finalResults.score}</div>
          <div className="muted" style={{ fontSize: 16, marginTop: 4 }}>
            de {finalResults.max_score} puntos posibles
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {finalResults.results.map((r, i) => {
              const ch = challenges.find((c) => c.id === r.challenge_id);
              return (
                <div key={r.challenge_id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)'
                }}>
                  <div>
                    <span style={styles.langBadge(ch?.language)}>{ch?.language}</span>
                    <span style={{ fontWeight: 600 }}>{ch?.title}</span>
                  </div>
                  <div style={{
                    fontWeight: 800,
                    color: r.status === 'perfect' ? '#22c55e' : r.status === 'partial' ? '#f59e0b' : '#ef4444'
                  }}>
                    {r.status === 'perfect' ? 'PERFECTO' : r.status === 'partial' ? 'PARCIAL' : 'INCORRECTO'}
                    {' '}{r.points} pts
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 28 }} onClick={handleRestart}>
            Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  const isChecking = phase === 'checking';

  return (
    <div style={styles.wrapper} className="anim-fade-in-up">
      <style>{styleSheet}</style>

      {/* Top bar */}
      <div style={styles.header}>
        <div>
          <span style={styles.langBadge(challenge.language)}>{challenge.language}</span>
          <span style={styles.diffBadge(challenge.difficulty)}>
            {DIFFICULTY_LABELS[challenge.difficulty]}
          </span>
        </div>
        <div style={styles.timer(timeLeft <= 10)}>
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Progress */}
      <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
        Reto <strong>{currentIdx + 1}</strong> de {challenges.length}
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(currentIdx / challenges.length) * 100}%` }} />
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 20, marginTop: 16, marginBottom: 4 }}>{challenge.title}</h2>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
        Arrastra las lineas para ordenar el codigo correctamente.
      </p>

      {/* Code lines */}
      <div style={{ ...styles.codeArea, position: 'relative' }}>
        {lines.map((line, idx) => (
          <div
            key={idx}
            data-line-idx={idx}
            draggable={!isChecking}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => !isChecking && handleTouchStart(e, idx)}
            onTouchMove={(e) => !isChecking && handleTouchMove(e, idx)}
            onTouchEnd={() => !isChecking && handleTouchEnd()}
            className="code-line-drag"
            style={styles.codeLine(dragIdx === idx, dragOverIdx === idx)}
          >
            <span style={styles.dragHandle}>&#x2630;</span>
            <span style={styles.lineNum}>{idx + 1}</span>
            <span style={styles.lineText}>{line}</span>
          </div>
        ))}

        {/* Result overlay */}
        {checkResult && checkResult.status !== 'pending' && (
          <div style={styles.resultOverlay(checkResult.status)}>
            {checkResult.status === 'perfect' && 'PERFECTO +200'}
            {checkResult.status === 'partial' && 'PARCIAL +100'}
            {checkResult.status === 'wrong' && 'INCORRECTO +0'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={isChecking}
        >
          {currentIdx === challenges.length - 1 ? 'Comprobar y terminar' : 'Comprobar'}
        </button>
      </div>
    </div>
  );
}
