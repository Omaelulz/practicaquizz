// Pagina principal - muestra asignaturas, modos de juego y minijuegos
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import BossAvatar from '../components/BossAvatar';

// Lista de jefes para el carrusel del hero
const BOSSES = [
  { slug: 'laura', name: 'Laura', title: 'La Profesora Exigente' },
  { slug: 'lujan', name: 'Lujan', title: 'El Profesor Pasota' },
];

// Carrusel que rota entre los jefes con efecto fade
function BossShowcase() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let timeoutId = null;
    const interval = setInterval(() => {
      setFading(true);
      timeoutId = setTimeout(() => {
        setCurrent((c) => (c + 1) % BOSSES.length);
        setFading(false);
      }, 400);
    }, 6000);
    return () => { clearInterval(interval); clearTimeout(timeoutId); };
  }, []);

  const boss = BOSSES[current];

  return (
    <div className="boss-showcase">
      <div className={`boss-showcase-inner ${fading ? 'fading' : ''}`}>
        <BossAvatar bossSlug={boss.slug} phase={1} />
        <div className="boss-showcase-label">
          <div style={{ fontWeight: 800, fontSize: 18 }}>{boss.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{boss.title}</div>
        </div>
      </div>
      <div className="boss-showcase-dots">
        {BOSSES.map((b, i) => (
          <button
            key={b.slug}
            className={`boss-dot ${i === current ? 'active' : ''}`}
            onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getSubjects()
      .then((d) => { if (!cancelled) setSubjects(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="home-hero">
        <div className="anim-fade-in-up" style={{maxWidth: 760}}>
          <h1 className="h-mega">
            Estudia.<br/>
            <span className="text-gradient">Compite.</span><br/>
            Vence al jefe final.
          </h1>
          <p className="subtitle" style={{fontSize: 18, maxWidth: 580, lineHeight: 1.65}}>
            Test de las asignaturas de 1 DAW con timer, ranking en vivo y combates contra Laura y Lujan. 45 preguntas, 1 minuto cada una. Tu decides cuando te enfrentas a ellos.
          </p>
          {!user && (
            <div className="row" style={{marginTop: 24, gap: 14}}>
              <button className="btn btn-primary btn-lg" onClick={() => nav('/login')}>Empezar a jugar</button>
              <button className="btn btn-ghost btn-lg" onClick={() => nav('/leaderboard')}>Ver ranking</button>
            </div>
          )}
          {user && (
            <div className="row" style={{marginTop: 24, gap: 14}}>
              <button className="btn btn-primary btn-lg" onClick={() => nav('/leaderboard')}>Ver ranking</button>
              <button className="btn btn-ghost btn-lg" onClick={() => nav('/profile')}>Mi perfil</button>
            </div>
          )}
        </div>
        <div className="anim-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <BossShowcase />
        </div>
      </div>

      <h2 className="h-section">Asignaturas</h2>
      {error && <div className="alert error">{error}</div>}
      <div className="subject-grid anim-stagger">
        {subjects.map((s) => (
          <button
            key={s.id}
            className="subject-card"
            style={{ '--c': s.color }}
            onClick={() => nav(user ? `/subjects/${s.slug}` : '/login')}
          >
            <div className="subject-icon">{s.icon}</div>
            <div className="subject-name">{s.name}</div>
            <div className="subject-desc">{s.description}</div>
            {s.boss && (
              <span className="boss-tag">
                <span style={{color: s.boss.theme_color, fontSize: 10}}>*</span>
                Jefe: {s.boss.name}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="spacer-lg" />
      <h2 className="h-section">Modos de juego</h2>
      <div className="subject-grid anim-stagger">
        <div className="card mode-card">
          <div className="mode-icon">📚</div>
          <div className="h-2">Estudio</div>
          <div className="muted">Sin timer, con explicacion al fallar. Ideal para repasar.</div>
        </div>
        <div className="card mode-card">
          <div className="mode-icon">🎯</div>
          <div className="h-2">Examen (45x1min)</div>
          <div className="muted">El modo serio. Cuenta para el ranking.</div>
        </div>
        <div className="card mode-card">
          <div className="mode-icon">⚡</div>
          <div className="h-2">Sprint</div>
          <div className="muted">10 preguntas, 30 segundos cada una.</div>
        </div>
        <div className="card mode-card">
          <div className="mode-icon">⚔️</div>
          <div className="h-2">Duelo 1v1</div>
          <div className="muted">Compite contra QuizBot 3000 en tiempo real.</div>
        </div>
        <div className="card mode-card">
          <div className="mode-icon">🔥</div>
          <div className="h-2">Jefe Final</div>
          <div className="muted">Combate epico contra el jefe final. Abierto para todos.</div>
        </div>
      </div>

      <div className="spacer-lg" />
      <h2 className="h-section">Minijuegos</h2>
      <div className="subject-grid anim-stagger">
        <button className="subject-card" style={{'--c': '#f59e0b'}} onClick={() => nav(user ? '/minigame/code-order' : '/login')}>
          <div className="subject-icon">🧩</div>
          <div className="subject-name">Ordena el Codigo</div>
          <div className="subject-desc">Arrastra las lineas de codigo para ordenarlas correctamente.</div>
        </button>
        <button className="subject-card" style={{'--c': '#ef4444'}} onClick={() => nav(user ? '/minigame/debugger' : '/login')}>
          <div className="subject-icon">🐛</div>
          <div className="subject-name">Debugger</div>
          <div className="subject-desc">Encuentra el bug en el codigo. Pon a prueba tu ojo critico.</div>
        </button>
      </div>
    </div>
  );
}
