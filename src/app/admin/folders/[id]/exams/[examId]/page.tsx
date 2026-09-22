'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  FileCheck2,
  FileCode,
  Award,
  BarChart3,
  Plus,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Clock,
  Building2,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';

interface CollegeExam {
  id: number;
  college_id: number;
  college_name?: string;
  name: string;
  code: string;
  subject: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  instructions: string;
  status: 'Draft' | 'Published' | 'Closed';
  public_token: string;
  created_at: string;
}

interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  order_index: number;
}

interface AttemptResult {
  id: string;
  exam_id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  registration_number?: string;
  email: string;
  department?: string;
  branch?: string;
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

export default function ExamManageDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const collegeId = params.id as string;
  const examId = params.examId as string;
  const initialTab = searchParams.get('tab') || 'dashboard';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'paper' | 'results'>(
    initialTab as 'dashboard' | 'paper' | 'results'
  );

  const [exam, setExam] = useState<CollegeExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [stats, setStats] = useState<any>({
    totalAttempts: 0,
    passedCount: 0,
    failedCount: 0,
    passRate: 0,
    avgScore: 0,
    highestScore: 0,
    lowestScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Question Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: undefined as number | undefined,
    question_text: '',
    question_type: 'Single Choice',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    marks: 1,
    explanation: '',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // View Candidate Result Modal
  const [viewResult, setViewResult] = useState<AttemptResult | null>(null);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'question' | 'result'; id: any; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Fetch Questions
      const qRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`);
      const qData = await qRes.json();
      if (qData.success) {
        setExam(qData.exam);
        setQuestions(qData.questions || []);
      }

      // Fetch Results
      const rRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/results`);
      const rData = await rRes.json();
      if (rData.success) {
        setResults(rData.results || []);
        if (rData.stats) setStats(rData.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId && examId) loadAllData();
  }, [collegeId, examId]);

