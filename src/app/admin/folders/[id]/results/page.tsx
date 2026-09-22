'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ExplorerFolder from '@/components/common/ExplorerFolder';
import {
  Award,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  Calendar,
  Clock,
  Eye,
  X,
  FileCheck2,
  RefreshCw,
  Percent,
  ChevronRight,
  FolderTree,
  FileText,
  Users,
  Layers,
} from 'lucide-react';

interface College {
  id: number;
  folder_id: string;
  name: string;
  code: string;
}

interface ExamMeta {
  id: number;
  name: string;
  code: string;
  subject?: string;
  total_questions?: number;
  total_marks?: number;
  passing_marks?: number;
  duration_minutes?: number;
  total_submissions?: number;
  passed_count?: number;
  failed_count?: number;
  pass_rate?: number;
  avg_score?: number;
}

interface AttemptResult {
  id: string;
  exam_id: number;
  exam_name: string;
  student_id: number;
  student_name: string;
  roll_number: string;
  registration_number?: string;
  email: string;
  mobile?: string;
  department?: string;
  branch?: string;
  year?: string;
  section?: string;
  started_at: string;
  submitted_at: string;
  time_taken_seconds: number;
  total_questions: number;
  attempted_count: number;
  correct_answers: number;
  incorrect_answers: number;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  result_status: 'PASS' | 'FAIL';
  answers_json: string;
}

