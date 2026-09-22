'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Award,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  Download,
  Trash2,
  Eye,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  FileSpreadsheet,
  FileJson,
  Printer,
  ChevronDown,
  Building,
  Check,
  Star,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  RotateCcw,
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
  question_paper_id?: number;
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

export default function AdminResultsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<AssessmentRecordItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trainersList, setTrainersList] = useState<TrainerItem[]>([]);
  const [campusesList, setCampusesList] = useState<CampusItem[]>([]);
  const [questionPapersList, setQuestionPapersList] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  // Result Status Tab: 'all' | 'distinction' | 'passed' | 'failed'
  const [statusTab, setStatusTab] = useState<'all' | 'distinction' | 'passed' | 'failed'>('all');

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [paperFilter, setPaperFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'score' | 'percentage' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  const fetchQuestionPapersList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/question-papers');
      if (res.ok) {
        const data = await res.json();
        setQuestionPapersList(data.questionPapers || []);
      }
    } catch (err) {
      console.error('Failed to fetch question papers', err);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      let percentageFilterVal = 'all';
      let scoreFilterVal = 'all';

      if (statusTab === 'distinction') {
        percentageFilterVal = '80-100';
      } else if (statusTab === 'passed') {
        percentageFilterVal = '50-100';
      } else if (statusTab === 'failed') {
        percentageFilterVal = '0-49';
      }

      const query = new URLSearchParams({
        search,
        trainerFilter,
        campusFilter,
        paperFilter,
        scoreFilter: scoreFilterVal,
        percentageFilter: percentageFilterVal,
        dateFilter,
        sortBy,
        sortOrder,
        page: String(page),
        limit: String(pageSize),
      });

      const res = await fetch(`/api/admin/results?${query.toString()}`);
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
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, trainerFilter, campusFilter, paperFilter, statusTab, dateFilter, sortBy, sortOrder, page, pageSize, router]);

  useEffect(() => {
    fetchResults();
    fetchCampuses();
    fetchTrainers();
    fetchQuestionPapersList();
  }, [fetchResults, fetchCampuses, fetchTrainers, fetchQuestionPapersList]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    setShowExportMenu(false);
    let percentageFilterVal = 'all';
    if (statusTab === 'distinction') percentageFilterVal = '80-100';
    else if (statusTab === 'passed') percentageFilterVal = '50-100';
    else if (statusTab === 'failed') percentageFilterVal = '0-49';

    const query = new URLSearchParams({
      format,
      search,
      trainerFilter,
      campusFilter,
      paperFilter,
      scoreFilter: 'all',
      percentageFilter: percentageFilterVal,
      dateFilter,
      sortBy,
      sortOrder,
    });
    window.open(`/api/admin/export?${query.toString()}`, '_blank');
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId }),
      });
      if (res.ok) {
        setDeleteId(null);
        fetchResults();
      } else {
        alert('Failed to delete assessment result');
      }
    } catch (err) {
      alert('Error deleting assessment result');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (field: 'name' | 'email' | 'score' | 'percentage' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  if (authError) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight flex items-center space-x-2">
                <span>Assessment Results & Scorecards</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                  Official Grade Ledger
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Verified candidate assessment attempts, grade distributions, and performance certificates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Results</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Export CSV (.csv)</span>
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Export Excel (.xls)</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 font-medium"
                  >
                    <FileJson className="w-4 h-4 text-amber-600" />
                    <span>Export JSON (.json)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handlePrint}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2.5 font-medium text-slate-900"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              )}
            </div>

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
          {/* Grade & Performance Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">Total Evaluated</span>
              <div className="text-2xl font-black text-slate-950 mt-1">{stats?.totalAttempts || 0}</div>
              <span className="text-[11px] text-slate-400">Total Submissions</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800">Passed Candidates</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{stats?.passedCount || 0}</div>
              <span className="text-[11px] text-emerald-600 font-bold">
                {stats?.totalAttempts ? Math.round((stats.passedCount / stats.totalAttempts) * 100) : 0}% Pass Rate
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-rose-800">Below 5 (Failed)</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1">{stats?.belowFiveCount || 0}</div>
              <span className="text-[11px] text-rose-600 font-bold">Needs Retake</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">Average Score</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.averageScore || 0} <span className="text-xs text-slate-400 font-normal">/ 10</span></div>
              <span className="text-[11px] text-slate-500">{stats?.averagePercentage || 0}% overall</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs bg-amber-50/20 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-amber-800">Highest Score</span>
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats?.highestScore || 0} <span className="text-xs text-amber-500 font-normal">/ 10</span></div>
              <span className="text-[11px] text-amber-600 font-bold">Distinction Tier</span>
            </div>
          </div>

          {/* Status Tabs and Filter Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Status Quick Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 space-x-1">
                <button
                  onClick={() => {
                    setStatusTab('all');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Results ({stats?.totalAttempts || total})
                </button>
                <button
                  onClick={() => {
                    setStatusTab('passed');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusTab === 'passed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  Passed ({stats?.passedCount || 0})
                </button>
                <button
                  onClick={() => {
                    setStatusTab('distinction');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusTab === 'distinction'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  ★ Distinction (80%+)
                </button>
                <button
                  onClick={() => {
                    setStatusTab('failed');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusTab === 'failed'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  Below 5 ({stats?.belowFiveCount || 0})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setTrainerFilter('all');
                    setCampusFilter('all');
                    setPaperFilter('all');
                    setDateFilter('');
                    setStatusTab('all');
                    setPage(1);
                  }}
                  className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Search Candidate
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Candidate name or email..."
                    className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Paper
                </label>
                <select
                  value={paperFilter}
                  onChange={(e) => {
                    setPaperFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Question Papers</option>
                  {questionPapersList.map((qp) => (
                    <option key={qp.id} value={qp.id}>{qp.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campus
                </label>
                <select
                  value={campusFilter}
                  onChange={(e) => {
                    setCampusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                >
                  <option value="all">All Campuses</option>
                  {campusesList.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trainer
                </label>
                <select
                  value={trainerFilter}
                  onChange={(e) => {
                    setTrainerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                >
                  <option value="all">All Trainers</option>
                  {trainersList.map((t) => (
                    <option key={t.id} value={t.display_name}>{t.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Candidate Score Ledger ({total} records)
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-2xs border-b border-slate-200">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Candidate</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Campus & Trainer</th>
                    <th className="py-3 px-3">Question Paper</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort('score')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Score</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort('percentage')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Grade / Result</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Question Accuracy</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Evaluated At</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Scorecard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span className="font-semibold text-xs">Loading assessment results...</span>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <p className="font-bold text-sm text-slate-600">No Assessment Results Found</p>
                        <p className="text-2xs text-slate-400 mt-1">Try switching tabs or clearing filters.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const isDistinction = r.percentage >= 80;
                      const isPassed = r.percentage >= 50;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{r.candidate_name}</div>
                            <div className="text-2xs text-slate-500 font-mono">{r.candidate_email}</div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                              Attempt #{r.attempt_number}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col space-y-1">
                              <span className="inline-block w-fit px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                                {r.campus_name || 'N/A'}
                              </span>
                              <span className="inline-block w-fit px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                                {r.trainer_name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-800 max-w-[200px] truncate">
                            {r.question_paper_title || 'SAP ABAP Assessment'}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-baseline space-x-1">
                              <span className="font-black text-slate-950 text-base">{r.score}</span>
                              <span className="text-slate-400 text-xs">/ {r.total_questions}</span>
                            </div>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  isDistinction ? 'bg-amber-500' : isPassed ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, r.percentage))}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            {isDistinction ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-extrabold text-2xs bg-amber-50 text-amber-700 border border-amber-200">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                <span>DISTINCTION ({r.percentage}%)</span>
                              </span>
                            ) : isPassed ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-extrabold text-2xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                <span>PASSED ({r.percentage}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-extrabold text-2xs bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>BELOW 5 ({r.percentage}%)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center space-x-1.5 text-2xs font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100" title="Correct">
                                ✓ {r.correct_answers}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-100" title="Incorrect">
                                ✗ {r.incorrect_answers}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-100" title="Unanswered">
                                ○ {r.unanswered_answers}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-2xs text-slate-500 whitespace-nowrap">
                            {new Date(r.submitted_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <Link
                              href={`/admin/assessments/${r.id}`}
                              className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all text-xs font-bold shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Scorecard</span>
                            </Link>
                            <button
                              onClick={() => setDeleteId(r.id)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            {!loading && records.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Showing <strong className="text-slate-800">{records.length}</strong> of{' '}
                  <strong className="text-slate-800">{total}</strong> results
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4 inline" />
                    <span>Prev</span>
                  </button>

                  <span className="text-xs font-bold text-slate-700 px-2">
                    {page} / {totalPages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Assessment Result?</h3>
            <p className="text-xs text-slate-600 mb-6">
              This action cannot be undone. The selected attempt record and scorecard will be permanently removed.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
