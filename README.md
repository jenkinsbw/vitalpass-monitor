# VitalPass

Monitor Core Web Vitals for Magento origins after VitalPass is applied. The app queries the [Chrome UX Report API](https://developer.chrome.com/docs/crux/api) and stores LCP, INP, and CLS history in Postgres.

## Prerequisites

- Node.js 22
- Docker, with the `docker-compose` command available

## Local setup

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Postgres is published on host port **5433** (`vitalpass` / `vitalpass` / database `vitalpass`) so it does not collide with a local Postgres on 5432.

`db:up` runs `docker-compose up -d`. If your machine has the Compose plugin instead, `docker compose up -d` is the same service.

## CrUX

Create an API key for the Chrome UX Report API and set `CRUX_API_KEY` in `.env`. Restart `npm run dev` after changing it. Without the key you can still add sites; **Fetch now** stays disabled until the key is present.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint |
| `npm run db:up` | Start Postgres |
| `npm run db:down` | Stop Postgres |
| `npm run db:migrate` | Create and apply a dev migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:status` | Show migration status |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## App

- `/` lists monitored origins and the latest snapshot.
- `/sites/new` adds a site (origin + `PHONE` or `DESKTOP`).
- `/sites/[id]` shows snapshot history and fetches a new CrUX record.