export default function CollegeResultsFolderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const collegeId = params.id as string;

  const urlExamId = searchParams.get('examId');

  const [college, setCollege] = useState<College | null>(null);
  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    urlExamId && urlExamId !== 'all' ? urlExamId : null
  );

  const [stats, setStats] = useState({
    totalSubmissions: 0,
    passedCount: 0,
    failedCount: 0,
    passRate: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters for active view
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Scorecard Modal
  const [viewScorecard, setViewScorecard] = useState<AttemptResult | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/admin/folders/colleges/${collegeId}/results`, window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (selectedExamId) url.searchParams.set('examId', selectedExamId);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setCollege(data.college);
        setExams(data.exams || []);
        setResults(data.results || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) fetchResults();
  }, [collegeId, search, selectedExamId, statusFilter]);

  const activeExam = exams.find((e) => e.id.toString() === selectedExamId);

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = [
      'Student Name',
      'Roll Number',
      'Registration No',
      'Email',
      'Mobile',
      'Department',
      'Branch',
      'Exam Paper',
      'Score Obtained',
      'Total Marks',
      'Percentage (%)',
      'Result Status',
      'Time Taken (Mins)',
      'Submitted At',
    ];

    const rows = results.map((r) => [
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.roll_number}"`,
      `"${r.registration_number || ''}"`,
      `"${r.email}"`,
      `"${r.mobile || ''}"`,
      `"${r.department || ''}"`,
      `"${r.branch || ''}"`,
      `"${(r.exam_name || '').replace(/"/g, '""')}"`,
      r.obtained_marks,
      r.total_marks,
      `${r.percentage}%`,
      r.result_status,
      Math.round((r.time_taken_seconds || 0) / 60),
      `"${new Date(r.submitted_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = activeExam
      ? `${college?.name || 'College'}_${activeExam.name.replace(/[^a-zA-Z0-9]/g, '_')}_Results.csv`
      : `${college?.name || 'College'}_All_Assessment_Results.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            {selectedExamId ? (
              <button
                onClick={() => {
                  setSelectedExamId(null);
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                title="Back to Results Folders"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href={`/admin/folders/${collegeId}`}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                title="Back to College Folder"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}

            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{college?.name || 'College'}</Link>
                <span>/</span>
                {selectedExamId ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedExamId(null);
                        setSearch('');
                        setStatusFilter('all');
                      }}
                      className="hover:text-amber-600 font-bold"
                    >
                      Results
                    </button>
                    <span>/</span>
                    <span className="text-amber-600 font-extrabold">{activeExam?.name || 'Exam Results'}</span>
                  </>
                ) : (
                  <span className="text-amber-600 font-extrabold">Results Directory</span>
                )}
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>
                  {selectedExamId
                    ? `${activeExam?.name || 'Exam'} — Results Folder`
                    : 'Assessment Results Directory'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchResults}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Refresh Results"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {selectedExamId && (
              <button
                onClick={exportCSV}
                disabled={results.length === 0}
                className="glossy-button-secondary text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export {activeExam ? activeExam.name : 'Exam'} CSV</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Quick Subfolder Switcher Bar */}
          <div className="glossy-panel p-2 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link
                href={`/admin/folders/${collegeId}/students`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center space-x-2"
              >
                <span>📁</span>
                <span>Student Credential Data</span>
              </Link>
              <Link
                href={`/admin/folders/${collegeId}/exams`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center space-x-2"
              >
                <span>📁</span>
                <span>Exam Papers</span>
              </Link>
              <button
                onClick={() => {
                  setSelectedExamId(null);
                  setSearch('');
                  setStatusFilter('all');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors flex items-center space-x-2 ${
                  !selectedExamId
                    ? 'text-amber-900 bg-amber-100/80 border border-amber-200 shadow-2xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span>📁</span>
                <span>Results Folder</span>
              </button>
            </div>

            {selectedExamId && (
              <button
                onClick={() => {
                  setSelectedExamId(null);
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View All Question Paper Folders</span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: QUESTION PAPER RESULT FOLDERS DIRECTORY (When selectedExamId === null) */}
          {/* ========================================================================= */}
          {!selectedExamId ? (
            <div className="space-y-6">
              {/* College Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glossy-panel p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    Total Submissions
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalSubmissions}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40">
                  <span className="text-2xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                    Passed Candidates
                  </span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{stats.passedCount}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40">
                  <span className="text-2xs font-extrabold text-rose-800 uppercase tracking-wider block">
                    Failed Candidates
                  </span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{stats.failedCount}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40">
                  <span className="text-2xs font-extrabold text-amber-800 uppercase tracking-wider block">
                    Overall Pass Rate
                  </span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{stats.passRate}%</p>
                </div>
              </div>

              {/* Windows Explorer Style Question Paper Folders */}
              <div className="glossy-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                      <span>📁</span>
                      <span>Question Paper Result Folders ({exams.length})</span>
                    </h3>
                    <p className="text-2xs text-slate-400 font-medium mt-0.5">
                      Each Question Paper maintains its own isolated assessment scorecards & results ledger.
                    </p>
                  </div>
                  <span className="text-2xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">
                    Click any folder to inspect results
                  </span>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-500">Loading Result Folders...</p>
                  </div>
                ) : exams.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                      <Award className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No Question Papers Created Yet</p>
                    <p className="text-xs text-slate-500">
                      Create an Exam Paper inside the <strong>Exam Papers</strong> folder to generate dedicated result folders.
                    </p>
                    <Link
                      href={`/admin/folders/${collegeId}/exams`}
                      className="inline-flex items-center space-x-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-xs"
                    >
                      <span>Create Question Paper →</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exams.map((ex) => {
                      const subCount = ex.total_submissions || 0;
                      const passRate = ex.pass_rate || 0;

                      return (
                        <div
                          key={ex.id}
                          onClick={() => {
                            setSelectedExamId(ex.id.toString());
                            setSearch('');
                            setStatusFilter('all');
                          }}
                          className="group p-5 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 hover:border-amber-400/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center border border-amber-200/80 group-hover:scale-105 transition-transform shadow-2xs">
                                <span className="text-2xl">📁</span>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                  subCount > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {subCount} {subCount === 1 ? 'Submission' : 'Submissions'}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                                {ex.name}
                              </h4>
                              <p className="text-2xs font-mono font-bold text-slate-400 uppercase mt-0.5">
                                Code: {ex.code} • {ex.subject || 'General'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-amber-100/80 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-2xs">
                              <div className="bg-white/90 p-2 rounded-xl border border-amber-100">
                                <span className="text-slate-400 block font-bold">Pass Rate</span>
                                <strong className="text-amber-700 font-black text-xs">{passRate}%</strong>
                              </div>
                              <div className="bg-white/90 p-2 rounded-xl border border-amber-100">
                                <span className="text-slate-400 block font-bold">Passed / Failed</span>
                                <strong className="text-slate-800 font-bold text-xs">
                                  {ex.passed_count || 0} / {ex.failed_count || 0}
                                </strong>
                              </div>
                            </div>

                            <div className="w-full py-2 px-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 text-amber-900 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors">
                              <span>Open Exam Results Folder</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Global Master Ledger Folder Option */}
                    <div
                      onClick={() => {
                        setSelectedExamId('all');
                        setSearch('');
                        setStatusFilter('all');
                      }}
                      className="group p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 text-slate-700 flex items-center justify-center border border-slate-300/80 group-hover:scale-105 transition-transform shadow-2xs">
                            <span className="text-2xl">🗂️</span>
                          </div>
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                            Combined
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-slate-950 transition-colors">
                            All Question Papers (Master Ledger)
                          </h4>
                          <p className="text-2xs text-slate-400 font-medium mt-0.5">
                            Combined ledger across all exams for {college?.name}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60">
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-200/60 group-hover:bg-slate-900 text-slate-700 group-hover:text-white font-bold text-xs flex items-center justify-between transition-colors">
                          <span>Open Combined Master Ledger</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: SPECIFIC QUESTION PAPER RESULTS LEDGER (When selectedExamId is set) */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Question Paper Banner */}
              <div className="glossy-panel p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md font-black text-xl">
                    📁
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Isolated Question Paper Folder
                    </span>
                    <h2 className="text-base font-black text-slate-950 mt-1">
                      {activeExam ? activeExam.name : 'Master Combined Results'}
                    </h2>
                    {activeExam && (
                      <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                        Code: {activeExam.code} • Pass Marks: {activeExam.passing_marks} / {activeExam.total_marks} • Duration: {activeExam.duration_minutes} Mins
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedExamId(null);
                      setSearch('');
                      setStatusFilter('all');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Folders</span>
                  </button>

                  <button
                    onClick={exportCSV}
                    disabled={results.length === 0}
                    className="glossy-button-primary text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Exam Specific Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glossy-panel p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    Exam Submissions
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalSubmissions}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40">
                  <span className="text-2xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                    Passed Candidates
                  </span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{stats.passedCount}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40">
                  <span className="text-2xs font-extrabold text-rose-800 uppercase tracking-wider block">
                    Failed Candidates
                  </span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{stats.failedCount}</p>
                </div>

                <div className="glossy-panel p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40">
                  <span className="text-2xs font-extrabold text-amber-800 uppercase tracking-wider block">
                    Pass Rate
                  </span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{stats.passRate}%</p>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="glossy-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidate name, roll, email..."
                    className="w-full pl-10 pr-4 py-2 text-xs font-bold text-slate-800 glossy-input rounded-xl"
                  />
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold text-slate-700 glossy-input rounded-xl bg-white"
                  >
                    <option value="all">All Result Statuses</option>
                    <option value="PASS">PASS Only</option>
                    <option value="FAIL">FAIL Only</option>
                  </select>
                </div>
              </div>

              {/* Results Table for this Exam */}
              <div className="glossy-card rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {activeExam ? `${activeExam.name} Results` : 'All Submissions'} ({results.length})
                  </h2>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Live Graded Ledger
                  </span>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-500">Loading Assessment Results...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Award className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Submissions Recorded For This Paper</p>
                    <p className="text-xs text-slate-500">
                      When candidates take this specific assessment, their graded scorecards will appear in this folder.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-5">Candidate</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Dept / Branch</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Percentage</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Submitted At</th>
                          <th className="py-3 px-4 text-center">Scorecard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="font-black text-slate-900">{r.student_name}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{r.email}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {r.roll_number}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div>{r.branch || r.department || 'General'}</div>
                              {r.year && <div className="text-[10px] text-indigo-600 font-semibold">{r.year}</div>}
                            </td>

                            <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                              {r.obtained_marks} <span className="text-2xs text-slate-400 font-normal">/ {r.total_marks}</span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                                {r.percentage}%
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider inline-flex items-center space-x-1 ${
                                  r.result_status === 'PASS'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {r.result_status === 'PASS' ? '✓ PASS' : '✕ FAIL'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-500 text-2xs font-medium">
                              {new Date(r.submitted_at).toLocaleString()}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setViewScorecard(r)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center space-x-1 text-xs font-bold"
                                title="View Scorecard"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SCORECARD MODAL */}
      {viewScorecard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg glossy-card rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                    viewScorecard.result_status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{viewScorecard.student_name}</h3>
                  <p className="text-xs text-slate-500 font-mono font-bold">
                    Roll: {viewScorecard.roll_number} • {viewScorecard.exam_name}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewScorecard(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Score Obtained</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {viewScorecard.obtained_marks} / {viewScorecard.total_marks}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Percentage</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{viewScorecard.percentage}%</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Result Status</span>
                <p
                  className={`font-black text-sm mt-0.5 ${
                    viewScorecard.result_status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {viewScorecard.result_status}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Time Taken</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {Math.round((viewScorecard.time_taken_seconds || 0) / 60)} minutes
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Correct Answers</span>
                <p className="font-bold text-emerald-600 mt-0.5">{viewScorecard.correct_answers}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Incorrect Answers</span>
                <p className="font-bold text-rose-600 mt-0.5">{viewScorecard.incorrect_answers}</p>
              </div>
            </div>

            {/* Candidate Submitted Responses Viewer */}
            {(() => {
              let parsed: Record<string, string> = {};
              try {
                if (viewScorecard.answers_json) {
                  parsed =
                    typeof viewScorecard.answers_json === 'string'
                      ? JSON.parse(viewScorecard.answers_json)
                      : viewScorecard.answers_json;
                }
              } catch (e) {}

              const entries = Object.entries(parsed);
              if (entries.length === 0) return null;

              return (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-2xs font-black uppercase tracking-wider text-slate-400 block">
                    Recorded Answers & Responses ({entries.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {entries.map(([qId, ans], idx) => (
                      <div key={qId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-500 text-2xs mb-1">
                          <span>Item #{idx + 1} (ID: {qId})</span>
                          <span className="text-indigo-600 font-mono">
                            {ans && ans.length === 1 && ['A', 'B', 'C', 'D'].includes(ans) ? 'MCQ Choice' : 'Text Answer'}
                          </span>
                        </div>
                        <div className="text-slate-900 font-medium whitespace-pre-wrap font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200/60">
                          {ans || '<No response recorded>'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewScorecard(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
