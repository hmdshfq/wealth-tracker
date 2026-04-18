# Investment Tracker

A Next.js 16 web application for tracking ETF portfolios, managing financial goals, and monitoring multi-currency cash positions. Built with React, TypeScript, Tailwind CSS, and Clerk authentication.

## Features

### Portfolio Management
- **ETF Holdings Tracking** — Add, edit, and remove ETF positions with real-time price updates
- **Average Cost Calculation** — Automatic recalculation of average purchase prices when transactions change
- **Multi-Currency Support** — Track holdings and cash across different currencies with live exchange rates
- **Visual Portfolio Overview** — Interactive charts showing allocation and performance

### Transaction History
- **Full CRUD Operations** — Create, read, update, and delete buy/sell transactions
- **Transaction Types** — Support for buy, sell, dividend, and split transactions
- **Delta Updates** — Smart balance adjustments that reverse old values and apply new ones on edits
- **Ticker Validation** — Automatic validation of ETF symbols with price fetching

### Cash Management
- **Multi-Currency Cash Tracking** — Separate balances for USD, EUR, GBP, and other currencies
- **Cash Transaction Logging** — Record deposits, withdrawals, and currency conversions
- **Real-Time Conversion** — Live exchange rates for accurate portfolio valuation

### Goal Planning
- **Financial Goals** — Set target amounts and track progress toward investment objectives
- **Projection Charts** — Visual forecasts based on current savings rate and market assumptions
- **Milestone Tracking** — Monitor progress with percentage completion indicators

### Data Import/Export
- **JSON Export/Import** — Full state serialization with version metadata for backups
- **CSV Export** — Separate exports for holdings, transactions, and cash data
- **Data Validation** — Strict validation of imported data with clear error messages
- **Cross-Device Sync** — Transfer portfolios between devices via file export

### Live Market Data
- **Yahoo Finance Integration** — Real-time price fetching for ETF holdings
- **Automatic Updates** — Periodic refresh of prices with fallback to cached values
- **Exchange Rate Fetching** — Live currency conversion rates
- **Offline Resilience** — Graceful degradation when APIs are unavailable

### User Experience
- **Dark/Light Theme** — Respects system preference with manual toggle option
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile devices
- **Animated Interactions** — Smooth transitions and micro-interactions throughout
- **Onboarding Flow** — Guided setup for new users with sample data option
- **Authentication** — Secure sign-in/sign-up via Clerk with social providers

### Technical Features
- **TypeScript** — Full type safety across the codebase
- **Local Storage Persistence** — Data saved locally between sessions
- **PostgreSQL Backend** — Optional cloud database via Neon for multi-device sync
- **Web Workers** — Background processing for data-heavy operations
- **ESLint Configuration** — Strict linting with custom rules for import organization

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint
```

## Project Structure

```
app/
├── components/
│   ├── features/     # Domain-specific components (Dashboard, Holdings, Goals, etc.)
│   ├── layout/       # Layout components (Header, Sidebar, etc.)
│   └── ui/           # Reusable UI components (Button, Card, Modal, etc.)
├── lib/              # Utilities, hooks, and workers
├── context/          # React context providers
├── api/              # Next.js API routes
└── page.tsx          # Main application entry point
```

## Environment Variables

This project requires specific environment variables for authentication and database connectivity. Copy `.env.example` to `.env.local` and configure the following required variables:

### Required Clerk Credentials

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (from Clerk dashboard)
- `CLERK_SECRET_KEY` - Your Clerk secret key (keep this private!)

Get these from your [Clerk dashboard](https://dashboard.clerk.com) under "API Keys".

### Required Neon Database URL

- `DATABASE_URL` - Your Neon PostgreSQL connection string

Get this from your [Neon dashboard](https://console.neon.tech) under "Connection Details". The format should be:
```
postgresql://user:password@host:port/database?sslmode=require
```

### Optional Configuration

You can also configure custom routes for authentication:
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Custom sign-in page route (default: "/sign-in")
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Custom sign-up page route (default: "/sign-up")
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - Redirect after sign-in (default: "/")
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - Redirect after sign-up (default: "/")

## Import Rules

- Use barrel-based aliases for shared modules:
  - `@/components`, `@/components/ui`, `@/components/features`, `@/components/layout`
  - `@/lib`, `@/lib/hooks`, `@/lib/workers`
  - `@/context`
- Avoid legacy deep imports through `@/app/components/*`, `@/app/lib/*`, and `@/app/context/*` (enforced by ESLint).

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new). Make sure to add all required environment variables in your project settings.

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more options.
