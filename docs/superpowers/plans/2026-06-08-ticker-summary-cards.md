# Ticker Summary Cards Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `TickerSummaryCards` component to the Dashboard that displays per-ticker holdings info (ticker, name, shares, avg price, P/L) in a responsive card grid.

**Architecture:** Reuse existing `HoldingWithDetails` data from `usePortfolioMetrics`, pass through `DashboardTab`, render cards using existing `Card` component + Tailwind utilities. No new data fetching.

**Tech Stack:** React, TypeScript, Tailwind CSS, motion/react (framer-motion), existing UI components (`Card`, `SectionTitle`)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/components/features/Dashboard/TickerSummaryCards.tsx` | Create | New component: card grid with animations, empty/loading states |
| `app/components/features/Dashboard/DashboardTab.tsx` | Modify | Add `holdingsData` + `allTickers` props, render `TickerSummaryCards` |
| `app/page.tsx` | Modify | Pass `holdingsData` and `allTickers` to `DashboardTab` |

---

## Chunk 1: Create TickerSummaryCards Component

### Task 1: Create `TickerSummaryCards.tsx`

**Files:**
- Create: `app/components/features/Dashboard/TickerSummaryCards.tsx`

**Prerequisites:** Read these files first to understand patterns:
- `app/components/ui/Card/Card.tsx` — see `CardProps` interface and variant usage
- `app/lib/animations.ts` — confirm `fadeVariants` and `staggerContainerVariants` exports
- `app/lib/hooks/useReducedMotion.ts` — confirm hook signature
- `app/lib/formatters.ts` — confirm `formatCurrency` and `formatPercent` signatures
- `app/lib/types.ts` — confirm `HoldingWithDetails` and `TickerInfo` types

**Implementation details:**
- Props: `holdingsData: HoldingWithDetails[]`, `allTickers: Record<string, TickerInfo>`, `isLoading?: boolean`
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- Card content layout (per card):
  - Top row: Ticker (bold, uppercase) + P/L percent (right-aligned, color-coded)
  - Middle: Full name (muted, truncate with `truncate` class)
  - Bottom stats: Shares | Avg Price | P/L (absolute)
- Currency lookup: `allTickers[h.ticker]?.currency || 'USD'`
- Formatting: `formatCurrency(value, currency)` and `formatPercent(gainPercent)`
- Animation: Use `motion.div` with `variants={fadeVariants}` inside a `motion.div` with `variants={staggerContainerVariants}`. If `useReducedMotion()` is true, render plain `div`s.
- Empty state: Single card with "No holdings yet. Add transactions in the Investments tab."
- Loading state: 3 skeleton cards (pulsing gray divs with `animate-pulse`)
- Edge cases: NaN/undefined values show "—", missing ticker falls back to USD

**Code skeleton:**
```tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { fadeVariants, staggerContainerVariants } from '@/lib/animations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { HoldingWithDetails, TickerInfo } from '@/lib/types';

interface TickerSummaryCardsProps {
  holdingsData: HoldingWithDetails[];
  allTickers: Record<string, TickerInfo>;
  isLoading?: boolean;
}

export function TickerSummaryCards({ holdingsData, allTickers, isLoading }: TickerSummaryCardsProps) {
  const prefersReducedMotion = useReducedMotion();
  // ... implementation
}
```

- [ ] **Step 1: Read prerequisite files** (Card, animations, hooks, formatters, types)
- [ ] **Step 2: Write TickerSummaryCards.tsx** with full implementation
- [ ] **Step 3: Run `pnpm lint`** to verify no lint errors
- [ ] **Step 4: Commit** `git add app/components/features/Dashboard/TickerSummaryCards.tsx && git commit -m "feat: add TickerSummaryCards component"`

---

## Chunk 2: Modify DashboardTab to Accept and Render New Props

### Task 2: Update `DashboardTab.tsx`

**Files:**
- Modify: `app/components/features/Dashboard/DashboardTab.tsx`

**Changes:**
1. Add to `DashboardTabProps` interface:
   ```typescript
   holdingsData: HoldingWithDetails[];
   allTickers: Record<string, TickerInfo>;
   ```
2. Destructure the new props in the component signature
3. Import `TickerSummaryCards` and `SectionTitle` (if not already imported)
4. Add between StatCards row and AllocationChart:
   ```tsx
   <SectionTitle title="Holdings Overview" />
   <TickerSummaryCards
     holdingsData={holdingsData}
     allTickers={allTickers}
     isLoading={pricesLoading}
   />
   ```

- [ ] **Step 1: Read DashboardTab.tsx** to understand current props and layout
- [ ] **Step 2: Add new props to interface and destructuring**
- [ ] **Step 3: Add import for TickerSummaryCards**
- [ ] **Step 4: Insert TickerSummaryCards + SectionTitle in layout**
- [ ] **Step 5: Run `pnpm lint`**
- [ ] **Step 6: Commit** `git commit -am "feat: integrate TickerSummaryCards into DashboardTab"`

---

## Chunk 3: Wire Data Flow from page.tsx

### Task 3: Update `page.tsx`

**Files:**
- Modify: `app/page.tsx`

**Changes:**
1. Locate where `DashboardTab` is rendered (search for `<DashboardTab`)
2. Add two new props:
   ```tsx
   holdingsData={holdingsData}
   allTickers={allTickers}
   ```
   
   `holdingsData` comes from `usePortfolioMetrics()` (already destructured).
   `allTickers` is already computed in `page.tsx` (merged `ETF_DATA` + `customTickers`).

- [ ] **Step 1: Read page.tsx** around the DashboardTab render to confirm prop names
- [ ] **Step 2: Add `holdingsData` and `allTickers` props to DashboardTab JSX**
- [ ] **Step 3: Run `pnpm lint`**
- [ ] **Step 4: Commit** `git commit -am "feat: pass holdings data to DashboardTab"`

---

## Chunk 4: Verification

### Task 4: Build and Manual Test

- [ ] **Step 1: Run `pnpm build`** — verify no TypeScript or build errors
- [ ] **Step 2: Run `pnpm dev`** — start dev server
- [ ] **Step 3: Open browser at `http://localhost:3000`**
- [ ] **Step 4: Verify:**
  - Dashboard shows "Holdings Overview" section
  - Cards display correct ticker, name, shares, avg price, P/L
  - P/L is color-coded (green for positive, red for negative)
  - Grid is responsive (1 col mobile → 4 col desktop)
  - Empty state shows when no holdings
  - Loading skeleton shows during price fetch
- [ ] **Step 5: Commit** `git commit -am "chore: verify TickerSummaryCards integration"`

---

## Notes for Implementer

- **Do NOT create a CSS module** — use Tailwind utility classes exclusively
- **Do NOT add new dependencies** — reuse existing `motion/react`, `Card`, formatters
- **Follow existing import grouping** — React, external libs, local components, types
- **Type safety:** Ensure `allTickers[ticker]` fallback handles missing keys gracefully
- **Performance:** Component is pure display; no `useEffect` or data fetching needed
