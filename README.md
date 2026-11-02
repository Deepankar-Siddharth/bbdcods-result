# BBDU Dental Result Portal

Student examination result portal for Babu Banarasi Das University (BBDU) Dental College (BDS 1st–4th Year).

## Architecture

- **Frontend**: Next.js (App Router, static export) deployed to GitHub Pages.
- **Backend**: Express proxy service (Node.js) that establishes an authorized session with the university examination cell, obtains a CSRF token, and retrieves results. Deploy to an external host (Render/Railway/Vercel/Fly.io). GitHub Pages cannot run server-side code, so secrets and tokens stay on the backend.

## Security

- No secrets are committed. Copy `.env.example` to `.env` (frontend) / backend env.
- The university CSRF token is fetched per session from the form page; it is never hardcoded.
- The legacy Telegram script (`bbdcods_result2324.py`) contained a hardcoded CSRF token and Telegram bot token. Those credentials are considered exposed — rotate them. That file is intentionally not part of this repository.

## Academic Year Configs

See `config/years.ts` (frontend) and `backend/server.js` `YEAR_CONFIGS`. Each BDS year has its own roll-number prefix and examination parameters. Update when new configs are provided.

## Development

Frontend:
```bash
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
```

Set `NEXT_PUBLIC_API_BASE` to the backend URL.

## Deployment

- Frontend: push to `main` triggers GitHub Actions deploy to Pages.
- Backend: deploy `backend/` to a Node host and set env vars. Update `NEXT_PUBLIC_API_BASE` and rebuild frontend.

## Features

- BDS year selection, roll-number input, search.
- Original result presentation (embedded) + structured fields.
- Previous/Next result navigation.
- Result download (HTML).
- Bulk collection (SSE progress, skip unavailable, export JSON/CSV).
- Ranking (total marks, max, percentage, pass/fail, tie handling).

## Privacy

Bulk collection and ranking are intended for authorized use. Do not enumerate or collect private academic records without appropriate authorization. Respect university access restrictions and rate limits.