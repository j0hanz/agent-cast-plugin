# Agent Instructions

## Project

- Closed-loop frontend workflow for Claude Code: build, preview, screenshot-critique, refine, and test UIs via the Playwright MCP server
- TypeScript + React 19 (Vite) + Claude Code plugin (skills/hooks)

## Hard Rules

- Conventional Commits format (`type(scope): subject`) required (see `pr-workflow` skill)
- Breaking changes are fine. Never add fallback/legacy-compat shims; rewrite to the better approach directly
- No automatic testing requirement; rely on existing CI
- No automated CI; local-only test execution and deployment

## Package Manager

- npm

### Common Commands

- `npm run build` (web/)
- `npm run dev` (web/)
- `npm run format` (root)
- `npm run lint` (root)
- `npm run typecheck` (web/)
- `npm run check` (web/)

## Key Conventions

- CSS Modules for component scoping — each view/component pairs with a `*.module.css` file
- web/src/data/data.ts switches between `mock.ts` (design-time) and `live.ts` (runtime) via `VITE_DATA_SOURCE` env var
- Prettier enforced with singleQuote, trailingComma all, printWidth 100, LF line endings
- ESLint flat config: @eslint/js + typescript-eslint (recommendedTypeChecked + stylisticTypeChecked)
- react-hooks + react-refresh for web/src
- eslint-config-prettier disables formatting rules
- Hash-based client-side routing via `useRoute()` reading `window.location.hash`, no router dependency
- Hand-rolled external store via `useSyncExternalStore` for UI state (filters, queries)
- no state-management library dependency
- web/src/ organized by components/ (UI, error boundary, icons)
- layout/ (Shell)
- views/ (Prototypes, Detail, Sandbox, Tests, System)
- data/ (types, mock, live)
- state/ (useSyncExternalStore store)

<!-- project-init:hard-rules v1 commit=strict maturity=development testing=not-enforced ci=local-only sections=dependencies -->
