# Contributing

## Setup

```bash
git clone https://github.com/MiranNadav/skills-manager.git
cd skills-manager
pnpm install
cp apps/api/.env.example apps/api/.env
# fill in ANTHROPIC_API_KEY or GEMINI_API_KEY
pnpm dev
```

## Development

```bash
pnpm typecheck   # must pass
pnpm test        # must pass
pnpm build       # must pass
```

CI runs all three on every PR.

## Code Conventions

- **ESM only** — relative imports must use `.js` extension (e.g. `./foo.js`)
- **No `any`** — use `unknown` + Zod validation
- **TypeScript strict** — no disabling strict checks
- Tests colocated as `*.spec.ts` using Vitest

## Pull Requests

1. Fork → feature branch → PR against `main`
2. Keep PRs focused — one concern per PR
3. Tests required for new API behaviour
4. `pnpm typecheck && pnpm test` must pass locally before opening PR

## Reporting Issues

Open a GitHub issue with steps to reproduce, expected behaviour, and actual behaviour.
