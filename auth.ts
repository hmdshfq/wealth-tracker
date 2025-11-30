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
      if (user) {
        // When signing in with Google, NextAuth places profile info on user
        token.id = (user as any).id || token.id;
        token.email = (user as any).email || token.email;
        token.name = (user as any).name || token.name;

        // Persist tokens from OAuth provider to our user store if available
        const acct = account || (user as any).account;
        if (acct && acct.provider === 'google') {
          try {
            const u = await getUserByEmail(token.email as string);
            if (u) {
              await updateUser(u.id, {
                google: {
                  id: acct.providerAccountId || acct.id || undefined,
                  accessToken: (acct as any).access_token,
                  refreshToken: (acct as any).refresh_token,
                  expiresAt: (acct as any).expires_at,
                },
              });
            } else {
              // Create a new user record if one doesn't exist (Google sign up)
              const created = await createUser({
                email: token.email as string,
                name: token.name as string || 'Google User',
                password: Math.random().toString(36).slice(2, 10),
              });
              await updateUser(created.id, {
                google: {
                  id: acct.providerAccountId || acct.id || undefined,
                  accessToken: (acct as any).access_token,
                  refreshToken: (acct as any).refresh_token,
                  expiresAt: (acct as any).expires_at,
                },
              });
              token.id = created.id;
            }
          } catch (e) {
            console.warn('Failed to save Google tokens', e);
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
