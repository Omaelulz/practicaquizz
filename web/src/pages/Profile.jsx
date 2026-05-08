import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Profile() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.myStats()
      .then((d) => { if (!cancelled) setStats(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="container anim-fade-in-up"><div className="alert error">{error}</div></div>;
  if (!stats) return <div className="container"><div className="loading-spinner" style={{marginTop:60}} /></div>;

  const { profile, attempts, bossWins } = stats;

  const totalScore = attempts.filter(a => a.mode === 'exam').reduce((sum, a) => sum + a.score, 0);
  const examCount = attempts.filter(a => a.mode === 'exam').length;
  const totalCorrect = attempts.reduce((s, a) => s + a.correct, 0);
  const totalAnswered = attempts.reduce((s, a) => s + a.total, 0);
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="container-narrow anim-fade-in-up">
      <div className="card-strong">
        <div className="muted" style={{fontSize:12, textTransform:'uppercase', letterSpacing:'0.16em'}}>Perfil</div>
        <h1 className="h-1">{profile.username}</h1>
        <div className="muted" style={{fontSize:14}}>Miembro desde {new Date(profile.created_at).toLocaleDateString('es-ES')}</div>

        <div className="stats-grid" style={{marginTop: 22}}>
          <div className="stat">
            <div className="stat-value">{totalScore}</div>
            <div className="stat-label">Puntos totales</div>
          </div>
          <div className="stat">
            <div className="stat-value">{examCount}</div>
            <div className="stat-label">Exámenes</div>
          </div>
          <div className="stat">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label">Precisión</div>
          </div>
          <div className="stat">
            <div className="stat-value">{bossWins.length}</div>
            <div className="stat-label">Jefes vencidos</div>
          </div>
        </div>
      </div>

      {bossWins.length > 0 && (
        <div style={{marginTop: 28}}>
          <h2 className="h-section">Jefes derrotados</h2>
          <div className="stack-sm">
            {bossWins.map((bw, i) => (
              <div key={i} className="card row" style={{justifyContent:'space-between'}}>
                <div>
                  <strong>🏆 {bw.boss?.name}</strong>
                  <div className="muted" style={{fontSize:13}}>{new Date(bw.finished_at).toLocaleString('es-ES')}</div>
                </div>
                <div className="mono"><strong>{bw.score} pts</strong></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop: 28}}>
        <h2 className="h-section">Últimas partidas</h2>
        {attempts.length === 0 ? (
          <div className="muted">Aún no has jugado. ¡A por ello!</div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Modo</th>
                <th>Aciertos</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={i}>
                  <td className="muted">{new Date(a.finished_at).toLocaleString('es-ES')}</td>
                  <td>{a.mode}</td>
                  <td className="mono">{a.correct}/{a.total}</td>
                  <td className="mono"><strong>{a.score}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
