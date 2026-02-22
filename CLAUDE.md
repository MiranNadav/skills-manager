# Skills Manager — Project Conventions

## Architecture

pnpm monorepo with two apps:
- `apps/api` — NestJS backend (port 3001), fully self-contained
- `apps/web` — Vite + React frontend (port 5173), proxies `/api/*` to backend

## Key Rules

- **ESM only**: `"type": "module"` in all package.json; relative imports MUST use `.js` extension
- **TypeScript**: Strict mode, `NodeNext` module resolution, `verbatimModuleSyntax: true`
- **No `any`**: Use `unknown` with Zod validation
- **Config**: Use `loadConfig(zodSchema)` from `./core/config.js`; never raw `process.env`
- **Logging**: Use `Logger` class from `./core/logger.js`; wrap handlers in `runWithContext()`
- **Errors**: Throw `AppError` subclasses from `./core/errors.js`; use `isOperationalError()` in filter
- **Testing**: Vitest (not Jest); colocated `.spec.ts` files

## File Extension Rule

All relative imports in TypeScript source must use `.js` extension (resolved by NodeNext):
```typescript
import { foo } from "./bar.js";  // ✅
import { foo } from "./bar";     // ❌
```

## Core Utilities

Config, logger, and error classes are inlined at `apps/api/src/core/`:
- `core/config.ts` — `loadConfig(schema)` using dotenv + zod
- `core/logger.ts` — `Logger`, `asyncLocalStorage`, `LogContext`, `runWithContext`
- `core/errors.ts` — `AppError`, `NotFoundError`, `ValidationError`, `isOperationalError`

## Skills Filesystem

Skills are read from `SKILLS_PATH` env var (defaults to `~/.agents/skills/`).
Each skill is a directory with:
- `SKILL.md` — YAML frontmatter + markdown content
- `rules/*.md` — individual rule files (optional)
- `references/*.md` — reference materials (optional)
- `AGENTS.md` — compiled guide (optional)
