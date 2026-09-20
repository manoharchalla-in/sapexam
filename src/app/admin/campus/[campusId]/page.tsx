'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  FileSpreadsheet,
  FileJson,
  Printer,
  ChevronDown,
  ArrowLeft,
  Building,
} from 'lucide-react';

interface Stats {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  passedCount: number;
  belowFiveCount: number;
}

interface AssessmentRecordItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  campus_name?: string;
  trainer_name?: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  submitted_at: string;
}

export default function DedicatedCampusAdminPage({
  params,
}: {
  params: Promise<{ campusId: string }>;
}) {
  const resolvedParams = use(params);
  const rawCampusId = resolvedParams.campusId || '';
  const campusName = rawCampusId.toUpperCase();
  const router = useRouter();

  const [records, setRecords] = useState<AssessmentRecordItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  const [search, setSearch] = useState<string>('');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [percentageFilter, setPercentageFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'score' | 'percentage' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        campusFilter: campusName,
        trainerFilter,
        scoreFilter,
        percentageFilter,
        dateFilter,
        sortBy,
        sortOrder,
        page: String(page),
        limit: '10',
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
  }, [search, campusName, trainerFilter, scoreFilter, percentageFilter, dateFilter, sortBy, sortOrder, page, router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    setShowExportMenu(false);
    const query = new URLSearchParams({
      format,
      search,
      campusFilter: campusName,
      trainerFilter,
      scoreFilter,
      percentageFilter,
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
      alert('Error deleting assessment record');
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
    <main className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-all"
            title="Back to Main Admin Panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-xs flex items-center space-x-1.5">
            <Building className="w-4 h-4" />
            <span>CAMPUS PANEL</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {campusName} Campus Admin Panel
            </h1>
            <p className="text-xs text-slate-500 font-medium">Candidate attempts under {campusName} Campus</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {campusName} Data</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 text-xs text-slate-700">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Export Excel (.xls)</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 font-medium"
                >
                  <FileJson className="w-4 h-4 text-amber-600" />
                  <span>Export JSON (.json)</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={handlePrint}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center space-x-2 font-medium text-slate-900"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">{campusName} Attempts</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalAttempts}</div>
              <div className="text-xs text-blue-600 font-medium mt-1">Campus candidates</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.averageScore} <span className="text-sm font-normal text-slate-400">/ 10</span></div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Mean marks</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Avg %</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.averagePercentage}%</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Campus average</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Highest Score</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.highestScore} <span className="text-sm font-normal text-slate-400">/ 10</span></div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Top candidate score</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Passed (≥ 5)</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.passedCount}</div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Students passed</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Below 5</span>
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-red-700">{stats.belowFiveCount}</div>
              <div className="text-xs text-red-600 font-medium mt-1">Needs improvement</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Search Students
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, trainer..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trainer Filter
              </label>
              <select
                value={trainerFilter}
                onChange={(e) => {
                  setTrainerFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Trainers</option>
                <option value="APPALARAJU">APPALARAJU</option>
                <option value="NOOKARAJU">NOOKARAJU</option>
                <option value="DAKSHAYINI">DAKSHAYINI</option>
                <option value="NANI">NANI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Score Filter
              </label>
              <select
                value={scoreFilter}
                onChange={(e) => {
                  setScoreFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Scores</option>
                <option value="0-2">0 – 2 Marks</option>
                <option value="3-4">3 – 4 Marks</option>
                <option value="5-6">5 – 6 Marks</option>
                <option value="7-8">7 – 8 Marks</option>
                <option value="9-10">9 – 10 Marks</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Submission Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading {campusName} assessment records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Assessment Results for {campusName} Campus</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                No candidate has completed the test under {campusName} Campus yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th onClick={() => toggleSort('name')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-all select-none">
                      <div className="flex items-center space-x-1">
                        <span>Candidate Name</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th onClick={() => toggleSort('email')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-all select-none">
                      <div className="flex items-center space-x-1">
                        <span>Email ID</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th className="py-3.5 px-4">Campus Name</th>
                    <th className="py-3.5 px-4">Trainer Name</th>

                    <th onClick={() => toggleSort('score')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-all select-none text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Score</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th onClick={() => toggleSort('percentage')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-all select-none text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Percentage</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th className="py-3.5 px-3 text-center text-emerald-700">Correct</th>
                    <th className="py-3.5 px-3 text-center text-red-600">Incorrect</th>
                    <th className="py-3.5 px-3 text-center text-slate-500">Unanswered</th>

                    <th onClick={() => toggleSort('date')} className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-all select-none">
                      <div className="flex items-center space-x-1">
                        <span>Submission Date & Time</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {records.map((r) => {
                    const dateFormatted = new Date(r.submitted_at).toLocaleString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.candidate_name}
                          {r.attempt_number > 1 && (
                            <span className="ml-2 px-1.5 py-0.5 text-3xs font-semibold rounded bg-blue-100 text-blue-800">
                              Attempt #{r.attempt_number}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">{r.candidate_email}</td>

                        <td className="py-3.5 px-4 font-bold text-blue-700 bg-blue-50/50 rounded-lg">{r.campus_name}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{r.trainer_name || '-'}</td>

                        <td className="py-3.5 px-4 text-center font-black text-slate-900">
                          {r.score} / {r.total_questions}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${
                            r.percentage >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.percentage >= 50
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {r.percentage}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-emerald-700">{r.correct_answers}</td>
                        <td className="py-3.5 px-3 text-center font-bold text-red-600">{r.incorrect_answers}</td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-500">{r.unanswered_answers}</td>

                        <td className="py-3.5 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <Link
                            href={`/admin/assessments/${r.id}`}
                            className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs transition-all"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>

                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-lg border border-red-200 text-xs transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total results)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 inline" />
                  <span>Prev</span>
                </button>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Assessment Result?</h3>
            <p className="text-xs text-slate-600 mb-6">
              This action cannot be undone. The selected attempt record will be permanently deleted.
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
    </main>
  );
}
