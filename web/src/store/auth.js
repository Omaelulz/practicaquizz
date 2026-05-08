// Store de autenticacion con Zustand - maneja login, registro y sesion
// Store de autenticacion con Zustand - maneja login, registro y sesion
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

let authSubscription = null;

export const useAuth = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    // Evita registrar multiples listeners (StrictMode llama init dos veces)
    if (authSubscription) authSubscription.unsubscribe();
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
    authSubscription = subscription;
  },

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
