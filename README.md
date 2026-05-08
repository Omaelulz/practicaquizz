# Quiz DAW

Quiz competitivo para alumnos de 1º de Desarrollo de Aplicaciones Web. Pueden estudiar las asignaturas (Programación Java, Lenguaje de Marcas, Bases de Datos), competir en rankings y enfrentarse a jefes finales (**Laura** y **Luján**).

## Stack

- **Frontend:** React + Vite + Zustand + React Router
- **Backend:** Fastify (Node.js)
- **DB + Auth:** Supabase (PostgreSQL + Auth)

## Estructura

```
quiz-daw/
├── supabase/      → schema.sql + seed.sql (ejecutar en Supabase)
├── api/           → Fastify (Node)
└── web/           → React + Vite
```

## Setup paso a paso

### 1. Crear proyecto Supabase

1. Crea un proyecto en https://supabase.com.
2. Abre el **SQL Editor** y ejecuta primero `supabase/schema.sql` y luego `supabase/seed.sql`.
3. En **Project Settings → API**, copia:
   - `Project URL`
   - `anon` public key
   - `service_role` secret key (¡NO la metas en el frontend!)
4. Recomendado durante desarrollo: en **Authentication → Providers → Email**, desactiva *"Confirm email"* para que el signup sea inmediato.

### 2. Backend (api/)

```powershell
cd api
copy .env.example .env
# Edita .env con tus credenciales de Supabase
npm install
npm run dev
```

API disponible en `http://localhost:3000`. Endpoint de salud: `GET /health`.

### 3. Frontend (web/)

```powershell
cd web
copy .env.example .env
# Edita .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
```

Web en `http://localhost:5173`.

## Modos de juego

| Modo | Preguntas | Timer | Cuenta para ranking |
|------|-----------|-------|---------------------|
| Estudio | 20 | sin timer | no |
| Sprint  | 10 | 30s | no |
| Examen  | 45 | 1 min/pregunta | **sí** |
| Jefe Final | 30 | 30s (baja por fases) | sí (ranking propio) |

## Tipos de pregunta

- `multiple_choice` — 4 opciones
- `true_false` — verdadero/falso
- `fill_code` — completar un trozo de código
- `code_output` — ¿qué imprime este código?
- `er_diagram` — preguntas sobre modelos E/R (sólo BD)

## Sistema de jefes

- **Laura** (Programación + Marcas) — joven, exigente, frases tipo *"Eso no es semántico, lo sabes"*.
- **Luján** (Bases de Datos) — mayor, pasota, *"Bah, eso es trivial."*

Mecánica:
- 30 preguntas mezcladas (10 fáciles + 10 medias + 10 difíciles).
- 3 fases según el HP del jefe (66% / 33%): el timer baja en las fases 2 y 3.
- Daño por dificultad: 80 / 110 / 160 HP.
- El jugador empieza con 100 de "concentración", pierde 15 por cada fallo.
- Para desbloquear el jefe hay que sacar **3000 puntos** mínimo en Modo Examen de esa asignatura.

## Seguridad

- Las preguntas se sirven al cliente **sin** el campo `answer`.
- La corrección se hace en el servidor (`/quiz/submit` y `/boss/submit`).
- Las puntuaciones las calcula el backend.
- Las RLS de Supabase impiden que un usuario lea/escriba intentos ajenos.

## Roadmap

**MVP (entregado)**
- Auth con Supabase
- 3 asignaturas con preguntas seed
- Modos Estudio / Sprint / Examen
- Combate contra jefes
- Ranking global, por asignatura, hall of fame de jefes

**V2 ideas**
- Reto diario con racha
- Duelo 1v1 realtime (Supabase Realtime)
- Avatares e insignias por jefes derrotados
- Editor admin para añadir preguntas desde la web
- Visualizador de diagramas E/R (renderizar SVG en pregunta)
- Sistema ELO para ranking más justo

## Comandos rápidos

```powershell
# arrancar todo (en dos terminales)
cd api ; npm run dev
cd web ; npm run dev
```

## Deploy en Netlify

El repo está preparado para desplegarse entero en Netlify: el frontend Vite como sitio estático y la API Fastify como **una sola Netlify Function** (`netlify/functions/api.js`) usando `@fastify/aws-lambda`.

### Archivos clave
- `netlify.toml` — build, publish dir y redirects (`/api/*` → función, SPA fallback).
- `package.json` (raíz) — dependencias de la función + script `build` que instala/compila `web/`.
- `api/src/app.js` — `buildApp()` reutilizado por `server.js` y la Function.

### Pasos

1. Sube el repo a GitHub/GitLab y conéctalo en https://app.netlify.com → *Add new site → Import from Git*.
2. Netlify detectará `netlify.toml` automáticamente. No hace falta tocar build settings.
3. En **Site settings → Environment variables** añade:

   | Variable | Valor |
   |---|---|
   | `SUPABASE_URL` | URL del proyecto Supabase |
   | `SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (sólo backend) |
   | `VITE_SUPABASE_URL` | mismo valor que `SUPABASE_URL` |
   | `VITE_SUPABASE_ANON_KEY` | mismo valor que `SUPABASE_ANON_KEY` |
   | `VITE_API_URL` | `/api` |
   | `WEB_ORIGIN` | URL pública del sitio (ej. `https://tu-sitio.netlify.app`) |

4. Lanza el deploy. La API queda en `https://tu-sitio.netlify.app/api/*` (ej. `/api/health`).

### Notas
- Las Functions tienen *cold start*: la primera petición tras inactividad puede tardar 1-2s.
- Para probar el deploy en local: `npm i -g netlify-cli` y `netlify dev` desde la raíz.
