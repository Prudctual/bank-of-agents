# Bank of Agents

Early concept app by Jasim Kareem. A neobank-style prototype for AI agents and wallets: register agents, assign balances and spending limits, review transactions, handle approvals, and inspect audit logs.

This is a local development prototype, not a production bank or licensed financial product.

## Stack

Frontend (`package.json`):

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- Lucide React

There is also an Express + Prisma API under `backend/` and a Postgres service in `docker-compose.yml`.

## Run

Frontend:

```bash
npm install
npm run dev
```

Vite serves the app locally (default: `http://localhost:5173`).

Other frontend scripts:

- `npm run build` — type-check and production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

Backend (optional, from `backend/`):

```bash
cd backend
npm install
npm run dev
```

Postgres (optional):

```bash
docker compose up -d
```
