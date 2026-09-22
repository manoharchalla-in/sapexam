'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, KeyRound, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get('user') || 'admin';

  const [username, setUsername] = useState(userParam);
  const [password, setPassword] = useState(userParam === 'admin' ? 'admin123' : '123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userParam) {
      setUsername(userParam);
      setPassword(userParam === 'admin' ? 'admin123' : '123');
    }
  }, [userParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      router.push(data.redirect || '/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.12),rgba(255,255,255,0.95))] flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Ambient background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden relative z-10 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <AppLogo size="lg" />
              </div>
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Enterprise Admin Portal</span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Executive Sign In</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">SAP ABAP Assessment & Evaluation Control</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs font-bold text-red-600 flex items-center space-x-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                Username / Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <div>Default Super Admin: <strong className="text-slate-900">admin</strong> / <strong className="text-slate-900">admin123</strong></div>
              <div>Trainer Password: <strong className="text-slate-900">123</strong></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glossy-button-primary font-extrabold py-3 px-6 rounded-xl shadow-md text-xs flex items-center justify-center space-x-2 disabled:opacity-60 transition-all uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
