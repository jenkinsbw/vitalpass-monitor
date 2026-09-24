<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VitalPass

Next.js app that monitors Magento origins with the Chrome UX Report API and stores Core Web Vitals history. Auth via Auth.js (Credentials + JWT). No public registration (seed admin + future in-app user CRUD). No scheduler in this base.

## Layout

- `src/app/` — routes. Server Components by default.
- `src/auth.ts` — Auth.js config (`handlers`, `auth`, `signIn`, `signOut`).
- `src/proxy.ts` — Auth.js route protection (Next.js 16 `proxy` convention).
- `src/components/ui/` — shadcn/ui.
- `src/lib/db.ts` — Prisma client singleton. Do not instantiate another client.
- `src/lib/env.ts` — Zod-validated environment. Import it from server code only.
- `src/lib/crux/` — CrUX fetch and response parsing.
- `src/server/` — typed queries. Mutations are Server Actions in `src/server/actions.ts`.
- `prisma/schema.prisma` — models. Generated client lives in `src/generated/prisma` and is gitignored.

## Conventions

- TypeScript strict. Validate form data, env, and external payloads with Zod.
- Add `"use client"` only for interaction such as forms and pending state.
- Protect mutations with `auth()` / session checks. Do not invent tenants or a cron job.
- Local Postgres comes from Docker Compose on host port 5433. Use `npm run db:up`, then `npm run db:migrate`.
