# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # run frontend + backend together (nodemon on server/index.js + vite --host)
npm run build   # vite build -> dist/
npm start       # node server/index.js (serves built dist/ + API, single process)
```

There is no test runner and no lint/format tooling configured in this project.

In dev, the API runs on port 3001 and Vite serves the frontend on 5173, proxying `/api/*` to the backend (see `vite.config.js`). In production (`npm start`), Express serves the built static files from `dist/` directly and falls back to `index.html` for any non-API route (SPA catch-all) — a single Node process handles everything.

## Architecture

Single-app full-stack project: Vite + React frontend in `src/`, Express + PostgreSQL backend in `server/`, one root `package.json`. Note that React/Vite are listed under `devDependencies` even though they're runtime frontend deps — this is why `railway.json` overrides the build command to `npm install --include=dev && npm run build` (Railway's default production install skips devDependencies, which would break the build).

**Backend**: `server/index.js` is the entry point, wiring route modules (`server/routes/splits.js`, `exercises.js`, `checkin.js`, `schedule.js`) plus a `/api/config` GET/PATCH endpoint for key-value user settings. `server/db.js` uses `pg.Pool` against `process.env.DATABASE_URL` (SSL only enabled when that var is set) with no ORM — raw parameterized SQL. `initDB()` auto-creates the schema (`splits`, `exercises`, `logged_sets`, `day_split_map`, `weekday_schedule`, `user_config`) and seed data on boot.

**Frontend**: `src/main.jsx` mounts `src/App.jsx`, which does manual view-based "routing" via `useState('landing'|'checkin'|'session'|'edit')` — no react-router, no global state library. Components fetch directly from `/api/...` (`Landing.jsx`, `CheckIn.jsx`, `WorkoutSession.jsx`, `EditPlan.jsx`, `ExerciseCard.jsx`).

Stray `.db`/`.db-shm`/`.db-wal` files in the repo root are leftovers from an earlier SQLite setup and are unrelated to the current Postgres-only code path (they're gitignored via `*.db`).

## Deployment

Deployed on Railway via `railway.json` (Nixpacks builder), healthcheck at `/api/config`.
