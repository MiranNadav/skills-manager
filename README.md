# Skills Manager

A local web UI for browsing, editing, and AI-analyzing your [Claude Code](https://claude.ai/claude-code) agent skills. Understand which skills you have installed, how often they're used, what prompts trigger them, and where your library has gaps or overlaps.

---

## Screenshots

> _Add screenshots after running the app locally._

| Dashboard | Skill Detail |
|-----------|-------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Skill Detail](docs/screenshots/skill.png) |

| Analysis | Install |
|----------|---------|
| ![Analysis](docs/screenshots/analysis.png) | ![Install](docs/screenshots/install.png) |

---

## Features

### Skill Library
- Browse all installed skills in a dashboard with live search and filter
- See rule count, reference file count, and usage frequency per skill at a glance
- "Most used" and total skill count stats in the header

### Skill Detail
- Collapsible sections for **SKILL.md**, **RULES**, **USAGE**, and **REFERENCES**
- Full markdown rendering with proper heading hierarchy, code blocks, tables, and lists
- Edit SKILL.md and individual rule files inline — changes write directly to disk
- Per-rule metadata: title, impact level (CRITICAL / HIGH / MEDIUM / LOW)
- **AI Summary** — one-click summary generated via Claude or Gemini

### Usage Tracking
- Automatically parses `~/.claude/projects/**/*.jsonl` (Claude Code conversation logs)
- Shows how many times each skill was invoked, when it was last used, and which project triggered it
- Captures the human prompt that caused Claude to invoke the skill
- Incremental cache (`~/.agents/skills-manager-usage.json`) — only re-parses changed files on subsequent requests

### AI Analysis
- **Duplicate Detection** — finds skills with overlapping purposes, scored high / medium / low
- **Thematic Connections** — groups skills into clusters by domain

### Find & Install
- Search the public skill registry via `npx skills find`
- Results show the full `npx skills add owner/repo@skill` command per entry
- One-click **use** button to pre-fill the install input
- Check for updates and update all skills in one action

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | NestJS 10, TypeScript (ESM), SWC |
| Frontend | React 18, Vite, TanStack Query v5 |
| AI | Claude (`claude-sonnet-4-6`) or Gemini (`gemini-2.0-flash`) |
| Skills CLI | `npx skills` |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **Claude Code** with skills installed at `~/.agents/skills/` (or a custom path)
- An **Anthropic API key** (or Gemini API key if you prefer Gemini)

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/MiranNadav/skills-manager.git
cd skills-manager

# 2. Install dependencies
pnpm install

# 3. Configure the API
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
PORT=3001
CORS_ORIGINS=http://localhost:5173

# Path to your skills directory (defaults to ~/.agents/skills)
SKILLS_PATH=

# AI provider: "claude" or "gemini"
AI_PROVIDER=claude

# Required for Claude
ANTHROPIC_API_KEY=sk-ant-...

# Required for Gemini (alternative)
# GEMINI_API_KEY=AIza...
```

```bash
# 4. Start both services in parallel
pnpm dev
```

- API: http://localhost:3001
- Web UI: http://localhost:5173
- Swagger docs: http://localhost:3001/api/docs

---

## Development

```bash
# API only
pnpm dev:api

# Frontend only
pnpm dev:web

# Type-check all packages
pnpm typecheck

# Run tests
pnpm test

# Build for production
pnpm build
```

### Project Structure

```
skills-manager/
├── apps/
│   ├── api/                  # NestJS backend (port 3001)
│   │   └── src/
│   │       └── modules/
│   │           ├── skills/   # Skill file parsing & CRUD
│   │           ├── analysis/ # AI analysis (summary, duplicates, connections)
│   │           ├── usage/    # JSONL parsing & usage stats
│   │           ├── ai/       # AI provider abstraction (Claude / Gemini)
│   │           └── cli/      # npx skills CLI wrapper
│   └── web/                  # Vite + React frontend (port 5173)
│       └── src/
│           ├── pages/        # DashboardPage, SkillPage, AnalysisPage, InstallPage
│           ├── api/          # Typed API clients
│           └── hooks/        # TanStack Query hooks
└── tsconfig.base.json
```

---

## Skills Directory

Skills Manager reads skills from `~/.agents/skills/` by default. Each skill is a directory:

```
~/.agents/skills/
└── commit-work/
    ├── SKILL.md          # Main skill prompt
    ├── rules/            # Additional rule files (.md)
    ├── references/       # Reference documents
    └── AGENTS.md         # Optional agent config
```

To install skills from the public registry:

```bash
npx skills add owner/repo@skill-name
```

Or use the **Install** tab in the UI.

---

## License

MIT
