# Skills Manager — Project Conventions

## Architecture

pnpm monorepo with two apps:
- `apps/api` — NestJS backend (port 3001), imports `@internal/core` via `file:` reference from showdown-infra
- `apps/web` — Vite + React frontend (port 5173), proxies `/api/*` to backend

## Key Rules (mirrors showdown-infra)

- **ESM only**: `"type": "module"` in all package.json; relative imports MUST use `.js` extension
- **TypeScript**: Strict mode, `NodeNext` module resolution, `verbatimModuleSyntax: true`
- **No `any`**: Use `unknown` with Zod validation
- **Config**: Always use `loadConfig(zodSchema)` from `@internal/core/config`; never raw `process.env`
- **Logging**: Use `Logger` class from `@internal/core/logger`; wrap handlers in `runWithContext()`
- **Errors**: Throw `AppError` subclasses; use `isOperationalError()` to distinguish in filter
- **Testing**: Vitest (not Jest); colocated `.spec.ts` files

## File Extension Rule

All relative imports in TypeScript source must use `.js` extension (resolved by NodeNext):
```typescript
import { foo } from "./bar.js";  // ✅
import { foo } from "./bar";     // ❌
```

## @internal/core Location

The package lives at: `../../../showdown-infra/packages/internal-core`
It must be built before `pnpm install` here: run `pnpm -r build` in showdown-infra first.

## Skills Filesystem

Skills are read from `SKILLS_PATH` env var (defaults to `~/.agents/skills/`).
Each skill is a directory with:
- `SKILL.md` — YAML frontmatter + markdown content
- `rules/*.md` — individual rule files (optional)
- `references/*.md` — reference materials (optional)
- `AGENTS.md` — compiled guide (optional)
