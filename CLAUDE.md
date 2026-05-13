# Skills Manager — Project Conventions

## Architecture

pnpm monorepo. Node >= 20, pnpm 9.x.
- `apps/api` — NestJS backend (port 3001)
- `apps/web` — Vite + React 18 frontend (port 5173), proxies `/api/*` to backend

```
apps/api/src/
  core/          # config, logger, errors (inlined utilities)
  common/        # filters, interceptors, logger middleware
  modules/
    ai/          # AiProvider interface + Claude/Gemini implementations
    analysis/    # AI-powered skill analysis
    cli/         # CLI tool parsing
    skills/      # skill CRUD, file I/O, parser
    usage/       # usage tracking

apps/web/src/
  api/           # typed API client + per-resource modules (client.ts, skills.api.ts, usage.api.ts, types.ts)
  components/    # analysis/, cli/, layout/, skills/, ui/
  hooks/
  lib/           # utils
  pages/
```

## Dev Commands

```bash
pnpm dev          # api + web in parallel
pnpm dev:api      # api only
pnpm dev:web      # web only
pnpm test         # vitest across all apps
pnpm typecheck    # tsc --noEmit across all apps
pnpm lint         # eslint apps/api/src apps/web/src
```

## Key Rules

- **ESM only**: `"type": "module"` in all package.json; relative imports MUST use `.js` extension
- **TypeScript**: Strict mode, `NodeNext` module resolution, `verbatimModuleSyntax: true`
- **No `any`**: Use `unknown` with Zod validation
- **Config**: Use `loadConfig(zodSchema)` from `./core/config.js`; never raw `process.env`
- **Logging**: Use `Logger` from `./core/logger.js`; wrap handlers in `runWithContext()`
- **Errors**: Throw `AppError` subclasses from `./core/errors.js`; use `isOperationalError()` in filter
- **Testing**: Vitest (not Jest); colocated `.spec.ts` files

## File Extension Rule

All relative imports in TypeScript source must use `.js` extension (resolved by NodeNext):
```typescript
import { foo } from "./bar.js";  // ✅
import { foo } from "./bar";     // ❌
```

## Core Utilities (API)

Inlined at `apps/api/src/core/`:
- `core/config.ts` — `loadConfig(schema)` using dotenv + zod
- `core/logger.ts` — `Logger`, `asyncLocalStorage`, `LogContext`, `runWithContext`
- `core/errors.ts` — `AppError`, `NotFoundError`, `ValidationError`, `isOperationalError`

## AI Provider

`AI_PROVIDER=claude|gemini` selects the provider. Both implement `AiProvider` interface (`modules/ai/providers/`). Model overrides via `AI_MODEL_CLAUDE` / `AI_MODEL_GEMINI`.

Copy `apps/api/.env.example` → `apps/api/.env` and set `ANTHROPIC_API_KEY` or `GEMINI_API_KEY`.

## Skills Filesystem

Skills read from `SKILLS_PATH` env var (default `~/.agents/skills/`).
Each skill is a directory:
- `SKILL.md` — YAML frontmatter + markdown content
- `rules/*.md` — individual rule files (optional)
- `references/*.md` — reference materials (optional)
- `AGENTS.md` — compiled guide (optional)
