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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  FileSpreadsheet,
  FileJson,
  Printer,
  ChevronDown,
  UserCheck,
  Building,
  ArrowRight,
  KeyRound,
  Plus,
  Copy,
  Check,
  Link as LinkIcon,
  FileCode,
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
  password: string;
  created_at: string;
}

const CAMPUSES = ['CITY', 'CIET'];

export default function AdminDashboardPage() {
  const router = useRouter();


  const [records, setRecords] = useState<AssessmentRecordItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trainersList, setTrainersList] = useState<TrainerItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  const [search, setSearch] = useState<string>('');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [paperFilter, setPaperFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [percentageFilter, setPercentageFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'score' | 'percentage' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  const [questionPapersList, setQuestionPapersList] = useState<any[]>([]);

  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // New Trainer Form State
  const [showAddTrainerModal, setShowAddTrainerModal] = useState<boolean>(false);
  const [newTrainerName, setNewTrainerName] = useState<string>('');
  const [newTrainerPassword, setNewTrainerPassword] = useState<string>('123');
  const [isCreatingTrainer, setIsCreatingTrainer] = useState<boolean>(false);

  // Edit Password Modal State
  const [editingTrainer, setEditingTrainer] = useState<TrainerItem | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState<string>('');
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // Copied Link Feedback
  const [copiedUsername, setCopiedUsername] = useState<string | null>(null);

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
      const query = new URLSearchParams({
        search,
        trainerFilter,
        campusFilter,
        paperFilter,
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
  }, [search, trainerFilter, campusFilter, paperFilter, scoreFilter, percentageFilter, dateFilter, sortBy, sortOrder, page, router]);

  useEffect(() => {
    fetchResults();
    fetchTrainers();
    fetchQuestionPapersList();
  }, [fetchResults, fetchTrainers, fetchQuestionPapersList]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerName.trim()) return;
    setIsCreatingTrainer(true);

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newTrainerName.trim(),
          password: newTrainerPassword.trim() || '123',
        }),
      });

      if (res.ok) {
        setNewTrainerName('');
        setNewTrainerPassword('123');
        setShowAddTrainerModal(false);
        fetchTrainers();
        fetchResults();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create trainer');
      }
    } catch (err) {
      alert('Error creating trainer');
    } finally {
      setIsCreatingTrainer(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer || !editPasswordValue.trim()) return;
    setIsSavingPassword(true);

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editingTrainer.username,
          password: editPasswordValue.trim(),
        }),
      });

      if (res.ok) {
        setEditingTrainer(null);
        setEditPasswordValue('');
        fetchTrainers();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update password');
      }
    } catch (err) {
      alert('Error updating password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteTrainer = async (username: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete trainer "${displayName}"?`)) return;

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        fetchTrainers();
        fetchResults();
      } else {
        alert('Failed to delete trainer');
      }
    } catch (err) {
      alert('Error deleting trainer');
    }
  };

  const handleCopyTrainerLink = (username: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/admin/login?user=${username}`;
    navigator.clipboard.writeText(link);
    setCopiedUsername(username);
    setTimeout(() => setCopiedUsername(null), 2000);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    setShowExportMenu(false);
    const query = new URLSearchParams({
      format,
      search,
      trainerFilter,
      campusFilter,
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Main SAP ABAP Admin Panel</h1>
              <p className="text-xs text-slate-500 font-medium">Central Candidate Assessment & Results Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/qp"
              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold py-2 px-3.5 rounded-lg transition-all shadow-xs"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Q&P (Question Papers)</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Options</span>
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

        <div className="w-full px-6 md:px-8 py-6 space-y-6 min-w-0">

        {/* Dedicated Trainer Admin Panels Grid & Management */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
                <span>Dedicated Trainer Admin Panels & Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage trainer accounts, set custom passwords, and generate direct login links</p>
            </div>

            <button
              onClick={() => setShowAddTrainerModal(true)}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Trainer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trainersList.map((trainerItem) => {
              const trainerNameUpper = trainerItem.display_name;
              const trainerData = stats?.trainerStats?.[trainerNameUpper] || { total: 0, avgScore: 0, passed: 0 };
              const isCopied = copiedUsername === trainerItem.username;

              return (
                <div
                  key={trainerItem.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                        TRAINER
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {trainerData.total} Attempts
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 mb-0.5">{trainerItem.display_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">User: {trainerItem.username}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteTrainer(trainerItem.username, trainerItem.display_name)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all"
                        title="Delete Trainer Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Password & Credentials Info */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Password:</span>
                        <div className="flex items-center space-x-1.5">
                          <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-800">
                            {trainerItem.password}
                          </code>
                          <button
                            onClick={() => {
                              setEditingTrainer(trainerItem);
                              setEditPasswordValue(trainerItem.password);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold underline text-2xs"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 mt-3">
                      <div>Avg Score: <strong className="text-slate-800">{trainerData.avgScore} / 10</strong></div>
                      <div>Passed Candidates: <strong className="text-emerald-700">{trainerData.passed}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/admin/trainer/${trainerItem.username}`}
                      className="w-full inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
                    >
                      <span>Open {trainerItem.display_name} Admin</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleCopyTrainerLink(trainerItem.username)}
                      className="w-full inline-flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs border border-slate-200 transition-all"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Trainer Login Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



        {/* Filter Controls Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Filter All Assessment Records
            </span>
            <button
              onClick={() => {
                setSearch('');
                setTrainerFilter('all');
                setCampusFilter('all');
                setScoreFilter('all');
                setPercentageFilter('all');
                setDateFilter('');
                setPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Search
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
                  placeholder="Search name, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trainer
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
                {trainersList.map((t) => (
                  <option key={t.id} value={t.display_name}>{t.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus
              </label>
              <select
                value={campusFilter}
                onChange={(e) => {
                  setCampusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Campuses</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                Date
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

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading assessment records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Assessment Results Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                No matching assessment records found for selected filters.
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

                    <th className="py-3.5 px-4">Question Paper</th>
                    <th className="py-3.5 px-4">Campus</th>
                    <th className="py-3.5 px-4">Trainer</th>

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
                        <span>Submitted At</span>
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

                        <td className="py-3.5 px-4 font-bold text-amber-800 bg-amber-50/60 rounded-lg whitespace-nowrap">
                          {(r as any).question_paper_title || 'SAP ABAP Assessment 01'}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-blue-700 bg-blue-50/50 rounded-lg">{r.campus_name || '-'}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-700 bg-indigo-50/50 rounded-lg">{r.trainer_name || '-'}</td>

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

          {/* Pagination */}
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

      {/* Delete Assessment Modal */}
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

      {/* Create New Trainer Modal */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Create New Trainer</span>
              </h3>
              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trainer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTrainerName}
                  onChange={(e) => setNewTrainerName(e.target.value)}
                  placeholder="e.g. RAMESH or NANI"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-indigo-600"
                />
                <p className="text-2xs text-slate-500 mt-1">Username will be generated automatically in lowercase.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTrainerPassword}
                  onChange={(e) => setNewTrainerPassword(e.target.value)}
                  placeholder="123"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <p className="text-2xs text-slate-500 mt-1">Default password is set to <strong>123</strong>.</p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  disabled={isCreatingTrainer}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTrainer}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1"
                >
                  {isCreatingTrainer ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Trainer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trainer Password Modal */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Update Password</span>
              </h3>
              <button
                onClick={() => setEditingTrainer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500">Trainer:</span>
                <div className="text-sm font-black text-slate-900">{editingTrainer.display_name}</div>
                <div className="text-2xs text-slate-500 font-mono">Username: {editingTrainer.username}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPasswordValue}
                  onChange={(e) => setEditPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  disabled={isSavingPassword}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  {isSavingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
