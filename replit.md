# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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

## Artifacts

### InterviewPrep (`artifacts/interview-prep`)

A fully offline, browser-based knowledge base for software developers preparing for technical interviews.

- **Type**: react-vite (frontend-only, no backend)
- **Preview path**: `/` (root)
- **Storage**: IndexedDB via Dexie.js

#### Features
- User profile with avatar, persisted locally
- Groups → Categories → Questions hierarchy with full CRUD + cascade deletion
- Full-text search across title, short answer, and tags
- Multi-select filtering by difficulty, tags, group, category
- Pagination (20 questions/page)
- Multiple code examples per question with syntax highlighting
- Markdown-rendered explanations
- JSON import/export (merge or replace)
- Theme customization: light/dark/system, font family, font size
- All data persisted offline in IndexedDB

#### Key Files
- `src/lib/db.ts` — Dexie IndexedDB schema & types
- `src/lib/importExport.ts` — export/import logic
- `src/store/useStore.ts` — data hooks (useGroups, useCategories, useQuestions, useSettings)
- `src/context/ThemeContext.tsx` — theme + font preferences
- `src/context/UserContext.tsx` — user profile state
- `src/components/AppShell.tsx` — sidebar + layout
- `src/pages/` — all pages (dashboard, questions, groups, tags, import-export, settings)
