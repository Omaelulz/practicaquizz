// Clientes de Supabase para el backend - admin (service_role) y anon
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import 'dotenv/config';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// En entornos serverless (Node < 22) no hay WebSocket nativo y supabase-js peta
// al inicializar el RealtimeClient. Le pasamos ws explícitamente.
const commonOpts = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
};

// Cliente admin - salta las politicas RLS, para insertar datos de cualquier usuario
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  commonOpts
);

// Cliente anon - solo para verificar tokens JWT de los usuarios
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  commonOpts
);
