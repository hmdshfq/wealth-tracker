import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getUserByEmail, createUser, updateUser, type User } from '@/app/lib/users';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth provider for sign-in and Drive access
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
      if (user) {
        // For Google OAuth, we need to find or create the user in our database
        // and use OUR user ID, not Google's profile ID
        if (account && account.provider === 'google') {
          try {
            const email = (user as any).email || token.email;
            let dbUser = await getUserByEmail(email);
            
            if (!dbUser) {
              // Create a new user if they don't exist
              dbUser = await createUser({
                email: email as string,
                name: (user as any).name || 'Google User',
                password: Math.random().toString(36).slice(2, 10),
              });
            }
            
            // Always update with the latest Google tokens
            await updateUser(dbUser.id, {
              google: {
                id: account.providerAccountId || undefined,
                accessToken: (account as any).access_token,
                refreshToken: (account as any).refresh_token,
                expiresAt: (account as any).expires_at,
              },
            });
            
            // Use OUR user ID in the token, not Google's
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
          } catch (e) {
            console.error('JWT Callback: Error handling Google auth', e);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        // surface minimal google info in session
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
