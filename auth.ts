import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { getUserByEmail, createUser, updateUser } from '@/app/lib/users';

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
}

interface GoogleAccount {
  provider: string;
  providerAccountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

const socialProviders = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        scopes: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
      },
    }
  : {};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
  socialProviders,
  callbacks: {
    async onSignInSuccess({ user, account }: { user: BetterAuthUser; account?: GoogleAccount }) {
      try {
        const email = user.email;
        let dbUser = await getUserByEmail(email);

        if (!dbUser) {
          dbUser = await createUser({
            email,
            name: user.name || email.split('@')[0],
          });
        }

        if (account?.provider === 'google' && dbUser) {
          const googleAccount = account as GoogleAccount;
          await updateUser(dbUser.id, {
            google: {
              id: googleAccount.providerAccountId,
              accessToken: googleAccount.accessToken,
              refreshToken: googleAccount.refreshToken,
              expiresAt: googleAccount.expiresAt,
            },
          });
        }
      } catch (e) {
        console.error('Sign in callback error:', e);
      }
    },
  },
});