  const handleStatusToggle = async (newStatus: 'Draft' | 'Published') => {
    if (!exam) return;
    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExam({ ...exam, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) return;
    setSavingQuestion(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsQuestionModalOpen(false);
        setQuestionForm({
          id: undefined,
          question_text: '',
          question_type: 'Single Choice',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          marks: 1,
          explanation: '',
        });
        loadAllData();
      } else {
        alert(data.message || 'Error saving question');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'question') {
        const res = await fetch(
          `/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions?questionId=${deleteTarget.id}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (data.success) {
          setDeleteTarget(null);
          loadAllData();
        }
      } else if (deleteTarget.type === 'result') {
        const res = await fetch(
          `/api/admin/folders/colleges/${collegeId}/exams/${examId}/results?attemptId=${deleteTarget.id}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (data.success) {
          setDeleteTarget(null);
          loadAllData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getExamPathUrl = () => {
    if (!exam) return '';
    const colSlug = (exam.college_name || 'college')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const exSlug = (exam.name || 'exam')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${window.location.origin}/exam/${colSlug}/${exSlug}`;
  };

  const copyPublicExamLink = () => {
    if (!exam) return;
    const link = getExamPathUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const exportResultsCSV = () => {
    if (results.length === 0) return;
    const headers = ['Student Name', 'Roll Number', 'Email', 'Department', 'Branch', 'Score', 'Total Marks', 'Percentage', 'Status', 'Time Taken (Sec)', 'Submitted Date'];
    const rows = results.map((r) => [
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.roll_number}"`,
      `"${r.email}"`,
      `"${r.department || ''}"`,
      `"${r.branch || ''}"`,
      r.obtained_marks,
      r.total_marks,
      `${r.percentage}%`,
      r.result_status,
      r.time_taken_seconds,
      `"${new Date(r.submitted_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exam?.name || 'Exam'}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar currentRole="Main Super Admin" />
        <div className="flex-1 lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/folders/${collegeId}/exams`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{exam?.college_name || 'College'}</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}/exams`} className="hover:text-blue-600">Exam Papers</Link>
                <span>/</span>
                <span className="text-indigo-600 font-extrabold">{exam?.name}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>{exam?.name}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={copyPublicExamLink}
              className="glossy-button-secondary text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Share Exam Link</span>
                </>
              )}
            </button>

            <Link
              href={getExamPathUrl()}
              target="_blank"
              className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Student View</span>
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Status & Navigation Tabs Strip */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('paper')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'paper'
                    ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span className="text-amber-500">📁</span>
                <span>Exam Paper ({questions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'results'
                    ? 'bg-white text-amber-700 shadow-xs border border-amber-100'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span className="text-amber-500">📁</span>
                <span>Results Folder ({results.length})</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xs font-extrabold uppercase text-slate-400">Exam Mode:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                <button
                  onClick={() => handleStatusToggle('Draft')}
                  className={`px-3 py-1 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${
                    exam?.status === 'Draft' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => handleStatusToggle('Published')}
                  className={`px-3 py-1 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${
                    exam?.status === 'Published' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Published
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: EXAM DASHBOARD OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glossy-card p-5 rounded-2xl">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Total Submissions</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalAttempts}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Assigned to {exam?.college_name}</p>
                </div>

                <div className="glossy-card p-5 rounded-2xl">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Pass Rate</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{stats.passRate}%</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{stats.passedCount} Passed / {stats.failedCount} Failed</p>
                </div>

                <div className="glossy-card p-5 rounded-2xl">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Average Score</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{stats.avgScore} / {exam?.total_marks}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Passing Criterion: {exam?.passing_marks}</p>
                </div>

                <div className="glossy-card p-5 rounded-2xl">
                  <p className="text-2xs font-extrabold text-slate-400 uppercase">Highest Score</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{stats.highestScore} / {exam?.total_marks}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lowest: {stats.lowestScore}</p>
                </div>
              </div>

              <div className="glossy-card rounded-3xl p-6 border border-slate-200/90 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Exam Configuration & Security</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase">Secure Link</span>
                    <p className="font-mono text-2xs font-bold text-blue-600 truncate">{window.location.origin}/exam/{exam?.public_token}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase">Assessment Duration</span>
                    <p className="font-bold text-slate-800">{exam?.duration_minutes} Minutes (Timed Evaluation)</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase">Candidate Verification</span>
                    <p className="font-bold text-emerald-700">Strict College Roll No Verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EXAM PAPER (QUESTIONS BUILDER) */}
          {/* ========================================================= */}
          {activeTab === 'paper' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Exam Question Paper</h3>
                  <p className="text-xs text-slate-500 font-medium">Create and order MCQ questions for this assessment.</p>
                </div>

                <button
                  onClick={() => {
                    setQuestionForm({
                      id: undefined,
                      question_text: '',
                      question_type: 'Single Choice',
                      option_a: '',
                      option_b: '',
                      option_c: '',
                      option_d: '',
                      correct_answer: 'A',
                      marks: 1,
                      explanation: '',
                    });
                    setIsQuestionModalOpen(true);
                  }}
                  className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Question</span>
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="glossy-card rounded-3xl p-12 text-center space-y-3">
                  <FileCode className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Questions Added Yet</p>
                  <p className="text-xs text-slate-500">Click "+ Add Question" to construct the exam paper.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="glossy-card rounded-2xl p-5 border border-slate-200/90 space-y-3 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            Q{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 leading-relaxed">
                              {q.question_text}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {q.marks || 1} Mark{q.marks !== 1 ? 's' : ''} • Single Choice
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => {
                              setQuestionForm({
                                id: q.id,
                                question_text: q.question_text,
                                question_type: q.question_type,
                                option_a: q.option_a,
                                option_b: q.option_b,
                                option_c: q.option_c,
                                option_d: q.option_d,
                                correct_answer: q.correct_answer,
                                marks: q.marks,
                                explanation: q.explanation,
                              });
                              setIsQuestionModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: `Question #${idx + 1}` })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {[
                          { key: 'A', text: q.option_a },
                          { key: 'B', text: q.option_b },
                          { key: 'C', text: q.option_c },
                          { key: 'D', text: q.option_d },
                        ].map((opt) => {
                          const isCorrect = q.correct_answer.toUpperCase() === opt.key;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
                                isCorrect
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg text-2xs font-black flex items-center justify-center ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="truncate">{opt.text}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-medium">
                          💡 <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: RESULTS FOLDER (CANDIDATE SUBMISSIONS) */}
          {/* ========================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Assessment Results Ledger</h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time candidate submissions and scores.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadAllData}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                    title="Refresh Results"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={exportResultsCSV}
                    disabled={results.length === 0}
                    className="glossy-button-secondary text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 disabled:opacity-50 shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Export Results CSV</span>
                  </button>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="glossy-card rounded-3xl p-12 text-center space-y-3">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Assessment Submissions Yet</p>
                  <p className="text-xs text-slate-500">Share the exam link with students to start receiving results.</p>
                </div>
              ) : (
                <div className="glossy-card rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-5">Student Candidate</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4 text-center">Score / Total</th>
                          <th className="py-3 px-4 text-center">Percentage</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Submitted At</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="font-black text-slate-900">{res.student_name}</div>
                              <div className="text-[10px] text-slate-400">{res.email}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {res.roll_number}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center font-black text-slate-900">
                              {res.obtained_marks} / {res.total_marks}
                            </td>

                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                              {res.percentage}%
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider border ${
                                  res.result_status === 'PASS'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {res.result_status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                              {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                              {new Date(res.submitted_at).toLocaleDateString()}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  onClick={() => setViewResult(res)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Result Breakdown"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ type: 'result', id: res.id, name: `${res.student_name} result` })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete / Reset Result"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ADD / EDIT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-5 h-5 text-white" />
                <h3 className="text-base font-black">
                  {questionForm.id ? 'Edit Question' : 'Add MCQ Question'}
                </h3>
              </div>
              <button onClick={() => setIsQuestionModalOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows={3}
                  placeholder="Enter the complete question here..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700">
                  Multiple Choice Options (A - D) <span className="text-rose-500">*</span>
                </label>

                {[
                  { key: 'A', field: 'option_a' },
                  { key: 'B', field: 'option_b' },
                  { key: 'C', field: 'option_c' },
                  { key: 'D', field: 'option_d' },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-200">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={(questionForm as any)[opt.field]}
                      onChange={(e) => setQuestionForm({ ...questionForm, [opt.field]: e.target.value })}
                      placeholder={`Option ${opt.key} text`}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Correct Answer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-black glossy-input text-emerald-700 bg-emerald-50/50"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Marks Awarded
                  </label>
                  <input
                    type="number"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: parseFloat(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Explanation / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Optional technical rationale..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{savingQuestion ? 'Saving...' : 'Save Question'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INDIVIDUAL RESULT MODAL */}
      {viewResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg glossy-card rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{viewResult.student_name}</h3>
                <p className="text-xs text-slate-500 font-mono">Roll: {viewResult.roll_number}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  viewResult.result_status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {viewResult.result_status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Score</span>
                <p className="text-lg font-black text-slate-900">{viewResult.obtained_marks} / {viewResult.total_marks}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Percentage</span>
                <p className="text-lg font-black text-blue-600">{viewResult.percentage}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-2xs font-extrabold text-slate-400 uppercase">Correct</span>
                <p className="text-lg font-black text-emerald-600">{viewResult.correct_answers} / {viewResult.total_questions}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p><strong className="text-slate-700">Email:</strong> {viewResult.email}</p>
              <p><strong className="text-slate-700">Submitted:</strong> {new Date(viewResult.submitted_at).toLocaleString()}</p>
              <p><strong className="text-slate-700">Time Taken:</strong> {Math.floor(viewResult.time_taken_seconds / 60)}m {viewResult.time_taken_seconds % 60}s</p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Delete {deleteTarget.name || 'Item'}?</h3>
              <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
