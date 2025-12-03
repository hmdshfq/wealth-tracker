'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export default function SignupPage() {
  useEffect(() => {
    authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
  }, []);

  return null;
}
