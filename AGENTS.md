# AGENTS.md

This file provides guidance to agentic coding tools when working with code in this repository.

## Project Overview
Investment Tracker is a Next.js 16 web application for tracking ETF portfolios and financial goals. Features include portfolio management, transaction history, multi-currency cash tracking, goal planning with projections, data import/export (JSON & CSV), and live price fetching from Yahoo Finance.

## Build/Lint/Test Commands

### Development
```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Run production server
```

### Linting
```bash
pnpm lint         # Run ESLint (configured for Next.js + TypeScript)
```

### Testing
- No test framework is currently configured
- Focus on manual testing using browser DevTools
- Console logs acceptable for debugging but remove before commit

## Code Style Guidelines

### Imports
- Use `@/` path alias (configured in tsconfig.json)
- Group imports by type: React, external libraries, local components, types
- Avoid wildcard imports (`import * as`) - prefer named imports
- Keep import lists alphabetized within each group

### Formatting
- Use 2-space indentation for all files (JS/TS/TSX/JSON/CSS)
- Use semicolons in JavaScript/TypeScript
- Maximum line length: 100 characters (soft limit)
- Use single quotes for strings, backticks for template literals
- Add spaces around operators and after commas
- No trailing whitespace

### TypeScript
- Strict mode is enabled in tsconfig.json
- Always specify return types for functions
- Use interfaces for object shapes, types for unions/primitives
- Prefer `type` over `interface` when you need union types or mapped types
- Use `unknown` instead of `any` for unsafe types
- Mark functions as `async` when they return promises

### Naming Conventions
- **Variables & Functions**: camelCase (e.g., `calculateTotalValue`)
- **Components**: PascalCase (e.g., `PortfolioDashboard`)
- **Types/Interfaces**: PascalCase (e.g., `Holding`, `Transaction`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TRANSACTIONS`)
- **Boolean variables**: Prefix with `is`, `has`, `can`, etc. (e.g., `isLoading`)
- **Event handlers**: Prefix with `handle` (e.g., `handleSubmit`)

### Component Structure
- Functional components only (no class components)
- Each component in its own folder with `index.ts` for exports
- Component file: `ComponentName.tsx`
- Styles file: `ComponentName.module.css`
- Props interface: Define within the component file or in separate `types.ts`

### Error Handling
- Validate all user inputs and API responses
- Use try/catch for async operations
- Provide meaningful error messages to users
- Log errors to console in development, consider error reporting in production
- Implement fallback values for failed API calls

### State Management
- Use React hooks (useState, useReducer, useContext)
- Lift state up to common ancestors when needed
- Use useMemo for derived state calculations
- Use useCallback for memoizing functions passed to child components
- Avoid unnecessary re-renders with proper dependency arrays

### API Calls
- Create route handlers in `app/api/endpoint/route.ts`
- Use NextResponse for consistent response formatting
- Handle errors gracefully with fallback values
- Implement rate limiting for external APIs
- Cache responses when appropriate

### Styling
- Use Tailwind CSS classes for utility styling
- Use CSS modules for component-specific styles
- Use CSS variables for theme-aware colors
- Follow dark theme default with light mode support
- Keep styles scoped to components

### Comments
- Minimal comments - code should be self-documenting
- Use section comments (===) for major code blocks
- Document complex algorithms or business logic
- Add TODO comments for future improvements
- Remove commented-out code before committing

### File Organization
- Keep files small and focused (under 300 lines when possible)
- Group related files in folders
- Use barrel exports (`index.ts`) for cleaner imports
- Follow atomic design structure for components

## Common Patterns

### Data Flow
1. User actions → setState hooks in parent components
2. useMemo/useCallback hooks compute derived state & memoize callbacks
3. Props passed down to child components (unidirectional)
4. Child components dispatch callbacks to parent (lift state up)

### Transaction Handling
- CRUD operations should recalculate affected holdings' average costs
- Cash transactions should reverse/apply delta updates to balances
- Handle both ticker changes and amount changes correctly

### Price Updates
- Fetch on mount + periodic intervals via useEffect
- Fallback to base prices from constants if API fails
- All portfolio calculations should use current exchange rates

### Export/Import
- JSON: Full state serialization with version/date metadata
- CSV: Separate exports for holdings, transactions, cash data
- Import: Strict validation of required fields & data types

## Security Requirements
- Never commit API keys or secrets
- Always validate user input
- Use HTTPS for external requests
- Sanitize data before rendering
- Implement proper error handling

## Git Practices
- Commit messages should be concise and descriptive
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable
- Keep commits small and focused
- Run lint before committing

## Development Workflow
1. Create feature branch from main
2. Implement feature with proper tests
3. Run lint and fix any issues
4. Test manually in development environment
5. Create pull request with descriptive summary
6. Address review feedback
7. Merge to main after approval

## Additional Notes
- Assumes user has pnpm installed
- API credentials (Yahoo Finance) are free tier
- Export format has version field for backward compatibility
- Holdings use decimal shares for fractional ETF support
- Respect system preference for theme (dark/light mode)

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:
- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED
Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)
Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |
