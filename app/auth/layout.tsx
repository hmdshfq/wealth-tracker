import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth - Wealth Tracker',
  description: 'Sign in or create an account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
