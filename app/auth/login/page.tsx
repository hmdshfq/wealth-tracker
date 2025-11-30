'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [error, setError] = useState(errorParam ? 'Sign-in failed. Please try again.' : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Failed to sign in with Google. Please try again.');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    // Set a cookie to indicate guest mode
    document.cookie = 'wealth-tracker-guest=true; path=/; max-age=31536000'; // 1 year
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Wealth Tracker</h1>
          <p className={styles.subtitle}>Sign in to manage your investments</p>
        </div>

        {error && (
          <div className={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Signing in...
              </>
            ) : (
              'Sign in with Google'
            )}
          </button>

          <button
            type="button"
            onClick={handleGuestAccess}
            disabled={isLoading}
            className={styles.buttonSecondary}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
