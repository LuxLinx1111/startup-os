# Startup OS

Your company's single source of truth: dashboard, tasks, time tracking, and docs wiki today; budget, milestones, calendar, org chart, marketing, and more wired up for Phase 2. See `SPEC.md` in the parent folder for the full product spec, schema, and roadmap.

## Requirements

- Node.js 20+
- A PostgreSQL database — easiest options, pick one:
  - **Supabase (recommended, and where you'll end up anyway):** create a free project at supabase.com, grab the connection strings from Project Settings → Database.
  - **Local Postgres via Homebrew:** `brew install postgresql@16 && brew services start postgresql@16`, then `createdb startup_os`.
  - **Local Postgres via Docker:** `docker run --name startup-os-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`

## Setup

```bash
cd startup-os
npm install
cp .env.example .env
# edit .env: set DATABASE_URL (and DIRECT_URL if using Supabase), NEXTAUTH_SECRET, seed user emails/passwords

npx prisma migrate dev --name init
npm run db:seed

npm run dev
```

Open http://localhost:3000 and log in with the email/password you set for `SEED_OWNER_EMAIL` in `.env`.

## Moving to Supabase later (if you started local)

1. Create a Supabase project.
2. Replace `DATABASE_URL`/`DIRECT_URL` in `.env` with the Supabase connection strings.
3. `npx prisma migrate deploy`
4. `npm run db:seed` (only if the new database is empty)

No application code changes are needed — the app was built against Postgres/Prisma from day one specifically so this swap is just config.

## Project structure

```
prisma/schema.prisma     Full data model (Phase 1 + Phase 2 tables)
prisma/seed.ts           Seeds the two founder accounts + sample data
src/app/                 Next.js App Router pages (auth + main app)
src/components/ui/       shadcn/ui-style primitives (Button, Card, Dialog, ...)
src/components/*         Feature components per module
src/lib/                 Prisma client, auth config, utils, validation schemas
```

## What's built

Every module in the spec is now live, not a placeholder:

- **Core workspace:** Auth, app shell (sidebar/topbar/theme/⌘K search), Dashboard, Tasks (Kanban/List/Calendar/Gantt with full detail: owner, priority, status, due date, hours, tags, checklist, comments, related tasks, recurrence), Time Tracking (timer, manual entries, reports, CSV export), Docs Wiki (markdown, categories, search, version history).
- **Build:** Milestones (auto-rolled-up completion from linked tasks), Feature Roadmap, Bug Tracker, Launch Checklist (with a one-click standard checklist seeder), Decision Log, Risk Register.
- **Grow:** Marketing Planner, Customer Feedback, Asset Library, Reports & Analytics (velocity, burn-down, productivity and budget trends, launch readiness score).
- **Company:** Budget & Expenses (charts + burn rate/runway), Org & Team, Meeting Hub, Password & API Vault (AES-256 encrypted at the application layer), shared Calendar (aggregates task due dates, milestones, meetings, and marketing dates), Notes & Brainstorming, File Manager.

A couple of modules use a deliberate simplification worth knowing about: **Files** and **Asset Library** store items as external links (Drive, Dropbox, Figma, etc.) plus metadata rather than actual uploaded binaries, since no object storage is connected yet. Wiring in Supabase Storage (or S3) later is additive — swap the "add link" dialogs for real upload inputs; the `FileAsset` schema doesn't need to change.

## Vault setup

The Password & API Vault encrypts every value with AES-256-GCM before it touches the database. Make sure `VAULT_ENCRYPTION_KEY` is set in `.env` (see `.env.example`) before adding vault items — losing that key means losing access to anything encrypted with it, so back it up somewhere safe (a real password manager, ironically).

## A note on this build

This codebase was hand-written in a sandboxed environment without npm registry access, so it hasn't been run or type-checked against installed dependencies. The patterns (Next.js App Router, Prisma, NextAuth, Radix/shadcn primitives) are standard and the code follows their documented APIs closely, but budget a short debugging pass after your first `npm install && npm run dev` — treat this as a thorough, complete first draft, not a pre-verified build.
