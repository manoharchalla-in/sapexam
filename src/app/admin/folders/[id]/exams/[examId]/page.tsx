'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  FileCheck2,
  FileCode,
  Award,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  ExternalLink,
  AlignLeft,
  ListChecks,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Search,
  Download,
  RefreshCw,
  Sparkles,
  Layers,
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
  status?: string;
  answers_json: string;
}

export default function ExamPaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const collegeId = params.id as string;
  const examId = params.examId as string;
  const initialTab = (searchParams.get('tab') as 'questions' | 'live' | 'analytics' | 'results') || 'questions';

  // Active Subfolder Tab: 'questions' | 'live' | 'analytics' | 'results'
  const [activeTab, setActiveTab] = useState<'questions' | 'live' | 'analytics' | 'results'>(initialTab);

  const [exam, setExam] = useState<CollegeExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [liveAttempts, setLiveAttempts] = useState<AttemptResult[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Results Tab Filters
  const [resultSearch, setResultSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewScorecard, setViewScorecard] = useState<AttemptResult | null>(null);

  // Question Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState<'Single Choice' | 'Text'>('Single Choice');
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

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'question'; id: any; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch Questions & Exam Info
      const qRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`);
      const qData = await qRes.json();
      if (qData.success) {
        setExam(qData.exam);
        setQuestions(qData.questions || []);
      }

      // 2. Fetch Results, Live Sessions & Analytics for this Exam
      const rRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/results`);
      const rData = await rRes.json();
      if (rData.success) {
        setResults(rData.results || []);
        setLiveAttempts(rData.liveAttempts || []);
        setAnalytics(rData.analytics || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [collegeId, examId]);

  const pollLiveSessions = useCallback(async () => {
    try {
      setLiveLoading(true);
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/results`);
      const data = await res.json();
      if (data.success) {
        setLiveAttempts(data.liveAttempts || []);
        setResults(data.results || []);
        if (data.analytics) setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLiveLoading(false);
    }
  }, [collegeId, examId]);

  useEffect(() => {
    if (collegeId && examId) loadAllData();
  }, [collegeId, examId, loadAllData]);

  // Live polling every 5 seconds when 'live' tab is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTab === 'live') {
      pollLiveSessions();
      interval = setInterval(pollLiveSessions, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, pollLiveSessions]);

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

  const handleOpenAddModal = () => {
    setQuestionType('Single Choice');
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
  };

  const handleOpenEditModal = (q: Question) => {
    const isText = ['text', 'subjective', 'coding', 'text / descriptive', 'descriptive'].includes(
      (q.question_type || '').toLowerCase()
    );
    const resolvedType = isText ? 'Text' : 'Single Choice';
    setQuestionType(resolvedType);
    setQuestionForm({
      id: q.id,
      question_text: q.question_text,
      question_type: resolvedType,
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer || (isText ? '' : 'A'),
      marks: q.marks || 1,
      explanation: q.explanation || '',
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) return;
    setSavingQuestion(true);

    try {
      const payload = {
        ...questionForm,
        question_type: questionType,
      };

      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsQuestionModalOpen(false);
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
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/exam/${colSlug}/${exSlug}`;
  };

  const copyPublicExamLink = () => {
    if (!exam) return;
    const link = getExamPathUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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
      `"${(r.exam_name || exam?.name || '').replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `${exam?.name || 'Exam'}_Assessment_Results.csv`);
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
              title="Back to Exam Papers Folder"
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
              <span>Preview Exam View</span>
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Windows Explorer Style Address Bar */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">📁</span>
              <Link href="/admin/folders" className="text-xs font-bold text-slate-600 hover:text-blue-600">Folders</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/admin/folders/${collegeId}`} className="text-xs font-bold text-slate-600 hover:text-blue-600">{exam?.college_name}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/admin/folders/${collegeId}/exams`} className="text-xs font-bold text-slate-600 hover:text-blue-600">Exam Papers</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black text-indigo-900">{exam?.name}</span>
            </div>

            <div className="flex items-center space-x-2 text-2xs font-bold text-slate-500">
              <span>Code: <strong className="font-mono text-slate-800">{exam?.code}</strong></span>
              <span>•</span>
              <span>Duration: <strong className="text-slate-800">{exam?.duration_minutes} Mins</strong></span>
              <span>•</span>
              <span>Pass Marks: <strong className="text-emerald-700">{exam?.passing_marks}/{exam?.total_marks}</strong></span>
            </div>
          </div>

          {/* DEDICATED EXAM SUBFOLDERS SWITCHER BAR (4 AUTOMATIC SUBFOLDERS) */}
          <div className="glossy-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200/90">
            <div className="flex flex-wrap items-center gap-2">
              {/* Subfolder 1: Question Paper (Q&P) */}
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'questions'
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>📁</span>
                <span>Question Paper ({questions.length} Qs)</span>
              </button>

              {/* Subfolder 2: Live Monitoring */}
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'live'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${activeTab === 'live' ? 'animate-pulse' : 'text-emerald-600'}`} />
                <span>Live Monitoring ({liveAttempts.length} Active)</span>
              </button>

              {/* Subfolder 3: Analytics & Pass Rates */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'analytics'
                    ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-500/20'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Analytics & Pass Rates</span>
              </button>

              {/* Subfolder 4: Results Folder */}
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
                  activeTab === 'results'
                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>📁</span>
                <span>Results Folder ({results.length} Subs)</span>
              </button>
            </div>

            {/* Exam Mode Toggle (Draft / Published) */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
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

          {/* ========================================================================= */}
          {/* TAB 1: QUESTION PAPER (Q&P) BUILDER */}
          {/* ========================================================================= */}
          {activeTab === 'questions' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                    <span>Authored Questions ({questions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Create and organize Multiple Choice (MCQ) & Text / Coding questions for this exam paper.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Question</span>
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="glossy-card rounded-3xl p-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                    <FileCode className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No Questions Added to this Paper Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "+ Add Question" to begin adding Multiple Choice (MCQ) or Text / Descriptive questions.
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add First Question</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const isText = ['text', 'subjective', 'coding', 'text / descriptive', 'descriptive'].includes(
                      (q.question_type || '').toLowerCase()
                    );

                    return (
                      <div
                        key={q.id}
                        className="glossy-card rounded-2xl p-5 border border-slate-200/90 hover:border-indigo-300 transition-all space-y-4 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                    isText
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {isText ? '📝 Text / Descriptive' : '🔘 Multiple Choice (MCQ)'}
                                </span>
                                <span className="text-2xs font-bold text-slate-400">
                                  {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</h4>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditModal(q)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: `Question #${idx + 1}` })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Details / Options / Reference Solution */}
                        {!isText ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            {[
                              { key: 'A', text: q.option_a },
                              { key: 'B', text: q.option_b },
                              { key: 'C', text: q.option_c },
                              { key: 'D', text: q.option_d },
                            ].map((opt) => {
                              const isCorrect = q.correct_answer === opt.key;
                              return (
                                <div
                                  key={opt.key}
                                  className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                                      : 'bg-slate-50/70 border-slate-200/70 text-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
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
                        ) : (
                          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70 text-xs text-purple-900 space-y-1">
                            <span className="text-2xs font-extrabold text-purple-800 uppercase block">
                              Expected Solution / Evaluation Criteria:
                            </span>
                            <p className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                              {q.correct_answer || '<Candidate submits free-form text / code solution>'}
                            </p>
                          </div>
                        )}

                        {q.explanation && (
                          <div className="text-2xs text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>Grading Note:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE MONITORING (Real-Time Proctoring for THIS Exam) */}
          {/* ========================================================================= */}
          {activeTab === 'live' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="glossy-panel p-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-2xs uppercase tracking-wider flex items-center space-x-1 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                        <span>Live Proctoring Active</span>
                      </span>
                      <span className="text-2xs text-slate-400 font-bold">Auto-refreshing every 5s</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {exam?.name} — Active Candidates
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Real-time visibility into students currently taking this examination paper.
                    </p>
                  </div>
                </div>

                <button
                  onClick={pollLiveSessions}
                  disabled={liveLoading}
                  className="glossy-button-secondary text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${liveLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Active Sessions</span>
                </button>
              </div>

              {/* Live Status Content */}
              {liveAttempts.length === 0 ? (
                <div className="glossy-card rounded-3xl p-12 text-center space-y-3">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-base font-black text-slate-800">No Candidates Currently Active</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    When students start writing this exam from the candidate portal, their live sessions will stream here in real-time.
                  </p>
                </div>
              ) : (
                <div className="glossy-card rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Active Live Candidates ({liveAttempts.length})
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Streaming Live
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-5">Candidate</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Dept / Branch</th>
                          <th className="py-3 px-4">Session Started</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liveAttempts.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="font-black text-slate-900">{att.student_name}</div>
                              <div className="text-[10px] text-slate-400">{att.email}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {att.roll_number}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {att.branch || att.department || 'General'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-2xs font-mono">
                              {new Date(att.started_at).toLocaleTimeString()}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                <span>In Progress</span>
                              </span>
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

          {/* ========================================================================= */}
          {/* TAB 3: ANALYTICS & PASS RATES (Exam-Specific Deep Visual Analytics) */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glossy-panel p-5 rounded-2xl border border-slate-200/80 bg-white">
                  <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">
                    Total Submissions
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-3xl font-black text-slate-900">{analytics?.totalSubmissions || 0}</p>
                    <span className="text-2xs text-slate-400 font-bold">completed</span>
                  </div>
                </div>

                <div className="glossy-panel p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                  <span className="text-2xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                    Pass Rate
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-3xl font-black text-emerald-700">{analytics?.passRate || 0}%</p>
                    <span className="text-2xs text-emerald-600 font-bold">
                      ({analytics?.passedCount || 0} Passed)
                    </span>
                  </div>
                </div>

                <div className="glossy-panel p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40">
                  <span className="text-2xs font-extrabold text-indigo-800 uppercase tracking-wider block">
                    Average Score
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-3xl font-black text-indigo-700">{analytics?.avgScore || 0}</p>
                    <span className="text-2xs text-indigo-500 font-normal">/ {exam?.total_marks} Marks</span>
                  </div>
                </div>

                <div className="glossy-panel p-5 rounded-2xl border border-amber-200 bg-amber-50/40">
                  <span className="text-2xs font-extrabold text-amber-800 uppercase tracking-wider block">
                    Avg Completion Time
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-3xl font-black text-amber-700">{analytics?.avgTimeMinutes || 0}</p>
                    <span className="text-2xs text-amber-600 font-bold">Mins</span>
                  </div>
                </div>
              </div>

              {/* Visual Performance Gauges & Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pass vs Fail Ratio */}
                <div className="glossy-card rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Pass vs Fail Breakdown</span>
                  </h4>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-700">Passed ({analytics?.passedCount || 0})</span>
                      <span className="text-rose-700">Failed ({analytics?.failedCount || 0})</span>
                    </div>

                    {/* Progress Ratio Bar */}
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${analytics?.passRate || 0}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                        title={`Passed: ${analytics?.passRate || 0}%`}
                      />
                      <div
                        style={{ width: `${100 - (analytics?.passRate || 0)}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                        title={`Failed: ${100 - (analytics?.passRate || 0)}%`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-2xs font-bold">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                        <span>Highest Score: </span>
                        <strong className="text-xs">{analytics?.highestScore || 0} / {exam?.total_marks}</strong>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                        <span>Lowest Score: </span>
                        <strong className="text-xs">{analytics?.lowestScore || 0} / {exam?.total_marks}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Distribution Breakdown */}
                <div className="glossy-card rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Grade Classifications</span>
                  </h4>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-800">Distinction (90% – 100%)</span>
                      </div>
                      <strong className="font-mono text-slate-900">{analytics?.scoreDistribution?.grade90_100 || 0}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-bold text-slate-800">First Class (75% – 89%)</span>
                      </div>
                      <strong className="font-mono text-slate-900">{analytics?.scoreDistribution?.grade75_89 || 0}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-slate-800">Pass Class (50% – 74%)</span>
                      </div>
                      <strong className="font-mono text-slate-900">{analytics?.scoreDistribution?.grade50_74 || 0}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="font-bold text-slate-800">Needs Retake (&lt; 50%)</span>
                      </div>
                      <strong className="font-mono text-slate-900">{analytics?.scoreDistribution?.gradeBelow50 || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: RESULTS FOLDER (Dedicated Candidate Scorecards Ledger) */}
          {/* ========================================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Search & Export Actions */}
              <div className="glossy-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
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

              {/* Results Ledger Table */}
              <div className="glossy-card rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Graded Candidate Scorecards ({results.length})
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Official Ledger
                  </span>
                </div>

                {results.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Award className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Submissions Recorded For This Paper Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Completed candidate scorecards will be automatically recorded here.
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
                        {results
                          .filter((r) => {
                            if (statusFilter !== 'all' && r.result_status !== statusFilter) return false;
                            if (resultSearch) {
                              const s = resultSearch.toLowerCase();
                              return (
                                r.student_name.toLowerCase().includes(s) ||
                                r.roll_number.toLowerCase().includes(s) ||
                                r.email.toLowerCase().includes(s)
                              );
                            }
                            return true;
                          })
                          .map((r) => (
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

      {/* QUESTION CREATE/EDIT MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-base font-black">
                    {questionForm.id ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    {exam?.name} • Multiple Choice (MCQ) & Text / Coding
                  </p>
                </div>
              </div>
              <button onClick={() => setIsQuestionModalOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Question Type Switcher */}
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Question Format <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType('Single Choice');
                      setQuestionForm({ ...questionForm, question_type: 'Single Choice', correct_answer: questionForm.correct_answer || 'A' });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                      questionType === 'Single Choice'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>🔘 Multiple Choice (MCQ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType('Text');
                      setQuestionForm({ ...questionForm, question_type: 'Text' });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                      questionType === 'Text'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>📝 Text / Descriptive / Coding</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Question Prompt / Problem Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  placeholder="Enter the complete question prompt, code snippet, or descriptive problem..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              {/* CONDITIONAL BODY: MCQ OPTIONS vs TEXT REFERENCE KEY */}
              {questionType === 'Single Choice' ? (
                <div className="space-y-3 pt-1">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Multiple Choice Options (A – D) <span className="text-rose-500">*</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 mb-1">Option A</label>
                      <input
                        type="text"
                        value={questionForm.option_a}
                        onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                        placeholder="Option A text"
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                        required={questionType === 'Single Choice'}
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 mb-1">Option B</label>
                      <input
                        type="text"
                        value={questionForm.option_b}
                        onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                        placeholder="Option B text"
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                        required={questionType === 'Single Choice'}
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 mb-1">Option C</label>
                      <input
                        type="text"
                        value={questionForm.option_c}
                        onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                        placeholder="Option C text"
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                        required={questionType === 'Single Choice'}
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 mb-1">Option D</label>
                      <input
                        type="text"
                        value={questionForm.option_d}
                        onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                        placeholder="Option D text"
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                        required={questionType === 'Single Choice'}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-purple-900 mb-1">
                    Expected Solution / Reference Keywords (Optional)
                  </label>
                  <textarea
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    placeholder="Enter expected keywords, code solution, or model answer for manual/automated evaluation..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium glossy-input text-slate-900 bg-purple-50/30 border-purple-200"
                  />
                  <p className="text-[11px] text-slate-400">
                    Candidates will be provided a rich writing/code area during their exam session to type responses.
                  </p>
                </div>
              )}

              {/* Correct Answer (for MCQ) & Marks */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {questionType === 'Single Choice' ? (
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
                ) : (
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Question Type
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      📝 Text / Descriptive
                    </div>
                  </div>
                )}

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

              {/* Explanation */}
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Explanation / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Optional technical rationale or grading notes..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              {/* Submit Buttons */}
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

      {/* SCORECARD INSPECTION MODAL */}
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
                    Roll: {viewScorecard.roll_number} • {exam?.name}
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
