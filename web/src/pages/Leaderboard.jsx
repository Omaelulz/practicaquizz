import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const TABS = [
  { id: 'global',       label: 'Global' },
  { id: 'programacion', label: 'Programación' },
  { id: 'marcas',       label: 'Marcas' },
  { id: 'basesdedatos', label: 'BD' },
  { id: 'laura',        label: '👓 Laura' },
  { id: 'lujan',        label: '🧔 Luján' }
];

function rankClass(i) {
  if (i === 0) return 'lb-rank gold';
  if (i === 1) return 'lb-rank silver';
  if (i === 2) return 'lb-rank bronze';
  return 'lb-rank';
}

export default function Leaderboard() {
  const [tab, setTab] = useState('global');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    let promise;
    if (tab === 'global') promise = api.lbGlobal(50);
    else if (['programacion','marcas','basesdedatos'].includes(tab)) promise = api.lbSubject(tab, 50);
    else promise = api.lbBoss(tab, 50);
    promise
      .then((d) => { if (!cancelled) setRows(d || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab]);

  const isBoss = ['laura', 'lujan'].includes(tab);

  return (
    <div className="container-narrow anim-fade-in-up">
      <h1 className="h-1">Ranking</h1>
      <p className="subtitle">Sólo cuentan partidas en Modo Examen y combates ganados.</p>

      <div className="tabs" style={{marginTop: 24}}>
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading && <div><div className="loading-spinner" style={{marginTop:20}} /></div>}

      {!loading && rows.length === 0 && (
        <div className="muted center" style={{padding: 24}}>Aún no hay puntuaciones aquí. ¡Sé el primero!</div>
      )}

      {!loading && rows.length > 0 && (
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              {isBoss ? <th>HP restante</th> : null}
              {isBoss ? <th>Tiempo</th> : null}
              <th>{tab === 'global' ? 'Puntos totales' : isBoss ? 'Puntos' : 'Mejor puntuación'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.user_id}-${i}`}>
                <td className={rankClass(i)}>#{i + 1}</td>
                <td><strong>{r.username}</strong></td>
                {isBoss && <td className="mono muted">{r.hp_left}</td>}
                {isBoss && <td className="mono muted">{r.time_left_sec}s</td>}
                <td className="mono"><strong>{r.total_score ?? r.best_score ?? r.score}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
