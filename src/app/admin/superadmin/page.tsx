'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  ShieldCheck,
  Crown,
  Building2,
  Users,
  FileCheck2,
  Award,
  ArrowRight,
  TrendingUp,
  FolderTree,
  ExternalLink,
  Loader2,
  Sparkles,
  RefreshCw,
  LogOut,
  Layers,
  Key,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

interface CollegeSummary {
  id: number;
  folder_id: string;
  name: string;
  code: string;
  description: string;
  student_count: number;
  exam_count: number;
}

interface AdminData {
  username: string;
  displayName: string;
  panelTitle: string;
  initials: string;
  themeColor: string;
  totalColleges: number;
  totalStudents: number;
  totalExams: number;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  colleges: CollegeSummary[];
}

interface OverviewResponse {
  success: boolean;
  admins: AdminData[];
  globalTotals: {
    totalWorkspaces: number;
    totalStudents: number;
    totalExams: number;
    totalAttempts: number;
    totalPassed: number;
    overallPassRate: number;
  };
}

export default function SuperAdminMasterPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/overview');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load superadmin overview', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSwitchWorkspace = async (targetUsername: string) => {
    try {
      setSwitchingUser(targetUsername);
      const res = await fetch('/api/admin/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername }),
      });

      const resData = await res.json();
      if (res.ok) {
        router.push(resData.redirect || '/admin');
      } else {
        alert(resData.error || 'Failed to switch workspace');
      }
    } catch (err: any) {
      alert(err?.message || 'Error switching workspace');
    } finally {
      setSwitchingUser(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const global = data?.globalTotals || {
    totalWorkspaces: 0,
    totalStudents: 0,
    totalExams: 0,
    totalAttempts: 0,
    totalPassed: 0,
    overallPassRate: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800 flex">
      <AdminSidebar currentRole="Super Admin Master" />

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Master Control Top Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black text-slate-950 leading-tight">
                  Super Admin Master Control
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Full Control of All 4 Admin Panels</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Unified Governance & Management of Nani, Nokaraju, Dakshiyani & Apparaju Workspaces
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchOverview}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all text-xs font-bold flex items-center space-x-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <div className="w-full px-6 md:px-8 py-6 space-y-6 min-w-0">
          {/* Global System KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Total Institutional Folders
                </span>
                <div className="text-3xl font-black text-slate-950 mt-1 tracking-tight">
                  {global.totalWorkspaces}
                </div>
                <span className="text-[11px] text-blue-600 font-bold mt-0.5 inline-block">
                  Across 4 Admin Panels
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                <FolderTree className="w-6 h-6" />
              </div>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-emerald-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/40 to-emerald-50/20 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800 block">
                  Total Enrolled Candidates
                </span>
                <div className="text-3xl font-black text-emerald-700 mt-1 tracking-tight">
                  {global.totalStudents}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold mt-0.5 inline-block">
                  Candidate Credentials
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-indigo-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-800 block">
                  Question Papers & Exams
                </span>
                <div className="text-3xl font-black text-indigo-700 mt-1 tracking-tight">
                  {global.totalExams}
                </div>
                <span className="text-[11px] text-indigo-600 font-bold mt-0.5 inline-block">
                  Active Question Papers
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-purple-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/40 to-purple-50/20 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-purple-800 block">
                  Total Exam Attempts
                </span>
                <div className="text-3xl font-black text-purple-700 mt-1 tracking-tight">
                  {global.totalAttempts}
                </div>
                <span className="text-[11px] text-purple-600 font-bold mt-0.5 inline-block">
                  Overall Pass Rate: {global.overallPassRate}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 4 Dedicated Admin Panels Control Hub */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center space-x-2">
                  <span>🏛️</span>
                  <span>4 Dedicated Admin Panels</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Direct master access and real-time oversight of each admin's isolated workspace
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 glossy-card rounded-3xl border border-slate-200/80">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-slate-500">Loading Master Control Data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data?.admins.map((adm) => {
                  const isSwitching = switchingUser === adm.username;
                  return (
                    <div
                      key={adm.username}
                      className="glossy-card rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5 bg-white relative overflow-hidden"
                    >
                      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 absolute top-0 left-0 right-0" />

                      <div className="space-y-4">
                        {/* Admin Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3.5">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${adm.themeColor} text-white flex items-center justify-center font-black text-base shadow-xs`}
                            >
                              {adm.initials}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-base font-black text-slate-950">
                                  {adm.displayName}'s Admin Panel
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Active DB</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                Database: <span className="font-mono text-slate-700 font-bold">sapexam_{adm.username}.db</span>
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                            @{adm.username}
                          </span>
                        </div>

                        {/* Admin Metrics Grid */}
                        <div className="grid grid-cols-4 gap-2 text-center pt-2">
                          <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Folders</span>
                            <span className="text-sm font-black text-slate-900">{adm.totalColleges}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Students</span>
                            <span className="text-sm font-black text-slate-900">{adm.totalStudents}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Exams</span>
                            <span className="text-sm font-black text-slate-900">{adm.totalExams}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Pass Rate</span>
                            <span className="text-sm font-black text-emerald-600">{adm.passRate}%</span>
                          </div>
                        </div>

                        {/* Associated Colleges under this Admin */}
                        <div className="space-y-1.5">
                          <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">
                            Workspaces in this Panel:
                          </span>
                          {adm.colleges.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No college folders created yet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {adm.colleges.map((col) => (
                                <span
                                  key={col.id}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-bold border border-slate-200/80"
                                >
                                  <span>📁</span>
                                  <span>{col.name}</span>
                                  <span className="text-slate-400 font-normal text-[10px]">({col.student_count} std)</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Enter Admin Workspace Button */}
                      <button
                        onClick={() => handleSwitchWorkspace(adm.username)}
                        disabled={isSwitching}
                        className="w-full glossy-button-primary text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xs uppercase tracking-wider disabled:opacity-60"
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Opening {adm.displayName}'s Panel...</span>
                          </>
                        ) : (
                          <>
                            <span>Enter {adm.displayName}'s Workspace</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
