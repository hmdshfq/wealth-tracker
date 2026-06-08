# Design Spec: Ticker Summary Cards for Dashboard

**Date:** 2026-06-08
**Status:** Draft (pending review)

---

## 1. Overview

Add a **Ticker Summary Cards** section to the Dashboard that displays key holding information in a visually scannable card grid. This provides a quick portfolio snapshot without navigating to the Holdings tab.

---

## 2. Goals

- Surface per-ticker metrics (shares, avg price, P/L) on the Dashboard
- Maintain visual consistency with existing card-based Dashboard design
- Reuse existing data and components where possible
- Support empty and loading states gracefully

---

## 3. Non-Goals

- Replace the Holdings tab (it remains the detailed view)
- Add new data fetching (reuses existing `holdingsData`)
- Support editing transactions from the Dashboard

---

## 4. Component Design

### 4.1 Component: `TickerSummaryCards`

**File:** `app/components/features/Dashboard/TickerSummaryCards.tsx`

**Props Interface:**
```typescript
interface TickerSummaryCardsProps {
  holdingsData: HoldingWithDetails[];
  allTickers: Record<string, TickerInfo>;
  isLoading?: boolean;
}
```

**What it renders:**
A responsive grid of cards. Each card contains:

| Field | Source | Format |
|-------|--------|--------|
| Ticker name | `holding.ticker` | Bold, uppercase, prominent |
| Complete name | `holding.name` | Muted, smaller, truncated with ellipsis if too long |
| Total shares | `holding.shares` | 2 decimal places |
| Average price | `holding.avgCost` | Currency format in ticker's native currency (e.g., `$450.20` for USD ETFs) |
| Total profit/loss (absolute) | `holding.gain` | Currency in ticker's native currency, color-coded (green/red) |
| Total profit/loss (percentage) | `holding.gainPercent` | Percentage format, shown in card header (e.g., `+5.2%`) |

**Layout per card:**
```
┌─────────────────────────────┐
│ SPY                    +5.2% │  ← Ticker + P/L percent (right-aligned)
│ SPDR S&P 500 ETF Trust      │  ← Full name (muted)
│                             │
│ Shares: 15.50              │  ← Stats row
│ Avg Price: $450.20         │
│ P/L: +$1,240.50            │  ← Color-coded
└─────────────────────────────┘
```

**Grid layout:**
- CSS Grid: `repeat(auto-fill, minmax(280px, 1fr))`
- Gap: `var(--spacing-md)` (16px)
- Responsive: stacks to 1 column on mobile

**Card styling:**
- Uses existing `Card` component (variant: `default`)
- Internal padding: `var(--spacing-md)`
- No new CSS module; uses Tailwind utility classes + CSS custom properties

**Animation:**
- Container uses `staggerContainerVariants` from `app/lib/animations.ts`
- Each card uses `fadeVariants` with a slight `y: 10 → 0` slide
- Stagger delay: 0.05s per card
- **Reduced motion:** When `useReducedMotion()` returns `true`, skip `motion.div` wrappers and render static `div`s instead

### 4.2 Empty State

When `holdingsData.length === 0`:
- Render a centered message inside a single `Card`
- Text: "No holdings yet. Add transactions in the Investments tab."
- Style: muted text color

### 4.3 Loading State

When `isLoading === true`:
- Render 3 skeleton cards (pulsing gray rectangles)
- Uses the same grid layout
- No text content, just animated background shimmer
- **Priority:** Loading state takes precedence over empty state. Even if `holdingsData.length === 0`, show skeleton while loading.

---

## 5. Data Flow

```
page.tsx
├── usePortfolioMetrics() → holdingsData: HoldingWithDetails[]
├── allTickers: Record<string, TickerInfo> (already computed)
├── passes holdingsData + allTickers to DashboardTab
└── DashboardTab renders <TickerSummaryCards holdingsData={...} allTickers={...} />
```

