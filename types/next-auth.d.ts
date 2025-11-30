import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      // optional google data
      google?: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    google?: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
  }
}
