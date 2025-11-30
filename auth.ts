import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getUserByEmail, createUser, updateUser, type User } from '@/app/lib/users';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'google') {
        try {
          const email = user.email as string;
          let dbUser = await getUserByEmail(email);
          
          if (!dbUser) {
            // Create a new user on first Google sign-in
            dbUser = await createUser({
              email,
              name: user.name || 'Google User',
            });
          }
          
          // Update with latest Google tokens
          await updateUser(dbUser.id, {
            google: {
              id: account.providerAccountId,
              accessToken: (account as any).access_token,
              refreshToken: (account as any).refresh_token,
              expiresAt: (account as any).expires_at,
            },
          });
          
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          (token as any).image = (user as any).image;
        } catch (e) {
          console.error('JWT Callback: Error handling Google auth', e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).image = (token as any).image;
        if ((token as any).google) {
          (session as any).google = (token as any).google;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
});
