# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

**The project directory path contains `&`, which breaks `npm run` on Windows.** Use these instead:

```powershell
# Dev server
Set-Location "c:\Users\michal\Desktop\תוצרי AI\AI Operations & Insights\safety-ops"
node "node_modules\next\dist\bin\next" dev

# Production build
node "node_modules\next\dist\bin\next" build

# Lint
node "node_modules\.bin\eslint" .
```

Or use `start.ps1` in the project root.

The dev server may start on port **3001** if 3000 is in use.

## Architecture

Next.js 16 App Router (no `src/` dir). All UI is **client components** (`"use client"`). No database yet — persistence is `localStorage` (history list) and `sessionStorage` (current meeting data passed between pages).

**Data flow:**
1. `/` — user pastes text or uploads PDF/Word → `POST /api/analyze`
2. `/api/analyze/route.ts` — extracts text (pdf-parse / mammoth), calls Claude API, returns `Meeting` JSON
3. Result stored in `sessionStorage` + `localStorage`, user redirected to `/analysis/[id]`
4. `/analysis/[id]` — reads from `sessionStorage` (falls back to `localStorage`)
5. `/history` — reads full list from `localStorage`

**Core types** are in `lib/types.ts`: `Meeting`, `AnalysisResult`, `Task`, `HistoricalInsight`, `TaskStatus`.

## Claude API integration

`app/api/analyze/route.ts` sends two logical calls (currently one):
- **Call 1**: protocol text → structured JSON (`executive_summary`, `key_decisions`, `tasks`, `red_flags`, `tasks_without_owner`, `historical_insights`)
- **Call 2** (planned): prior meetings context → contextual `historical_insights` (only surfaced when statistically meaningful)

The prompt instructs Claude to return JSON only. Strip code fences before parsing:
```ts
jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "")
```

Use `require("pdf-parse")` (not ESM import) to avoid a TypeScript `.default` error.

## UI conventions

- RTL Hebrew (`lang="he" dir="rtl"`) set on `<html>` in `app/layout.tsx`
- Font: **Heebo** (Google Fonts, Hebrew + Latin subsets)
- Tailwind v4 + shadcn/ui. Color palette: blue for primary actions, red/amber for alerts, purple for historical insights
- `TaskStatus` values are Hebrew strings: `"פתוח" | "בתהליך" | "הושלם" | "באיחור"`
- Historical insights section only renders when `historical_insights.length > 0`
- Print CSS in `/analysis/[id]` hides header/buttons for PDF via `window.print()`

## Environment

Requires `ANTHROPIC_API_KEY` in `.env.local`.
