import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUser, type User } from '@/app/lib/users';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        isSignUp: { label: 'Is Sign Up', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const isSignUp = credentials.isSignUp === 'true';
        const name = credentials.name as string;

        if (isSignUp) {
          // Sign up flow
          const existingUser = await getUserByEmail(email);
          if (existingUser) {
            throw new Error('User already exists');
          }

          if (!name || name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
          }

          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }

          const hashedPassword = await bcrypt.hash(password, 12);
          const newUser = await createUser({
            email,
            name: name.trim(),
            password: hashedPassword,
          });

          console.log('Credentials Provider: Created new user', { userId: newUser.id, email: newUser.email });
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        } else {
          // Sign in flow
          const user = await getUserByEmail(email);
          if (!user) {
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          console.log('Credentials Provider: Found user', { userId: user.id, email: user.email });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      },
    }),
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
      console.log('JWT Callback: Called', { userId: (user as any)?.id, email: (user as any)?.email, hasAccount: !!account });
      
      if (user) {
        // First, check if this is a Google sign-in by looking for the account
        if (account && account.provider === 'google') {
          // For Google OAuth, we need to find or create the user in our database
          // and use OUR user ID, not Google's profile ID
          console.log('JWT Callback: Google OAuth flow');
          try {
            const email = (user as any).email || token.email;
            let dbUser = await getUserByEmail(email);
            
            if (!dbUser) {
              // Create a new user if they don't exist
              console.log('JWT Callback: Creating new user from Google');
              dbUser = await createUser({
                email: email as string,
                name: (user as any).name || 'Google User',
                password: Math.random().toString(36).slice(2, 10),
              });
            }
            
            // Always update with the latest Google tokens
            console.log('JWT Callback: Updating Google tokens for user', { userId: dbUser.id });
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
        } else {
          // For Credentials provider, use the ID directly
          console.log('JWT Callback: Credentials auth flow');
          token.id = (user as any).id || token.id;
          token.email = (user as any).email || token.email;
          token.name = (user as any).name || token.name;
        }

        console.log('JWT Callback: Set token values', { tokenId: token.id, tokenEmail: token.email });
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
