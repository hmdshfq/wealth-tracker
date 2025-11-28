'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          name: name.trim(),
          isSignUp: 'true',
          redirect: false,
        });

        if (result?.error) {
          // Parse the error message
          if (result.error.includes('already exists')) {
            setError('An account with this email already exists');
          } else {
            setError(result.error);
          }
          return;
        }

        router.push('/');
        router.refresh();
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start tracking your wealth today</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="John Doe"
              autoComplete="name"
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
            />
            <span className={styles.hint}>Minimum 6 characters</span>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className={styles.spinner} />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
