// Pagina de login y registro - con email/password y Google OAuth
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const nav = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      if (mode === 'signup') {
        if (username.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres.');
        await signUp(email, password, username);
        setInfo('Cuenta creada. Revisa tu email si Supabase tiene confirmación activada, si no ya puedes entrar.');
        setMode('login');
      } else {
        await signIn(email, password);
        nav('/');
      }
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-narrow anim-fade-in-up" style={{paddingTop: 60}}>
      <div className="card-strong">
        <div className="center" style={{marginBottom: 24}}>
          <h1 className="h-1">{mode === 'login' ? 'Vuelve a la batalla' : 'Crea tu héroe'}</h1>
          <p className="subtitle">
            {mode === 'login' ? 'Entra y sube en el ranking.' : 'Elige nombre y prepárate para el primer asalto.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Nombre de jugador</label>
              <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} required minLength={3} maxLength={24} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert success">{info}</div>}

          <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="divider-or">
          <span>o</span>
        </div>

        <button
          className="btn btn-block btn-lg btn-google"
          onClick={async () => {
            setError(null);
            try { await signInWithGoogle(); }
            catch (err) { setError(err.message || 'Error con Google'); }
          }}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar con Google
        </button>

        <div className="center" style={{marginTop: 18}}>
          {mode === 'login' ? (
            <span className="muted">¿No tienes cuenta? <button className="btn btn-ghost" onClick={()=>setMode('signup')}>Regístrate</button></span>
          ) : (
            <span className="muted">¿Ya tienes cuenta? <button className="btn btn-ghost" onClick={()=>setMode('login')}>Entrar</button></span>
          )}
        </div>
      </div>

      <div className="center" style={{marginTop: 18}}>
        <Link to="/leaderboard" className="muted">→ Ver ranking sin entrar</Link>
      </div>
    </div>
  );
}
