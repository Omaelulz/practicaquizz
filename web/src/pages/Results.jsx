// Pagina de resultados - muestra puntuacion, medallas, confetti y revision de respuestas
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import BossAvatar from '../components/BossAvatar';

// Devuelve el nombre bonito del modo de juego
function modeLabel(mode) {
  if (mode === 'exam') return 'Modo Examen';
  if (mode === 'sprint') return 'Sprint';
  if (mode === 'study') return 'Estudio';
  if (mode === 'boss-win') return 'Jefe Final - VICTORIA';
  if (mode === 'boss-lose') return 'Jefe Final - Derrota';
  return mode;
}

// Componente que anima un numero de 0 al valor final con easing cubico
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);
  return display;
}

// Anillo SVG que muestra el porcentaje de acierto con gradiente animado
function AccuracyRing({ percent }) {
  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (percent / 100) * circumference;
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

  return (
    <div className="accuracy-ring">
      <svg viewBox="0 0 140 140">
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="70" cy="70" r="65" />
        <circle
          className="ring-fill"
          cx="70" cy="70" r="65"
          style={{ strokeDashoffset: animated ? offset : circumference }}
        />
      </svg>
      <div className="ring-label">
        <AnimatedNumber value={percent} />%
      </div>
    </div>
  );
}

// Lluvia de confetti con colores aleatorios para celebrar buenos resultados
function Confetti() {
  const colors = ['#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#f87171'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    rot: 360 + Math.random() * 720,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            '--x': p.x + '%',
            '--delay': p.delay + 's',
            '--duration': p.duration + 's',
            '--rot': p.rot + 'deg',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// Decide la medalla segun el porcentaje de acierto (oro >= 90%, plata >= 70%, bronce >= 50%)
function getMedal(accuracy) {
  if (accuracy >= 90) return { emoji: '\u{1F3C6}', cls: 'medal-gold', label: 'Oro' };
  if (accuracy >= 70) return { emoji: '\u{1F948}', cls: 'medal-silver', label: 'Plata' };
  if (accuracy >= 50) return { emoji: '\u{1F949}', cls: 'medal-bronze', label: 'Bronce' };
  return null;
}

export default function Results() {
  const { state } = useLocation();
  const nav = useNavigate();
  if (!state?.result) return <Navigate to="/" replace />;

  const { result, subject, mode, boss, bossSummary } = state;
  const { summary } = result;
  const accuracy = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
  const isBossWin = mode === 'boss-win';
  const isBossLose = mode === 'boss-lose';
  const isBoss = isBossWin || isBossLose;
  const medal = getMedal(accuracy);
  const showConfetti = isBossWin || accuracy >= 80;

  return (
    <div className="container-narrow anim-fade-in-up">
      {showConfetti && <Confetti />}

      <div className="card-strong center">
        {isBoss && boss && (
          <div className={isBossWin ? 'anim-victory' : 'anim-defeat'} style={{ marginBottom: 12 }}>
            <BossAvatar
              bossSlug={boss.slug}
              phase={isBossWin ? 1 : 3}
              variant={isBossWin ? 'ko' : 'victorious'}
            />
          </div>
        )}

        <div className={`pill ${isBossWin ? 'success' : isBossLose ? 'danger' : 'accent'}`} style={{marginBottom: 16}}>
          {subject?.name} · {modeLabel(mode)}
        </div>

        {isBossWin && (
          <div className="anim-victory" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--success)' }}>
            Has derrotado a {boss?.name}!
          </div>
        )}
        {isBossLose && (
          <div className="anim-defeat" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--danger)' }}>
            {boss?.name} te ha vencido...
          </div>
        )}

        {!isBoss && medal && (
          <div className={`medal ${medal.cls} anim-scale-pop`}>
            {medal.emoji}
          </div>
        )}

        <AccuracyRing percent={accuracy} />

        <div className="muted" style={{textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, marginBottom: 4}}>Puntuacion</div>
        <div className="score-big anim-glow">
          <AnimatedNumber value={summary.score} duration={1800} />
        </div>

        <div className="stats-grid anim-stagger" style={{marginTop: 28}}>
          <div className="stat">
            <div className="stat-value" style={{color: 'var(--success)'}}>{summary.correct}</div>
            <div className="stat-label">Correctas</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{color: 'var(--danger)'}}>{summary.wrong}</div>
            <div className="stat-label">Falladas</div>
          </div>
          <div className="stat">
            <div className="stat-value muted">{summary.skipped}</div>
            <div className="stat-label">Saltadas</div>
          </div>
          <div className="stat">
            <div className="stat-value">{summary.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        {isBoss && bossSummary && (
          <div className="stats-grid" style={{ marginTop: 14 }}>
            <div className="stat">
              <div className="stat-value mono" style={{ fontSize: 20 }}>{bossSummary.damageDealt}</div>
              <div className="stat-label">Dano total</div>
            </div>
            <div className="stat">
              <div className="stat-value mono" style={{ fontSize: 20 }}>{bossSummary.playerHpLeft}</div>
              <div className="stat-label">HP restante</div>
            </div>
          </div>
        )}

        <div className="row" style={{justifyContent:'center', marginTop: 28}}>
          <button className="btn btn-ghost" onClick={() => nav('/')}>Inicio</button>
          <button className="btn btn-primary" onClick={() => nav('/leaderboard')}>Ver ranking</button>
          <button className="btn btn-ghost" onClick={() => nav(`/subjects/${subject.slug}`)}>Otra ronda</button>
        </div>
      </div>

      {result.review?.length > 0 && (
        <div style={{marginTop: 32}}>
          <h3 className="h-section">Revision</h3>
          <div className="stack">
            {result.review.map((r, i) => (
              <div key={i} className="card" style={{
                borderLeft: `3px solid ${r.status === 'correct' ? 'var(--success)' : r.status === 'skipped' ? 'var(--fg-mute)' : 'var(--danger)'}`
              }}>
                <div className="row" style={{justifyContent: 'space-between'}}>
                  <span className="muted" style={{ fontSize: 13 }}>Pregunta {i + 1}</span>
                  <span className={`pill ${r.status === 'correct' ? 'success' : 'danger'}`}>
                    {r.status === 'correct' ? 'Correcta' : r.status === 'skipped' ? 'Saltada' : 'Fallada'}
                  </span>
                </div>
                {r.expected !== undefined && r.status !== 'correct' && (
                  <div className="muted" style={{marginTop: 8, fontSize: 14}}>
                    Respuesta correcta: <strong className="mono">{JSON.stringify(r.expected)}</strong>
                  </div>
                )}
                {r.explanation && (
                  <div style={{marginTop: 8, fontSize: 14, color: 'var(--fg-dim)'}}>{r.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
