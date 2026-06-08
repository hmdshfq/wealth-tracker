# Improvements Todo

Based on user flow analysis of Dashboard, Investments, and Cash tabs (2026-04-15).

Last updated: 2026-04-18 (comprehensive audit)

---

## 🚨 Critical (Fix First)

### 1. Fix ESLint Errors (2 errors blocking lint)
- [ ] `OnboardingFlow.tsx:112` - setState in useEffect (use lazy initialization or event handlers)
- [ ] `OnboardingTooltip.tsx:48` - setState in useEffect + missing dependencies (`dismissKey`, `visible`)

### 2. Remove Unused Variables/Imports (28 warnings) ✅ COMPLETED 2026-04-18
- [x] `ChartCanvasSection.tsx` - `Area`, `goal`, `gradientId`
- [x] `GoalChartMini.tsx` - `formatYAxis`
- [x] `MonthlyDepositTracker.tsx` - `requiredForYear`
- [x] `AnalysisInsightsSection.tsx` - `formatChartValue`
- [x] `StrategicPanelsSection.tsx` - `isMobile`
- [x] `useInvestmentGoalChartModel.ts` - `firstTransactionDate`, `showTimeBasedAnalysis`
- [x] `ChartSubTab.tsx` & `GoalSubTab.tsx` - `goalProgress`
- [x] `TickerSearchCard.tsx` - `isCustom`, `customTickers`
- [x] `ThemeContext.tsx` - `setIsThemeInitialized`
- [x] `pdf/reports.ts` - `options` (2x) - made optional parameters
- [x] `projection.ts` - `goal`
- [x] `goalCalculations.ts` - `projectionData`
- [x] `holdingsCalculations.ts` - `_`
- [x] `useIdleRender.ts` - `useRef`
- [x] `useMarketData.ts` - `error`
- [x] `baseProjection.ts` - `index`
- [x] `financialWorker.ts` - `currentNetWorth`, `formatPLN`
- [x] `page.tsx` - `e`
- [x] `exchange-rates/route.ts` - `getPLNSymbol`, `base`

---

## ⚡ Quick Wins (High Impact, Low Effort)

### 3. Add Test Coverage (Currently: 0 test files)
- [x] Unit tests for `goalCalculations.ts`
- [x] Unit tests for `holdingsCalculations.ts`
- [x] Unit tests for `baseProjection.ts`
- [ ] Component tests for Dashboard, Investment cards
- [x] API route tests (`/api/prices`, `/api/health`)

### 4. Remove Console Logs (Production Code)
- [ ] `ThemeContext.tsx` - 1 warn
- [ ] `useFinancialWorker.ts` - 6 logs
- [ ] `useMarketData.ts` - 1 error
- [ ] `api/prices/route.ts` - 3 logs
- [ ] `api/health/route.ts` - 2 errors
- [ ] Consider removing `websocket-server.example.ts` (5 commented logs)

### 5. Type Safety
- [ ] Replace `any` in `ticker-search/route.ts` with proper interface

---

## 🎨 UX/Accessibility Improvements

### 6. Accessibility (Currently: ~10 aria attributes)
- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `role="status"` for loading states
- [ ] Add `aria-live` regions for dynamic updates (price changes, portfolio updates)
- [ ] Focus management in modals (OnboardingFlow, TransactionModal)
- [ ] Keyboard navigation for all interactive elements

### 7. Loading States
- [ ] Skeleton loaders for price fetching delays
- [ ] Skeleton for Goal chart rendering
- [ ] Loading state for transaction history

### 8. Navigation & Structure (Original)
- [ ] Make Dashboard read-only summary; do editing in dedicated tabs (reduce duplication)
- [ ] Add quick "+" action buttons directly on Dashboard for adding investments/cash
- [ ] Add "Data" tab or highlight Export/Import in settings (currently hidden in header)
- [ ] Move ticker management from Investments > Settings to global app settings

### 9. User Experience (Original)
- [ ] Add contextual prompts when cash accumulates ("You have €2,500 - add as investment?")
- [ ] Add "move cash to portfolio" quick action
- [ ] Add onboarding wizard or clear first-step prompts for new users
- [ ] Make "Edit prices" button more prominent or move to Settings tab

### 10. Content Consolidation (Original)
- [ ] Collapse secondary features in Goal tab into expandable sections (chart + confidence bands + time analysis + what-if + milestones + benchmarks + contribution optimizer = too dense)
- [ ] Consider "More" menu for advanced Goal features

---

## 📦 Code Quality

### 11. File Size Management
- [ ] `MonthlyDepositTracker.tsx` (428+ lines) - consider splitting
- [ ] `StrategicPanelsSection.tsx` - consider splitting
- [ ] `useInvestmentGoalChartModel.ts` - consider splitting

### 12. Documentation
- [ ] Add JSDoc to calculation functions
- [ ] Document complex business logic in projections
- [x] Update README with feature list beyond setup instructions

---

## Recommended Priority Order

| # | Task | Est. Time | Impact |
|---|------|-----------|--------|
| 1 | Fix 2 ESLint errors | 30 min | 🔴 Critical |
| 2 | ~~Remove 28 unused variables~~ ✅ Done | 1 hour | 🟡 Code quality |
| 3 | Add Dashboard "+" buttons | 1 hour | 🟢 UX |
| 4 | Remove console.logs | 30 min | 🟡 Production readiness |
| 5 | Basic a11y (aria-labels) | 1 hour | 🟢 Accessibility |
| 6 | Add calculation unit tests | 2 hours | 🟢 Reliability |
| 7 | Highlight Export/Import | 30 min | 🟢 UX |
| 8 | Add loading skeletons | 1 hour | 🟢 UX |
| 9 | Fix useEffect dependencies | 30 min | 🟡 Code quality |
| 10 | Replace `any` types | 30 min | 🟡 Type safety |

---

## Original Priority Order (for reference)

1. Quick wins: Add "+" buttons on Dashboard, highlight Export/Import
2. UX improvements: Onboarding, contextual prompts
3. Structural: Ticker management location, Goal tab consolidation