No new data fetching. `HoldingWithDetails` already contains all required fields:
- `ticker`, `name`, `shares`, `avgCost`, `gain`, `gainPercent`

`allTickers` provides per-ticker `currency` for correct `formatCurrency` calls.

---

## 6. Integration Points

### 6.1 DashboardTab.tsx

Add `TickerSummaryCards` between the `StatCard` row and `AllocationChart`:

```tsx
// After StatCards row
<SectionTitle title="Holdings Overview" />
<TickerSummaryCards
  holdingsData={holdingsData}
  allTickers={allTickers}
  isLoading={pricesLoading}
/>

// Existing AllocationChart, LivePrices, etc. follow
```

### 6.2 Existing Components Used

| Component | Usage |
|-----------|-------|
| `Card` | Base container for each ticker card |
| `SectionTitle` | Section header above the grid |
| `motion.div` | Animation wrapper (from `motion/react`) |
| `formatCurrency` | Format avg price and P/L values |
| `formatPercent` | Format P/L percentage |

---

## 7. Styling Details

**Color coding for P/L:**
- Positive gain: `var(--accent-green)` (e.g., `#22c55e`)
- Negative gain: `var(--accent-red)` (e.g., `#ef4444`)
- Zero gain: `var(--text-muted)`

**Typography:**
- Ticker: `font-size: var(--font-size-lg)`, `font-weight: 700`
- Name: `font-size: var(--font-size-sm)`, `color: var(--text-muted)`
- Labels (Shares, Avg Price): `font-size: var(--font-size-xs)`, `color: var(--text-muted)`
- Values: `font-size: var(--font-size-md)`, `font-weight: 600`

**Spacing:**
- Card internal gap between rows: `var(--spacing-sm)` (8px)
- Grid gap: `var(--spacing-md)` (16px)
- Section margin top: `var(--spacing-xl)` (32px)

---

## 8. Accessibility

- Cards are semantic `<article>` elements
- P/L values include `aria-label` with full text (e.g., "Profit/Loss: plus 1,240 dollars, 5.2 percent")
- Color is not the only indicator: P/L values include "+" or "-" prefix
- Sufficient contrast for green/red text against card background
- Respect `prefers-reduced-motion`: disable stagger animation when user prefers reduced motion (use existing `useReducedMotion()` hook from `@/lib/hooks`)

---

## 9. Edge Cases

| Case | Handling |
|------|----------|
| No holdings | Empty state message |
| Prices loading | Skeleton cards (always show skeleton when `isLoading` is true, regardless of holdings count) |
| Stale/zero prices | Show values as-is; if `price === 0`, show "—" for P/L and add tooltip "Price unavailable" |
| Malformed data (NaN/undefined) | Show "—" for any NaN or undefined value; never crash on bad data |
| Ticker missing from `allTickers` | Fallback to `USD` for currency formatting; log a console warning in development |
| Very long ticker name | Single-line truncation with `text-overflow: ellipsis` on a max-width container |
| Fractional shares | Always show 2 decimal places |
| Negative P/L | Red color + minus prefix |
| Single holding | Grid renders 1 card, fills available space (min 280px) |

---

## 10. Future Enhancements (out of scope)

- Click card to navigate to Holdings tab filtered to that ticker
- Mini sparkline chart showing price history
- Sort cards by P/L, value, or ticker name
- Drag-to-reorder cards (like EditableLiveGrid)

---

## 11. Files to Create/Modify

### New Files
- `app/components/features/Dashboard/TickerSummaryCards.tsx`

### Modified Files
- `app/components/features/Dashboard/DashboardTab.tsx` —
  - Add to `DashboardTabProps`: `holdingsData: HoldingWithDetails[]` and `allTickers: Record<string, TickerInfo>`
  - Import and render `TickerSummaryCards` with the new props
- `app/page.tsx` — pass `holdingsData` and `allTickers` to `DashboardTab`

---

## 12. Open Questions

None. Design is ready for implementation pending user approval.
