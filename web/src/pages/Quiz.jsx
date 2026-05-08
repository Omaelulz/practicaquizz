import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';

// Pagina principal del quiz
// Carga las preguntas del servidor y las muestra una a una
// Al terminar envia las respuestas y redirige a resultados
export default function Quiz() {
  const { slug, mode } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakAnim, setStreakAnim] = useState(false);
  const startedAtRef = useRef(null);
  const answeredCountRef = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api.startQuiz(slug, mode)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          startedAtRef.current = Date.now();
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => { cancelled = true; };
  }, [slug, mode]);

  if (error) return <div className="container anim-fade-in-up"><div className="alert error">{error}</div></div>;
  if (!data) return <div className="container"><div className="loading-spinner" style={{marginTop:60}} /></div>;

  const { questions, config, subject } = data;
  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const hasTimer = !!config.secondsPerQuestion;

  // Guarda la respuesta del usuario para la pregunta actual
  const setAnswer = (val) => setAnswers((a) => ({ ...a, [q.id]: val }));

  // Avanza a la siguiente pregunta o envia si es la ultima
  function handleNext() {
    // Controlamos la racha: si contesta sube, si salta se resetea
    const answered = answers[q.id] !== null && answers[q.id] !== undefined && answers[q.id] !== '';
    if (answered) {
      answeredCountRef.current++;
      const newStreak = answeredCountRef.current;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newStreak > 0 && newStreak % 5 === 0) {
        setStreakAnim(true);
        setTimeout(() => setStreakAnim(false), 600);
      }
    } else {
      answeredCountRef.current = 0;
      setStreak(0);
    }

    if (isLast) submit();
    else setIdx(idx + 1);
  }

  // Envia todas las respuestas al servidor para corregirlas
  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const duration_sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
    const payload = {
      subject: slug,
      mode,
      duration_sec,
      answers: questions.map((q) => ({ question_id: q.id, given: answers[q.id] ?? null }))
    };
    try {
      const result = await api.submitQuiz(payload);
      nav('/results', { state: { result, subject, mode } });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  const streakLabel = streak >= 10 ? 'IMPARABLE' : streak >= 7 ? 'EN LLAMAS' : streak >= 5 ? 'RACHA' : streak >= 3 ? 'x' + streak : '';

  return (
    <div className="container-narrow anim-fade-in-up">
      <div className="quiz-header">
        <div>
          <div className="pill accent">{subject.icon || '•'} {subject.name}</div>
          <div className="muted" style={{fontSize: 13, marginTop: 6}}>
            Pregunta <strong>{idx + 1}</strong> de {questions.length}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {streak >= 3 && (
            <div className={`streak-badge ${streakAnim ? 'anim-scale-pop' : ''}`}>
              🔥 {streakLabel}
            </div>
          )}
          {hasTimer && (
            <Timer
              seconds={config.secondsPerQuestion}
              resetKey={q.id}
              onExpire={handleNext}
              paused={submitting}
            />
          )}
        </div>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{width: `${((idx) / questions.length) * 100}%`}} />
      </div>

      <div className="card-strong anim-card-in" key={q.id}>
        <QuestionCard
          question={q}
          value={answers[q.id]}
          onChange={setAnswer}
          disabled={submitting}
        />
      </div>

      <div className="row-end" style={{marginTop: 18}}>
        <button className="btn btn-ghost" onClick={() => { setAnswer(null); handleNext(); }}>Saltar</button>
        <button className="btn btn-primary" onClick={handleNext} disabled={submitting}>
          {isLast ? 'Terminar y ver resultados' : 'Siguiente →'}
        </button>
      </div>

      <div className="center muted" style={{marginTop: 14, fontSize: 13}}>
        Puedes saltar preguntas, pero contaran como falladas.
      </div>
    </div>
  );
}
