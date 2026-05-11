// Cliente API - todas las llamadas al backend pasan por aqui
import { supabase } from './supabase';

// En prod (Netlify) las llamadas pasan por /api/* (ver netlify.toml redirect a la function).
// En dev por defecto al backend local. VITE_API_URL puede sobreescribir ambos casos.
const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:3000');

// Saca el token JWT de la sesion actual para enviarlo como header
async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

// Funcion generica para hacer peticiones al backend con auth y manejo de errores
// Funcion generica para hacer peticiones al API con autenticacion
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  // Catalog
  getSubjects: () => request('GET', '/subjects'),
  getBosses:   () => request('GET', '/bosses'),

  // Quiz
  startQuiz: (subject, mode) => request('GET', `/quiz/start?subject=${subject}&mode=${mode}`),
  submitQuiz: (payload)      => request('POST', '/quiz/submit', payload),

  // Boss
  startBoss: (subject)       => request('GET', `/boss/start?subject=${subject}`),
  submitBoss: (payload)      => request('POST', '/boss/submit', payload),

  // Duel
  startDuel: (subject)       => request('GET', `/duel/start?subject=${subject}`),
  submitDuel: (payload)      => request('POST', '/duel/submit', payload),

  // Leaderboards
  lbGlobal:   (limit = 20)   => request('GET', `/leaderboard/global?limit=${limit}`),
  lbSubject:  (slug, limit = 20) => request('GET', `/leaderboard/subject/${slug}?limit=${limit}`),
  lbBoss:     (slug, limit = 20) => request('GET', `/leaderboard/boss/${slug}?limit=${limit}`),

  // Me
  myStats:    () => request('GET', '/me/stats'),

  // Debugger minigame
  startDebugger:  () => request('GET', '/minigame/debugger/start'),
  submitDebugger: (payload) => request('POST', '/minigame/debugger/submit', payload),

  // Code Order minigame
  startCodeOrder:  () => request('GET', '/minigame/code-order/start'),
  submitCodeOrder: (payload) => request('POST', '/minigame/code-order/submit', payload)
};
