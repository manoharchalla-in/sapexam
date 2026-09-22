'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import AppLogo from '@/components/common/AppLogo';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  Loader2,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ExamInfo {
  id: number;
  name: string;
  code: string;
  subject: string;
  description: string;
  college_id: number;
  college_name: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  instructions: string;
  status: string;
  public_token: string;
}

interface StudentInfo {
  id: number;
  name: string;
  roll_number: string;
  email: string;
  department?: string;
  branch?: string;
  year?: string;
  section?: string;
  college_id: number;
  college_name: string;
}

interface QuestionItem {
  id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  order_index: number;
}

export default function StudentExamTakerPage() {
  const params = useParams();
  const token = params.token as string;

  // Stages: 'loading' | 'auth' | 'instructions' | 'taking' | 'submitted' | 'error'
  const [stage, setStage] = useState<'loading' | 'auth' | 'instructions' | 'taking' | 'submitted' | 'error'>('loading');
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Authentication Step
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  // Exam Taking Step
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Result Scorecard Step
  const [result, setResult] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Exam Meta
  useEffect(() => {
    async function loadMeta() {
      try {
        setStage('loading');
        const res = await fetch(`/api/exam/${token}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          setStage('auth');
        } else {
          setErrorMessage(data.message || 'Invalid or expired Exam Link.');
          setStage('error');
        }
      } catch (err: any) {
        setErrorMessage('Failed to load assessment. Please verify your connection.');
        setStage('error');
      }
    }
    if (token) loadMeta();
  }, [token]);

  // Timer Tick
  useEffect(() => {
    if (stage === 'taking' && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeLeftSeconds]);

  // Verify Student
  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setAuthError('Please enter your Username or Roll Number');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please enter your Exam Login Password');
      return;
    }

    setAuthError('');
    setVerifying(true);

    try {
      const res = await fetch(`/api/exam/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_student',
          username: identifier.trim(),
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.student) {
        setStudent(data.student);
        setStage('instructions');
      } else {
        if (data.alreadySubmitted) {
          setResult(data.result);
          setErrorMessage('You have already completed this exam.');
        }
        setAuthError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Error verifying credentials.');
    } finally {
      setVerifying(false);
    }
  };

  // Start Exam
  const handleStartExam = async () => {
    if (!student) return;
    setVerifying(true);

    try {
      const res = await fetch(`/api/exam/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_exam',
          studentId: student.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions) {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setTimeLeftSeconds((data.durationMinutes || 30) * 60);
        setCurrentIndex(0);
        setStage('taking');
      } else {
        alert(data.message || 'Failed to start exam');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  // Select Answer
  const selectOption = (optKey: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [String(currentQ.id)]: optKey,
    }));
  };

  // Clear Selection
  const clearSelection = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[String(currentQ.id)];
      return next;
    });
  };

  // Toggle Bookmark
  const toggleBookmark = () => {
    setBookmarked((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    setIsSubmitModalOpen(false);

    try {
      const durationTotal = (exam?.duration_minutes || 30) * 60;
      const timeTakenSeconds = Math.max(1, durationTotal - timeLeftSeconds);

      const res = await fetch(`/api/exam/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_exam',
          attemptId,
          answers,
          timeTakenSeconds,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
        setStage('submitted');
      } else {
        alert(data.message || 'Failed to process result');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================
  // STAGE: ERROR
  // =========================================================
  if (stage === 'error') {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md glossy-card rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Assessment Unavailable</h2>
          <p className="text-xs text-slate-500 font-medium">{errorMessage}</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // STAGE: LOADING
  // =========================================================
  if (stage === 'loading') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Assessment Portal...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // STAGE: AUTHENTICATION
  // =========================================================
  if (stage === 'auth') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 flex flex-col justify-between font-sans">
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <AppLogo size="md" />
            <div>
              <h1 className="text-sm font-black text-slate-900">{exam?.college_name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{exam?.name}</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Verified Institution
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-xl border border-slate-200/90">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">{exam?.name}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your registered institutional credentials to proceed.
                </p>
              </div>

              <form onSubmit={handleVerifyStudent} className="space-y-4">
                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Username / Roll Number */}
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Username or Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 23HT1A0501"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase glossy-input text-slate-900"
                      required
                    />
                  </div>
                </div>

                {/* Exam Password */}
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Exam Password <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Default: 123456</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter exam login password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-bold font-mono glossy-input text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full glossy-button-primary text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{verifying ? 'Authenticating...' : 'Sign In & Write Exam'}</span>
                </button>
              </form>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-2xs text-slate-500 font-medium">
                🔒 Data Scope: Limited strictly to <strong>{exam?.college_name}</strong> candidates.
              </div>
            </div>
          </div>
        </div>

        <footer className="py-3 text-center text-[10px] text-slate-400">
          Powered by SAP Exam Control • Institutional Secured Testing
        </footer>
      </main>
    );
  }

  // =========================================================
  // STAGE: INSTRUCTIONS & CANDIDATE PROFILE
  // =========================================================
  if (stage === 'instructions') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <AppLogo size="md" />
            <div>
              <h1 className="text-sm font-black text-slate-900">{exam?.college_name}</h1>
              <p className="text-[10px] text-slate-500 font-bold">{exam?.name}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-xl glossy-card rounded-3xl p-8 space-y-6 shadow-xl border border-slate-200/90">
            {/* Candidate Verification Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Candidate Verified</span>
                <h3 className="text-sm font-black text-emerald-950">{student?.name}</h3>
                <p className="text-xs font-mono text-emerald-700">Roll: {student?.roll_number} • {student?.branch} ({student?.year})</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            {/* Exam Parameters */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Duration</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{exam?.duration_minutes} Mins</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Total Marks</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{exam?.total_marks}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Passing Marks</span>
                <p className="text-base font-black text-emerald-700 mt-0.5">{exam?.passing_marks}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Assessment Instructions</h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1 font-medium">
                <p>1. Please do not refresh the page or switch browser tabs once the assessment starts.</p>
                <p>2. The timer will automatically submit your test once time reaches 00:00.</p>
                <p>3. You can review and change your selected answers anytime before final submission.</p>
                <p>4. {exam?.instructions}</p>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              disabled={verifying}
              className="w-full glossy-button-primary text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{verifying ? 'Preparing Assessment...' : 'I Agree & Start Assessment'}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // STAGE: EXAM IN PROGRESS
  // =========================================================
  if (stage === 'taking') {
    const currentQuestion = questions[currentIndex];
    const currentAns = answers[String(currentQuestion?.id)];
    const isMarked = bookmarked[currentIndex];

    return (
      <main className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
        {/* Top Header with Live Timer */}
        <header className="glossy-header px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <AppLogo size="sm" />
            <div>
              <h1 className="text-xs font-black text-slate-900">{exam?.name}</h1>
              <p className="text-[10px] text-slate-500 font-mono">Candidate: {student?.name} ({student?.roll_number})</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-black font-mono border ${
                timeLeftSeconds < 180
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Panel (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glossy-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/90 shadow-sm">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <button
                  onClick={toggleBookmark}
                  className={`text-xs font-bold flex items-center space-x-1.5 px-3 py-1 rounded-xl transition-colors ${
                    isMarked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {currentQuestion?.question_text}
              </div>

              {/* Options Radio List */}
              <div className="space-y-3 pt-2">
                {[
                  { key: 'A', text: currentQuestion?.option_a },
                  { key: 'B', text: currentQuestion?.option_b },
                  { key: 'C', text: currentQuestion?.option_c },
                  { key: 'D', text: currentQuestion?.option_d },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    onClick={() => selectOption(opt.key)}
                    className={`flex items-center p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-150 ${
                      currentAns === opt.key
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q_${currentQuestion?.id}`}
                      checked={currentAns === opt.key}
                      onChange={() => selectOption(opt.key)}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center mr-3 shrink-0">
                      {opt.key}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">{opt.text}</span>
                  </label>
                ))}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-40 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentAns && (
                  <button
                    onClick={clearSelection}
                    className="text-2xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="glossy-card rounded-3xl p-5 border border-slate-200/90 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Question Palette</h3>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Answered ({Object.keys(answers).length})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  <span>Unanswered ({questions.length - Object.keys(answers).length})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Marked for Review</span>
                </div>
              </div>

              {/* Question Buttons Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isAns = !!answers[String(q.id)];
                  const isRev = !!bookmarked[idx];
                  const isCurrent = idx === currentIndex;

                  let btnBg = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (isRev) btnBg = 'bg-amber-400 text-amber-950 font-black border-amber-500';
                  else if (isAns) btnBg = 'bg-emerald-500 text-white font-black border-emerald-600';

                  if (isCurrent) btnBg += ' ring-2 ring-blue-600 ring-offset-1';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center border transition-all ${btnBg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full glossy-button-primary text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Exam</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION CONFIRMATION MODAL */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Confirm Test Submission?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions.
                  Are you ready to submit your assessment?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center space-x-3">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // =========================================================
  // STAGE: SUBMITTED & SCORECARD
  // =========================================================
  if (stage === 'submitted' && result) {
    const isPassed = result.result_status === 'PASS';

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 flex flex-col justify-between font-sans">
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <AppLogo size="md" />
            <div>
              <h1 className="text-sm font-black text-slate-900">{exam?.college_name}</h1>
              <p className="text-[10px] text-slate-500 font-bold">{exam?.name}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glossy-card rounded-3xl p-8 space-y-6 shadow-2xl border border-slate-200/90 text-center">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-md ${
                isPassed ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
            >
              {isPassed ? <Award className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider border ${
                  isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                Assessment Result: {result.result_status}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {isPassed ? 'Congratulations! You Passed' : 'Assessment Completed'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Candidate: {student?.name} ({student?.roll_number})</p>
            </div>

            {/* Scorecard Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Score</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{result.obtained_marks} / {result.total_marks}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Percentage</span>
                <p className="text-xl font-black text-blue-600 mt-0.5">{result.percentage}%</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Correct</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{result.correct_answers} / {result.total_questions}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
              <p>Your assessment submission has been recorded securely under <strong>{exam?.college_name}</strong>.</p>
              <p className="text-2xs text-slate-400">Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <footer className="py-3 text-center text-[10px] text-slate-400">
          Powered by SAP Exam Control • Institutional Assessment System
        </footer>
      </main>
    );
  }

  return null;
}
