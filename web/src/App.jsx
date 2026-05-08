import { useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './store/auth';

import Login from './pages/Login';
import Home from './pages/Home';
import ModeSelect from './pages/ModeSelect';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import BossFight from './pages/BossFight';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Duel from './pages/Duel';
import CodeOrder from './pages/CodeOrder';
import Debugger from './pages/Debugger';

function Navbar() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        <span className="brand-mark">Q</span>
        Quiz DAW
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/leaderboard">Ranking</NavLink>
        {user && <NavLink to="/profile">Perfil</NavLink>}
        {user
          ? <button className="btn btn-ghost" onClick={async () => { await signOut(); nav('/login'); }}>Salir</button>
          : <NavLink to="/login" className="btn btn-primary">Entrar</NavLink>
        }
      </div>
    </nav>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const init = useAuth((s) => s.init);
  const loading = useAuth((s) => s.loading);
  useEffect(() => { init(); }, [init]);

  if (loading) {
    return <div className="container center" style={{paddingTop:80}}><div className="loading-spinner" /></div>;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/subjects/:slug" element={<Protected><ModeSelect /></Protected>} />
        <Route path="/quiz/:slug/:mode" element={<Protected><Quiz /></Protected>} />
        <Route path="/results" element={<Protected><Results /></Protected>} />
        <Route path="/boss/:slug" element={<Protected><BossFight /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/duel/:slug" element={<Protected><Duel /></Protected>} />
        <Route path="/minigame/code-order" element={<Protected><CodeOrder /></Protected>} />
        <Route path="/minigame/debugger" element={<Protected><Debugger /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
