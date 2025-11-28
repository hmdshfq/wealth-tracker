# Authentication System

This app uses **NextAuth.js v5** (Auth.js) for authentication with email/password credentials.

## Quick Setup

### 1. Install Dependencies

```bash
pnpm add next-auth@beta bcryptjs
pnpm add -D @types/bcryptjs
```

### 2. Create Environment File

Create a `.env.local` file in the project root:

```bash
# Generate a secret with: openssl rand -base64 32
AUTH_SECRET="your-super-secret-key-at-least-32-characters"
```

Or copy the example file:
```bash
cp .env.local.example .env.local
```

### 3. Run the App

```bash
pnpm dev
```

## Features

- ✅ Email/password authentication
- ✅ User registration (signup)
- ✅ Protected routes via middleware
- ✅ Session management (JWT-based, 30 days)
- ✅ User menu in header with sign out
- ✅ Styled login/signup pages matching the app theme
- ✅ Automatic redirect to login for protected routes

## File Structure

```
├── auth.ts                          # NextAuth configuration
├── middleware.ts                    # Route protection middleware
├── types/next-auth.d.ts            # TypeScript declarations
├── app/
│   ├── api/auth/[...nextauth]/     # Auth API routes
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   ├── signup/page.tsx         # Signup page
│   │   └── auth.module.css         # Auth styles
│   ├── context/AuthProvider.tsx    # Session provider
│   └── lib/users.ts                # User storage (file-based)
└── data/users.json                 # User database (gitignored)
```

## User Storage

Currently uses file-based JSON storage (`data/users.json`) for simplicity.

**For production**, replace `app/lib/users.ts` with a proper database:
- PostgreSQL with Prisma
- MongoDB
- Supabase
- PlanetScale

## Upgrading to Database

1. Install Prisma: `pnpm add prisma @prisma/client`
2. Create a `schema.prisma` with User model
3. Update `app/lib/users.ts` to use Prisma queries
4. The rest of the auth system remains unchanged

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- Sessions use JWT tokens stored in HTTP-only cookies
- The `AUTH_SECRET` must be at least 32 characters
- User data file is gitignored by default
