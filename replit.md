# Workspace

## Overview

Sales Pipeline Tracker — a full-stack B2B pipeline management app built on a pnpm workspace monorepo using TypeScript.

## Features

- **Dashboard**: Pipeline summary stats (active value, won revenue, win rate, avg deal size), deals closing in 30 days
- **Deals**: Full deal list with search, stage/owner filtering, create/edit/delete operations
- **Deal Detail**: Inline editing, days-to-close countdown, deal notes
- **Pipeline**: Stage breakdown with progress bars, owner performance leaderboard, funnel summary
- **Owners**: Manage deal owners (create, edit, delete)

## Artifacts

- `artifacts/pipeline` — React + Vite frontend (root `/`)
- `artifacts/api-server` — Express 5 API server (`/api`)

## Database Schema

- `owners` — deal team members (id, name, email, avatarUrl, createdAt)
- `deals` — deals (id, title, companyName, stage, value, expectedCloseDate, ownerId, notes, createdAt, updatedAt)

## API Endpoints

- `GET/POST /api/owners`, `GET/PATCH/DELETE /api/owners/:id`
- `GET/POST /api/deals`, `GET/PATCH/DELETE /api/deals/:id` (filter by stage, ownerId)
- `GET /api/pipeline/summary` — aggregate stats
- `GET /api/pipeline/by-stage` — deals grouped by stage
- `GET /api/pipeline/by-owner` — deals grouped by owner
- `GET /api/pipeline/closing-soon` — deals closing within 30 days

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
