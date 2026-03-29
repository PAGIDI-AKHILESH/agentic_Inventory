'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.stack) console.error('Server error stack:', data.stack);
        throw new Error(data.details || data.error || 'Failed to login');
      }

      login(data.user, data.tokens);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during login.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Welcome back</h2>
        <p className="text-on-surface-variant text-lg">Sign in to manage your intelligent inventory.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="space-y-2 relative">
          <label className="text-sm font-bold text-on-surface block">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-outline-variant" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline-variant"
              placeholder="admin@acme.com"
            />
          </div>
        </div>

        <div className="space-y-2 relative">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-on-surface block">Password</label>
            <Link href="#" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-outline-variant" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline-variant"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>
          ) : (
            <><LogIn className="w-5 h-5" /> Sign In</>
          )}
        </button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm text-on-surface-variant">
          Don&apos;t have an account?{` `}
          <Link href="/setup" className="font-bold text-primary hover:text-primary-container transition-colors inline-flex items-center gap-1">
            Create workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </p>
      </div>

      {/* Demo Credentials Hint */}
      <div className="mt-12 p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-center">
        <p className="text-xs text-outline font-bold uppercase tracking-widest mb-2">Demo Access</p>
        <p className="text-sm text-on-surface-variant">
          Use <span className="font-mono bg-surface-container px-1 py-0.5 rounded text-on-surface">admin@acme.com</span> / <span className="font-mono bg-surface-container px-1 py-0.5 rounded text-on-surface">password</span>
        </p>
      </div>
    </div>
  );
}
