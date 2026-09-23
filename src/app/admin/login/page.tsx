'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, KeyRound, AlertCircle, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

const ADMIN_PROFILES = [
  {
    username: 'admin',
    displayName: 'Super Admin',
    initials: 'SA',
    roleLabel: 'Master Control',
    defaultPass: 'admin123',
    gradient: 'from-amber-600 to-orange-600',
    borderColor: 'hover:border-amber-400 focus:ring-amber-400',
  },
  {
    username: 'nani',
    displayName: 'Nani',
    initials: 'NA',
    roleLabel: 'Admin Panel',
    defaultPass: '123456',
    gradient: 'from-blue-600 to-indigo-600',
    borderColor: 'hover:border-blue-400 focus:ring-blue-400',
  },
  {
    username: 'nokaraju',
    displayName: 'Nokaraju',
    initials: 'NO',
    roleLabel: 'Admin Panel',
    defaultPass: '123456',
    gradient: 'from-emerald-600 to-teal-600',
    borderColor: 'hover:border-emerald-400 focus:ring-emerald-400',
  },
  {
    username: 'dakshiyani',
    displayName: 'Dakshiyani',
    initials: 'DA',
    roleLabel: 'Admin Panel',
    defaultPass: '123456',
    gradient: 'from-purple-600 to-pink-600',
    borderColor: 'hover:border-purple-400 focus:ring-purple-400',
  },
  {
    username: 'apparaju',
    displayName: 'Apparaju',
    initials: 'AP',
    roleLabel: 'Admin Panel',
    defaultPass: '123456',
    gradient: 'from-rose-600 to-red-600',
    borderColor: 'hover:border-rose-400 focus:ring-rose-400',
  },
];

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get('user') || 'nani';

  const [username, setUsername] = useState(userParam);
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userParam) {
      setUsername(userParam);
      if (userParam === 'admin') {
        setPassword('admin123');
      } else {
        setPassword('123456');
      }
    }
  }, [userParam]);

  const selectProfile = (profileUsername: string, profilePass: string) => {
    setUsername(profileUsername);
    setPassword(profilePass);
    setError('');
  };

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginUser = customUser || username;
    const loginPass = customPass || password;

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
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

      <div className="w-full max-w-xl glossy-card rounded-3xl overflow-hidden relative z-10 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

        <div className="p-7 md:p-9">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <AppLogo size="lg" />
              </div>
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/80 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Enterprise Admin Portal</span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">Executive Admin Sign In</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">SAP ABAP Assessment & Evaluation Control</p>
          </div>

          {/* 5 Executive Admin Profiles Fast Switcher */}
          <div className="mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider">
                Select Admin Profile
              </span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                4 Admin Portals + Super Admin
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ADMIN_PROFILES.map((profile) => {
                const isSelected = username.toLowerCase() === profile.username;
                return (
                  <button
                    key={profile.username}
                    type="button"
                    onClick={() => selectProfile(profile.username, profile.defaultPass)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center relative ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 absolute top-2 right-2" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${profile.gradient} text-white flex items-center justify-center font-black text-xs shadow-2xs mb-1.5`}
                    >
                      {profile.initials}
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate w-full">
                      {profile.displayName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold tracking-tight">
                      {profile.roleLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs font-bold text-red-600 flex items-center space-x-2.5 shadow-xs">
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
                  placeholder="nani"
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
                  <span>Sign In to {username ? `${username.charAt(0).toUpperCase() + username.slice(1)}'s Panel` : 'Admin Portal'}</span>
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
