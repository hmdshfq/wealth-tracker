import 'better-auth';

declare module 'better-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      emailVerified: boolean;
      createdAt: Date;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    createdAt: Date;
    google?: {
      id?: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
  }
}

declare module 'better-auth/react' {
  interface SessionData {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      emailVerified: boolean;
      createdAt: Date;
    };
  }
}
