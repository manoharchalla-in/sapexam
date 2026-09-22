'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
  const collegeId = params.id as string;
  const initialExamId = searchParams.get('examId') || 'all';

  const [college, setCollege] = useState<College | null>(null);
  const [exams, setExams] = useState<ExamMeta[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    passedCount: 0,
    failedCount: 0,
    passRate: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState(initialExamId);
  const [statusFilter, setStatusFilter] = useState('all');

  // Scorecard Modal
  const [viewScorecard, setViewScorecard] = useState<AttemptResult | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const url = new URL(`/api/admin/folders/colleges/${collegeId}/results`, window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (examFilter !== 'all') url.searchParams.set('examId', examFilter);
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
  }, [collegeId, search, examFilter, statusFilter]);

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
    link.setAttribute('href', url);
    link.setAttribute('download', `${college?.name || 'College'}_Assessment_Results.csv`);
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
            <Link
              href={`/admin/folders/${collegeId}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Back to College Folder"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{college?.name || 'College'}</Link>
                <span>/</span>
                <span className="text-amber-600 font-extrabold">Results</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Assessment Results Ledger</span>
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

            <button
              onClick={exportCSV}
              disabled={results.length === 0}
              className="glossy-button-secondary text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Results CSV</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Quick Subfolder Switcher Bar */}
          <div className="glossy-panel p-2 rounded-2xl flex items-center space-x-2">
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
            <div className="px-3.5 py-2 rounded-xl text-xs font-black text-amber-900 bg-amber-100/70 border border-amber-200 shadow-2xs flex items-center space-x-2">
              <span>📁</span>
              <span>Results Folder</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glossy-panel p-4 rounded-2xl border border-slate-200/80">
              <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalSubmissions}</p>
            </div>

            <div className="glossy-panel p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40">
              <span className="text-2xs font-extrabold text-emerald-800 uppercase tracking-wider block">Passed Candidates</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.passedCount}</p>
            </div>

            <div className="glossy-panel p-4 rounded-2xl border border-rose-200/80 bg-rose-50/40">
              <span className="text-2xs font-extrabold text-rose-800 uppercase tracking-wider block">Failed Candidates</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{stats.failedCount}</p>
            </div>

            <div className="glossy-panel p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40">
              <span className="text-2xs font-extrabold text-amber-800 uppercase tracking-wider block">Pass Rate</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{stats.passRate}%</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glossy-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, roll no, email..."
                className="w-full pl-10 pr-4 py-2 text-xs font-bold text-slate-800 glossy-input rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold text-slate-700 glossy-input rounded-xl bg-white"
              >
                <option value="all">All Exam Papers</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold text-slate-700 glossy-input rounded-xl bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="PASS">PASS Only</option>
                <option value="FAIL">FAIL Only</option>
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="glossy-card rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Institutional Submissions Ledger ({results.length})
              </h2>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Live Graded
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
                <p className="text-sm font-bold text-slate-700">No assessment results recorded yet</p>
                <p className="text-xs text-slate-500">
                  When students complete their exams, their graded scorecards will appear in this ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Candidate</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Exam Paper</th>
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
                          <div>{r.exam_name}</div>
                          {r.branch && <div className="text-[10px] text-indigo-600 font-semibold">{r.branch} ({r.year || '4th Year'})</div>}
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
                  parsed = typeof viewScorecard.answers_json === 'string' ? JSON.parse(viewScorecard.answers_json) : viewScorecard.answers_json;
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
