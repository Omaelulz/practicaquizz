// Pagina de seleccion de modo - el usuario elige como quiere jugar
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// Modos disponibles con su icono y descripcion
const MODES = [
  { id: 'study',  name: 'Estudio',  desc: 'Sin timer, con explicacion al fallar.', icon: '📚' },
  { id: 'sprint', name: 'Sprint',   desc: '10 preguntas, 30s cada una.',           icon: '⚡' },
  { id: 'exam',   name: 'Examen',   desc: '45 preguntas, 1 minuto cada una. Cuenta para el ranking.', icon: '🎯' },
  { id: 'duel',   name: 'Duelo 1v1', desc: '10 preguntas contra QuizBot 3000. Quien acierta mas, gana.', icon: '⚔️' }
];

export default function ModeSelect() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getSubjects()
      .then((list) => {
        if (cancelled) return;
        const s = list.find((x) => x.slug === slug);
        if (!s) setError('Asignatura no encontrada');
        else setSubject(s);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [slug]);

  if (error) return <div className="container anim-fade-in-up"><div className="alert error">{error}</div></div>;
  if (!subject) return <div className="container"><div className="loading-spinner" style={{marginTop:60}} /></div>;

  return (
    <div className="container anim-fade-in-up">
      <div style={{marginBottom: 28}}>
        <div className="pill accent" style={{marginBottom: 10}}>{subject.icon} {subject.name}</div>
        <h1 className="h-1">Elige tu modo</h1>
        <p className="subtitle">{subject.description}</p>
      </div>

      <div className="subject-grid anim-stagger">
        {MODES.map((m) => (
          <button key={m.id} className="subject-card" style={{'--c': subject.color}} onClick={() => nav(m.id === 'duel' ? `/duel/${slug}` : `/quiz/${slug}/${m.id}`)}>
            <div className="subject-icon">{m.icon}</div>
            <div className="subject-name">{m.name}</div>
            <div className="subject-desc">{m.desc}</div>
          </button>
        ))}
        {subject.boss && (
          <button
            className="subject-card"
            style={{'--c': subject.boss.theme_color}}
            onClick={() => nav(`/boss/${slug}`)}
          >
            <div className="subject-icon">🔥</div>
            <div className="subject-name">Jefe Final · {subject.boss.name}</div>
            <div className="subject-desc">Combate epico contra el jefe final. Demuestra lo que sabes.</div>
          </button>
        )}
      </div>
    </div>
  );
}
