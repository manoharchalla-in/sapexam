'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Trash2,
  Eye,
  LogOut,
  ChevronRight,
  Loader2,
  Building,
  Check,
  FileCode,
  ArrowRight,
  Settings,
  Filter,
  Layers,
  Database,
  Activity,
  BarChart3,
  UserCheck,
  Star,
  Sparkles,
} from 'lucide-react';

interface Stats {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  passedCount: number;
  belowFiveCount: number;
  trainerStats?: Record<string, { total: number; avgScore: number; passed: number }>;
  campusStats?: Record<string, { total: number; avgScore: number; passed: number }>;
}

interface AssessmentRecordItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  campus_name?: string;
  trainer_name?: string;
  question_paper_title?: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  submitted_at: string;
}

interface TrainerItem {
  id: number;
  username: string;
  display_name: string;
}

interface CampusItem {
  id: number;
  name: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [records, setRecords] = useState<AssessmentRecordItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trainersList, setTrainersList] = useState<TrainerItem[]>([]);
  const [campusesList, setCampusesList] = useState<CampusItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  const [portalSettings, setPortalSettings] = useState({
    portal_title: 'SAP Learning Portal',
    portal_subtitle: 'Enterprise Skill Assessment System',
    portal_assessment_name: 'SAP ABAP Assessment',
    portal_instructions: 'Enter your details to begin the assessment.',
  });
  const [editAssessmentName, setEditAssessmentName] = useState('SAP ABAP Assessment');
  const [editPortalTitle, setEditPortalTitle] = useState('SAP Learning Portal');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  const fetchPortalSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPortalSettings(data.settings);
          setEditAssessmentName(data.settings.portal_assessment_name || 'SAP ABAP Assessment');
          setEditPortalTitle(data.settings.portal_title || 'SAP Learning Portal');
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, []);

  const handleQuickSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editAssessmentName.trim()) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal_assessment_name: editAssessmentName.trim(),
          portal_title: editPortalTitle.trim() || 'SAP Learning Portal',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPortalSettings(data.settings);
        }
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trainers');
      if (res.ok) {
        const data = await res.json();
        setTrainersList(data.trainers || []);
      }
    } catch (err) {
      console.error('Failed to fetch trainers', err);
    }
  }, []);

  const fetchCampuses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campuses');
      if (res.ok) {
        const data = await res.json();
        setCampusesList(data.campuses || []);
      }
    } catch (err) {
      console.error('Failed to fetch campuses', err);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/results?limit=5&sortBy=date&sortOrder=desc');
      if (res.status === 401) {
        setAuthError(true);
        router.push('/admin/login');
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch results');

      const data = await res.json();
      setRecords(data.records || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchResults();
    fetchTrainers();
    fetchCampuses();
    fetchPortalSettings();
  }, [fetchResults, fetchTrainers, fetchCampuses, fetchPortalSettings]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (authError) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight flex items-center space-x-2">
                <span>Executive Dashboard</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                  {portalSettings.portal_assessment_name || 'SAP ABAP Assessment'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">{portalSettings.portal_subtitle || 'Central Candidate Assessment & Results Management'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/records"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter All Assessment Records</span>
            </Link>

            <Link
              href="/admin/results"
              className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold py-2 px-3.5 rounded-xl transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Assessment Results</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="w-full px-6 md:px-8 py-6 space-y-6 min-w-0">
          {/* Executive Performance Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link
              href="/admin/records"
              className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 group-hover:text-blue-600">
                  Total Evaluated
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-950 mt-2 tracking-tight">{stats?.totalAttempts || 0}</div>
              <span className="text-[11px] text-blue-600 font-bold group-hover:underline flex items-center space-x-0.5 mt-1">
                <span>View All in Records Hub</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </Link>

            <Link
              href="/admin/results"
              className="glossy-card rounded-3xl p-5 border border-emerald-200/80 shadow-2xs bg-gradient-to-b from-white to-emerald-50/20 hover:border-emerald-400 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Passed Candidates
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-700 mt-2 tracking-tight">{stats?.passedCount || 0}</div>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
                {stats?.totalAttempts ? Math.round((stats.passedCount / stats.totalAttempts) * 100) : 0}% Pass Rate
              </span>
            </Link>

            <Link
              href="/admin/results"
              className="glossy-card rounded-3xl p-5 border border-rose-200/80 shadow-2xs bg-gradient-to-b from-white to-rose-50/20 hover:border-rose-400 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-rose-800">
                  Below 5 (Failed)
                </span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-rose-700 mt-2 tracking-tight">{stats?.belowFiveCount || 0}</div>
              <span className="text-[11px] text-rose-600 font-bold mt-1 inline-block">Needs Retake</span>
            </Link>

            <div className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">Average Score</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{stats?.averageScore || 0} <span className="text-xs text-slate-400 font-normal">/ 10</span></div>
              <span className="text-[11px] text-slate-500 mt-1 inline-block">{stats?.averagePercentage || 0}% overall score</span>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-amber-200/80 shadow-2xs bg-gradient-to-b from-white to-amber-50/20 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-800">Highest Score</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-700 mt-2 tracking-tight">{stats?.highestScore || 0} <span className="text-xs text-amber-500 font-normal">/ 10</span></div>
              <span className="text-[11px] text-amber-600 font-bold mt-1 inline-block">Peak Result</span>
            </div>
          </div>

          {/* Dynamic Assessment Configuration Banner */}
          <div className="glossy-card rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 shadow-2xs">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                      Live Assessment Configuration
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Dynamically customize the assessment title displayed across student exam portals and reports in real-time.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center space-x-1.5 glossy-card hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl transition-all border border-slate-200/80 shadow-2xs"
                >
                  <span>Landing Page & Campus Settings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-2xs"
                >
                  <span>Preview Candidate Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <form onSubmit={handleQuickSaveSettings} className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-1">
                <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Assessment Name (Displayed to Candidates)
                </label>
                <input
                  type="text"
                  value={editAssessmentName}
                  onChange={(e) => setEditAssessmentName(e.target.value)}
                  placeholder="e.g. SAP ABAP Assessment"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Portal Header Title
                </label>
                <input
                  type="text"
                  value={editPortalTitle}
                  onChange={(e) => setEditPortalTitle(e.target.value)}
                  placeholder="e.g. SAP Learning Portal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-3 flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full inline-flex items-center justify-center space-x-1.5 glossy-button-primary text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Assessment</span>
                    </>
                  )}
                </button>
                {settingsSavedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 shrink-0">
                    <CheckCircle className="w-4 h-4" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Quick Navigation Gateways Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/records"
              className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs border border-blue-100">
                  <Filter className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">Filter All Assessment Records</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Search, multi-dimensional filtering by trainer, campus, score, date, and export tools.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Open Filter Hub</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/results"
              className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs border border-amber-100">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">Assessment Results</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Official scorecards, grade classifications, distinction lists, and candidate performance analysis.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>View Results Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/trainers"
              className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs border border-indigo-100">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">Trainer Panels & Credentials</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Manage trainer accounts, reset passwords, copy login links, and view individual metrics.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Open Trainer Hub</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/admin/qp"
              className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:border-violet-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs border border-violet-100">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">Question Papers (Q&P)</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Multiple question papers, audit history logs, versioning, duplication, and template creator.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-600">
                <span>Manage Papers</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Breakdown Summaries: Campus & Trainer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campus Breakdown Card */}
            <div className="glossy-card rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Campus Performance Summary
                  </h3>
                </div>
                <Link href="/admin/settings" className="text-2xs font-bold text-blue-600 hover:underline">
                  Manage Campuses
                </Link>
              </div>

              <div className="space-y-2">
                {campusesList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No campuses registered.</p>
                ) : (
                  campusesList.map((c) => {
                    const cData = stats?.campusStats?.[c.name] || { total: 0, avgScore: 0, passed: 0 };
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <div>
                            <div className="text-xs font-black text-slate-900">{c.name}</div>
                            <div className="text-2xs text-slate-500 font-medium">{cData.total} Attempt{cData.total === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">
                            Avg: {cData.avgScore} / 10
                          </div>
                          <div className="text-2xs font-bold text-emerald-600">
                            {cData.passed} Passed
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Trainer Breakdown Card */}
            <div className="glossy-card rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Trainer Batch Performance Summary
                  </h3>
                </div>
                <Link href="/admin/trainers" className="text-2xs font-bold text-indigo-600 hover:underline">
                  View All Trainers
                </Link>
              </div>

              <div className="space-y-2">
                {trainersList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No trainers configured.</p>
                ) : (
                  trainersList.map((t) => {
                    const tData = stats?.trainerStats?.[t.display_name] || { total: 0, avgScore: 0, passed: 0 };
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <div>
                            <div className="text-xs font-black text-slate-900">{t.display_name}</div>
                            <div className="text-2xs text-slate-500 font-medium">User: {t.username} &bull; {tData.total} Attempt{tData.total === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">
                            Avg: {tData.avgScore} / 10
                          </div>
                          <div className="text-2xs font-bold text-emerald-600">
                            {tData.passed} Passed
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Candidate Submissions Feed */}
          <div className="glossy-card rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Latest Candidate Submissions (Recent Activity)
                </span>
              </div>
              <Link
                href="/admin/records"
                className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Open Full Filter Records Hub ({total})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50/80 text-slate-700 uppercase tracking-wider font-extrabold text-2xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-3">Campus</th>
                    <th className="py-3 px-3">Trainer</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                        <span>Loading recent submissions...</span>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No submissions recorded yet. The database is clean.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const isPassed = r.percentage >= 50;
                      return (
                        <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900">{r.candidate_name}</div>
                            <div className="text-2xs text-slate-500 font-mono">{r.candidate_email}</div>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-blue-700">{r.campus_name || '-'}</td>
                          <td className="py-3.5 px-3 font-bold text-indigo-700">{r.trainer_name || '-'}</td>
                          <td className="py-3.5 px-3 font-black text-slate-900">
                            {r.score} / {r.total_questions}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold text-2xs ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPassed ? <span>PASSED ({r.percentage}%)</span> : <span>BELOW 5 ({r.percentage}%)</span>}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-2xs text-slate-500">
                            {new Date(r.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/assessments/${r.id}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-all border border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
