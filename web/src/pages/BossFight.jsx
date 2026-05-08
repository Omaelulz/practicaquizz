import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import BossAvatar from '../components/BossAvatar';

// Pagina del modo jefe final
// El jugador responde preguntas para hacer dano al boss
// Si falla pierde concentracion, si llega a 0 pierde

const DAMAGE = { 1: 80, 2: 110, 3: 160 }; // dano por dificultad
const PLAYER_HP_LOSS = 15; // concentracion que pierde al fallar

// Comprueba localmente si una respuesta es correcta para el feedback visual.
// El servidor sigue siendo la fuente de verdad para la puntuacion.
function isAnswerCorrect(question, given) {
  if (given === null || given === undefined || given === '') return false;
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

function phaseFromHp(hp, max) {
  const ratio = hp / max;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}

function phaseConfig(phase, baseSeconds) {
  if (phase === 2) return { seconds: Math.max(15, baseSeconds - 10), label: 'FASE 2 · El jefe se enfada' };
  if (phase === 3) return { seconds: Math.max(12, baseSeconds - 15), label: 'FASE 3 · Rafaga final!' };
  return { seconds: baseSeconds, label: 'FASE 1 · Calentamiento' };
}

// Frases que dicen los jefes antes de empezar la pelea
const BOSS_SPEECHES = {
  lujan: 'Bueno bueno, antes tenia 3 trabajos, pero ahora tengo uno extra, y es saber si eres capaz de superar el test final...',
  laura: 'Bueno, si estas aqui es porque quieres saber si tu nivel esta a su maximo, asi que mucha suerte...'
};

// Overlay final: jefe KO con ojos en cruz si gana el jugador,
// o jefe victorioso (Laura con espada / Lujan con cacharro vintage) si pierde.
function BossEndScene({ boss, won, onContinue, ready }) {
  const isLaura = boss.slug === 'laura';
  const speech = won
    ? (isLaura ? 'Bien hecho... lo has clavado.' : 'Vaya, parece que sí estás listo.')
    : (isLaura ? '¡Has perdido! Repasa más para el examen final.' : '¡Has perdido! Te lo dije, ciclo superior.');
  const headline = won ? '¡VICTORIA!' : 'PERDISTE';

  return (
    <div className="boss-end-overlay">
      <div className={won ? 'boss-end-figure anim-ko-shake' : 'boss-end-figure anim-villain-rise'}>
        <BossAvatar bossSlug={boss.slug} phase={won ? 3 : 1} variant={won ? 'ko' : 'victorious'} />
      </div>
      <div
        className={`boss-end-textbox ${won ? 'win' : 'lose'} anim-fade-in-up`}
        style={{ borderColor: boss.theme_color }}
      >
        <div className="boss-end-headline" style={{ color: won ? 'var(--success)' : 'var(--danger)' }}>
          {headline}
        </div>
        <div className="boss-end-speech">{speech}</div>
      </div>
      <button
        className="btn btn-primary btn-lg anim-fade-in-up"
        style={{ marginTop: 28 }}
        onClick={onContinue}
        disabled={!ready}
      >
        {ready ? 'Ver resultados' : 'Calculando puntuación…'}
      </button>
    </div>
  );
}

function BossIntro({ boss, onReady }) {
  const [showSpeech, setShowSpeech] = useState(false);
  const [typed, setTyped] = useState('');
  const [doneTyping, setDoneTyping] = useState(false);
  const speech = BOSS_SPEECHES[boss.slug] || '';

  useEffect(() => {
    const t = setTimeout(() => setShowSpeech(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showSpeech || !speech) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(speech.slice(0, i));
      if (i >= speech.length) {
        clearInterval(interval);
        setDoneTyping(true);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [showSpeech, speech]);

  return (
    <div className="boss-intro-overlay">
      <div className="anim-boss-entrance">
        <BossAvatar bossSlug={boss.slug} phase={1} />
      </div>
      <div className="boss-intro-vs">VS</div>
      <div className="boss-intro-title" style={{ color: boss.theme_color }}>
        {boss.name}
      </div>
      <div className="boss-intro-subtitle">{boss.title}</div>
      {showSpeech && (
        <div className="boss-speech-bubble anim-fade-in-up" style={{ borderColor: boss.theme_color }}>
          <span>{typed}</span>
          {!doneTyping && <span className="typing-cursor">|</span>}
        </div>
      )}
      {doneTyping && (
        <button
          className="btn btn-primary btn-lg anim-fade-in-up"
          style={{ marginTop: 24 }}
          onClick={onReady}
        >
          Aceptar el reto
        </button>
      )}
    </div>
  );
}

export default function BossFight() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [given, setGiven] = useState(null);
  const [bossHp, setBossHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [taunt, setTaunt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [hpFlash, setHpFlash] = useState(false);
  const [playerHpFlash, setPlayerHpFlash] = useState(false);
  const [endScene, setEndScene] = useState(null); // 'win' | 'lose' | null
  const [pendingResult, setPendingResult] = useState(null);
  const startedAtRef = useRef(null);
  const answersRef = useRef([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api.startBoss(slug)
      .then((d) => {
        if (!cancelled) {
          setState(d);
          setBossHp(d.config.boss_hp_start);
          setPlayerHp(d.config.player_hp_start);
          setTaunt(d.boss.taunts?.[0] ?? '');
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [slug]);

  if (error) {
    return (
      <div className="container-narrow anim-fade-in-up">
        <div className="alert error">{error}</div>
        <div style={{marginTop: 14}}>
          <button className="btn btn-ghost" onClick={() => nav(`/subjects/${slug}`)}>← Volver</button>
        </div>
      </div>
    );
  }
  if (!state) return <div className="container muted"><div className="loading-spinner" /></div>;

  if (showIntro) {
    return (
      <BossIntro
        boss={state.boss}
        onReady={() => {
          setShowIntro(false);
          startedAtRef.current = Date.now();
        }}
      />
    );
  }

  if (endScene) {
    return (
      <BossEndScene
        boss={state.boss}
        won={endScene === 'win'}
        onContinue={continueToResults}
        ready={!!pendingResult}
      />
    );
  }

  const { questions, boss, config, subject } = state;
  const q = questions[idx];
  const phase = phaseFromHp(bossHp, config.boss_hp_start);
  const pCfg = phaseConfig(phase, config.seconds_per_question);

  function chooseRandomTaunt() {
    const list = boss.taunts || [];
    if (!list.length) return;
    setTaunt(list[Math.floor(Math.random() * list.length)]);
  }

  function next() {
    answersRef.current.push({ question_id: q.id, given });
    const correct = isAnswerCorrect(q, given);

    let nextBossHp = bossHp;
    let nextPlayerHp = playerHp;

    if (correct) {
      const dmg = Math.round((DAMAGE[q.difficulty] || 100) * 0.85);
      nextBossHp = Math.max(0, bossHp - dmg);
      setBossHp(nextBossHp);
      setHpFlash(true);
      setTimeout(() => setHpFlash(false), 350);
    } else {
      nextPlayerHp = Math.max(0, playerHp - PLAYER_HP_LOSS);
      setPlayerHp(nextPlayerHp);
      setPlayerHpFlash(true);
      setTimeout(() => setPlayerHpFlash(false), 350);
    }
    chooseRandomTaunt();
    setGiven(null);

    const isLast = idx + 1 >= questions.length;
    if (nextBossHp <= 0) {
      submit('win');
    } else if (nextPlayerHp <= 0) {
      submit('lose');
    } else if (isLast) {
      submit(nextBossHp <= 0 ? 'win' : 'lose');
    } else {
      setIdx(idx + 1);
    }
  }

  async function submit(outcome) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setEndScene(outcome);
    const duration_sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
    try {
      const result = await api.submitBoss({
        subject: slug,
        duration_sec,
        answers: answersRef.current
      });
      setPendingResult({
        result: {
          summary: {
            total: result.summary.correct + result.summary.wrong,
            correct: result.summary.correct,
            wrong: result.summary.wrong,
            skipped: 0,
            score: result.summary.score
          },
          attempt: result.fight,
          review: result.review
        },
        subject,
        mode: result.summary.won ? 'boss-win' : 'boss-lose',
        bossSummary: result.summary,
        boss
      });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
      submittingRef.current = false;
      setEndScene(null);
    }
  }

  function continueToResults() {
    if (!pendingResult) return;
    nav('/results', { state: pendingResult });
  }

  const bossPct  = (bossHp / config.boss_hp_start) * 100;
  const playerPct = (playerHp / config.player_hp_start) * 100;

  return (
    <div className="container anim-fade-in-up">
      <div className="boss-stage">
        {/* Boss */}
        <div className="boss-portrait" style={{borderColor: boss.theme_color || 'var(--border)'}}>
          <div className="phase-banner" style={{color: boss.theme_color}}>{pCfg.label}</div>
          <BossAvatar bossSlug={boss.slug} phase={phase} />
          <div className="name" style={{color: boss.theme_color}}>{boss.name}</div>
          <div className="title">{boss.title}</div>
          <div className={`hp-bar${hpFlash ? ' anim-damage' : ''}`}>
            <div className={`hp-bar-fill boss${hpFlash ? ' anim-damage' : ''}`} style={{width: `${bossPct}%`}} />
          </div>
          <div className="muted mono" style={{fontSize: 12, marginTop: 4}}>HP {bossHp} / {config.boss_hp_start}</div>
          <div className="taunt">"{taunt}"</div>
        </div>

        {/* Player */}
        <div className="card">
          <div className="row" style={{justifyContent: 'space-between'}}>
            <strong>Tu</strong>
            <span className="muted mono" style={{fontSize: 12}}>Concentracion {playerHp}/{config.player_hp_start}</span>
          </div>
          <div className={`hp-bar${playerHpFlash ? ' anim-damage' : ''}`}>
            <div className={`hp-bar-fill ${playerPct < 35 ? 'danger' : ''}${playerHpFlash ? ' anim-damage' : ''}`} style={{width: `${playerPct}%`}} />
          </div>
        </div>
      </div>

      <div className="quiz-header">
        <div className="muted">Pregunta <strong>{idx + 1}</strong> / {questions.length}</div>
        <Timer seconds={pCfg.seconds} resetKey={q.id} onExpire={next} paused={submitting} />
      </div>

      <div className="progress">
        <div className="progress-fill" style={{width: `${(idx / questions.length) * 100}%`}} />
      </div>

      <div className="card-strong anim-card-in" key={q.id}>
        <QuestionCard question={q} value={given} onChange={setGiven} disabled={submitting} />
      </div>

      <div className="row-end" style={{marginTop: 18}}>
        <button className="btn btn-ghost" onClick={() => { setGiven(null); next(); }}>Saltar (-{PLAYER_HP_LOSS} HP)</button>
        <button className="btn btn-primary" onClick={next} disabled={submitting}>
          Atacar
        </button>
      </div>

      <div className="center muted" style={{marginTop: 12, fontSize: 13}}>
        Si pierdes toda la concentracion o se acaba el tiempo, derrota.
      </div>
    </div>
  );
}
