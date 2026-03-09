# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Investment Tracker is a Next.js 16 web application for tracking ETF portfolios and financial goals. Features include portfolio management, transaction history, multi-currency cash tracking, goal planning with projections, data import/export (JSON & CSV), and live price fetching from Yahoo Finance.

## Architecture & Structure

### Directory Layout
- `app/` - Next.js App Router
  - `page.tsx` - Main component with all state and business logic
  - `layout.tsx` - Root layout with ThemeProvider
  - `context/ThemeContext.tsx` - Light/dark theme state (localStorage persisted)
  - `api/` - Route handlers for external data
  - `components/` - React components organized by type
  - `lib/` - Utilities, types, constants

### Component Organization
**Atomic Design Structure:**
- `components/ui/` - Reusable atomic components (Button, Card, Input, etc.)
- `components/layout/` - Page structure (Header, Footer, Navigation)
- `components/features/` - Feature-specific components (DashboardTab, CashTab, etc.)

Each component is in its own folder with `index.ts` for named exports.

### State Management
All state lives in `app/page.tsx` as hooks (useState, useCallback, useMemo). Major state categories:
- Core: Holdings, transactions, cash balances, goals, active tab
- Derived: Portfolio value, gains, allocations, projections (computed via useMemo)
- External: Live prices, exchange rates (fetched via /api/prices and /api/exchange-rates)
- UI: Modal visibility, form inputs, export/import dialogs

### Data Types
Located in `app/lib/types.ts`. Key interfaces:
- `Holding` - Base ticker/shares/cost; `HoldingWithDetails` adds calculated values
- `Transaction` - Buy/sell records with id, date, ticker, action, shares, price
- `CashBalance` & `CashTransaction` - Multi-currency (PLN/EUR/USD) cash tracking
- `Goal` - Target amount and target year for projections
- `AllocationItem` & `ProjectionDataPoint` - Chart data

### API Routes
- `app/api/prices/route.ts` - GET /api/prices?tickers=SYMBOL1,SYMBOL2 - Fetches live quotes from Yahoo Finance 2
- `app/api/exchange-rates/route.ts` - GET /api/exchange-rates - Fetches EUR/USD to PLN rates

### Styling
- Framework: Tailwind CSS 4 with PostCSS
- Colors: CSS variables in `app/globals.css` (dark/light theme aware, set via data-theme attribute on html)
- Fonts: JetBrains Mono (monospace), Google Fonts via next/font
- Module CSS: Component-specific styles in *.module.css files
- Design: Dark theme default with light mode toggle via ThemeContext

## Development Commands
```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # Run ESLint (configured for Next.js + TypeScript)
```

## Key Patterns & Implementation Details

### Data Flow
1. User actions → setState hooks in page.tsx
2. useMemo/useCallback hooks compute derived state & memoize callbacks
3. Props passed down to child components (unidirectional)
4. Child components dispatch callbacks to parent (lift state up)

### Transaction & Cash Handling
Transaction CRUD operations recalculate affected holdings' average costs. Cash transactions reverse/apply delta updates to balances. Handles both ticker changes and amount changes correctly.

### Price & Exchange Rate Updates
Fetched on mount + every 60 seconds via useEffect interval. Fallback to base prices from constants if API fails. All portfolio calculations (PLN values) use current exchangeRates object.

### Export/Import
- JSON: Full state serialization with version/date metadata
- CSV: Holdings, transactions, cash, or cash transactions separately
- Import: Strict validation of required fields & data types

### Theme Management
ThemeContext reads localStorage('theme') on mount, respects system preference fallback. Updates html[data-theme] attribute when toggled. CSS variables switch light/dark values based on attribute.

## Code Standards
- TypeScript: Strict mode enabled
- Naming: camelCase for vars/functions, PascalCase for components/types
- Files: Functional components with hooks (no class components)
- Comments: Minimal—code should be self-documenting. Use section comments (===) for major blocks
- Imports: Use @/ path alias (configured in tsconfig.json)
- Styling: Inline styles for simple cases, CSS modules for component-specific styles

## Common Tasks

### Adding a New Feature Tab
1. Create feature component folder in `components/features/`
2. Accept data & callbacks as props in interface
3. Add tab name to `TabName` type in layout/Navigation
4. Add state & logic in page.tsx
5. Render conditionally in main based on activeTab
6. Add navigation link in Navigation component

### Adding a UI Component
1. Create folder in `components/ui/ComponentName/`
2. Write ComponentName.tsx with props interface
3. Add styling in ComponentName.module.css
4. Export from index.ts in folder
5. Update `components/ui/index.ts` for barrel export

### Fetching External Data
1. Create route handler in `app/api/endpoint/route.ts`
2. Use NextResponse for responses
3. Handle errors gracefully with fallbacks
4. Call from page.tsx via fetch() in useEffect/useCallback
5. Update appropriate state with results

### Theme-Aware Styling
Use CSS variables (--bg-primary, --text-secondary, --accent-green, etc.) defined in globals.css. Dark/light values automatically switch via data-theme attribute. Reference variables in module CSS or inline styles.

## Testing & Debugging
- No test framework configured; focus on manual testing
- ESLint enabled; run `pnpm lint` before commit
- Browser DevTools for state inspection, network tab for API calls
- Console logs acceptable for debugging but remove before commit

## Dependencies
- **Runtime:** Next.js 16, React 19, recharts (charts), yahoo-finance2 (price quotes)
- **Dev:** TypeScript 5, Tailwind CSS 4, ESLint 9

## Notes
- Assumes user has pnpm installed
- API credentials (Yahoo Finance) are free tier; use rate limiting in production
- Export format has version field for future backward compatibility
- Holdings use decimal shares (important for fractional ETF shares in EU)
