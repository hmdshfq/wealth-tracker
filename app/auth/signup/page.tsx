'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  useEffect(() => {
    // Redirect to Google sign-in
    signIn('google', {
      redirect: true,
      callbackUrl: '/',
    });
  }, []);

  return null;
}
