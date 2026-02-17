This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

When deploying, make sure to add all the required environment variables in your Vercel project settings.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
