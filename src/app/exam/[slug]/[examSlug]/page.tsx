'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface ExamInfo {
  id: number;
  name: string;
  code: string;
  subject: string;
  description: string;
  college_id: number;
  college_name: string;
  college_code: string;
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

export default function CollegeExamTakerPage() {
  const params = useParams();
  const router = useRouter();
  const collegeSlug = params.slug as string;
  const examSlug = params.examSlug as string;

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
  const [notRegistered, setNotRegistered] = useState(false);

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
        const res = await fetch(`/api/exam/${collegeSlug}/${examSlug}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          setStage('auth');
        } else {
          setErrorMessage(data.message || 'Invalid or expired Assessment Link.');
          setStage('error');
        }
      } catch (err: any) {
        setErrorMessage('Failed to load assessment. Please verify your connection.');
        setStage('error');
      }
    }
    if (collegeSlug && examSlug) loadMeta();
  }, [collegeSlug, examSlug]);

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
    setNotRegistered(false);
    setVerifying(true);

    try {
      const res = await fetch(`/api/exam/${collegeSlug}/${examSlug}`, {
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
        if (data.notRegistered) {
          setNotRegistered(true);
        }
        if (data.alreadySubmitted) {
          setResult(data.result);
          setErrorMessage('You have already completed this assessment.');
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
      const res = await fetch(`/api/exam/${collegeSlug}/${examSlug}`, {
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
        setAnswers({});
        setBookmarked({});
        setStage('taking');
      } else {
        alert(data.message || 'Failed to start exam');
      }
    } catch (err) {
      console.error(err);
      alert('Error initializing exam session');
    } finally {
      setVerifying(false);
    }
  };

  // Select Option
  const handleSelectOption = (optionKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers((prev) => ({
      ...prev,
      [q.id.toString()]: optionKey,
    }));
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

      const res = await fetch(`/api/exam/${collegeSlug}/${examSlug}`, {
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
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
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
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <AppLogo size="md" />
            <div>
              <h1 className="text-sm font-black text-slate-900">{exam?.college_name}</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{exam?.name}</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Institutional Exam
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-xl border border-slate-200/90">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">{exam?.name}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {exam?.college_name} Candidate Login
                </p>
              </div>

              <form onSubmit={handleVerifyStudent} className="space-y-4">
                {authError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>

                    {notRegistered && (
                      <div className="pt-2 border-t border-rose-200/70">
                        <Link
                          href={`/register/${collegeSlug}`}
                          className="inline-flex items-center space-x-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Register Your Credentials Now →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Username / Roll Number */}
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Student Username or Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. 23HT1A0501"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900 font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Exam Password */}
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Exam Password <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-400">Default: 123456</span>
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
                  <span>{verifying ? 'Authenticating...' : 'Sign In & Take Exam'}</span>
                </button>
              </form>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-2xs text-slate-500 font-medium">
                Not registered in <strong>{exam?.college_name}</strong>?{' '}
                <Link href={`/register/${collegeSlug}`} className="text-blue-600 font-bold underline">
                  Self-Register Here
                </Link>
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
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <AppLogo size="md" />
            <div>
              <h1 className="text-sm font-black text-slate-900">{exam?.college_name}</h1>
              <p className="text-[10px] text-slate-500 font-bold">{exam?.name}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-xl glossy-card rounded-3xl p-8 space-y-6 shadow-xl border border-slate-200/90">
            {/* Candidate Verification Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Institutional Candidate Verified
                </span>
                <h3 className="text-base font-black text-emerald-950">{student?.name}</h3>
                <p className="text-xs font-mono font-bold text-emerald-700">
                  Roll: {student?.roll_number} • {student?.branch} ({student?.year || '4th Year'})
                </p>
                <p className="text-2xs text-emerald-600 font-medium">Institution: {student?.college_name}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Assessment Rules */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Assessment Parameters</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <span className="text-2xs text-slate-400 block font-bold">Duration</span>
                  <strong className="text-xs text-slate-900 font-black">{exam?.duration_minutes} Mins</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <HelpCircle className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                  <span className="text-2xs text-slate-400 block font-bold">Questions</span>
                  <strong className="text-xs text-slate-900 font-black">{exam?.total_questions} MCQs</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-2xs text-slate-400 block font-bold">Pass Marks</span>
                  <strong className="text-xs text-slate-900 font-black">{exam?.passing_marks} / {exam?.total_marks}</strong>
                </div>
              </div>
            </div>

            {exam?.instructions && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <strong className="block font-black text-amber-950">Instructions:</strong>
                <p className="whitespace-pre-line text-slate-700 leading-relaxed">{exam.instructions}</p>
              </div>
            )}

            <button
              onClick={handleStartExam}
              disabled={verifying}
              className="w-full glossy-button-primary text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
            >
              {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck2 className="w-5 h-5" />}
              <span>{verifying ? 'Preparing Assessment Session...' : 'I Am Ready — Start Exam'}</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // STAGE: TAKING EXAM
  // =========================================================
  if (stage === 'taking') {
    const currentQ = questions[currentIndex];
    const currentAns = currentQ ? answers[currentQ.id.toString()] : undefined;
    const answeredCount = Object.keys(answers).length;

    return (
      <main className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
        {/* Top Sticky Status Bar */}
        <header className="glossy-header px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <AppLogo size="sm" />
            <div>
              <h2 className="text-xs font-black text-slate-900 leading-tight">{exam?.name}</h2>
              <p className="text-[10px] text-slate-400 font-bold">{student?.name} • {student?.roll_number}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Countdown Timer */}
            <div
              className={`px-3.5 py-1.5 rounded-xl border flex items-center space-x-2 font-mono font-black text-xs transition-colors shadow-2xs ${
                timeLeftSeconds < 180
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-900 text-white border-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Panel (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {currentQ && (
              <div className="glossy-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/90 shadow-sm flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-100">
                        Question {currentIndex + 1} of {questions.length}
                      </span>
                      <span className="text-2xs font-bold text-slate-400">
                        ({currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'})
                      </span>
                    </div>

                    <button
                      onClick={toggleBookmark}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors ${
                        bookmarked[currentIndex]
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentIndex] ? 'fill-amber-600' : ''}`} />
                      <span>{bookmarked[currentIndex] ? 'Bookmarked' : 'Review Later'}</span>
                    </button>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-4 leading-snug">
                    {currentQ.question_text}
                  </h3>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {[
                    { key: 'A', text: currentQ.option_a },
                    { key: 'B', text: currentQ.option_b },
                    { key: 'C', text: currentQ.option_c },
                    { key: 'D', text: currentQ.option_d },
                  ].map((opt) => {
                    const isSelected = currentAns === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-3.5 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 text-blue-950 font-bold shadow-xs ring-2 ring-blue-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.key}
                        </div>
                        <span className="text-xs sm:text-sm font-medium flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {currentAns && (
                      <button
                        onClick={() => {
                          const copy = { ...answers };
                          delete copy[currentQ.id.toString()];
                          setAnswers(copy);
                        }}
                        className="text-2xs font-bold text-rose-500 hover:underline px-2"
                      >
                        Clear Response
                      </button>
                    )}

                    {currentIndex === questions.length - 1 ? (
                      <button
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center space-x-1.5 shadow-md"
                      >
                        <span>Review & Submit</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                        className="glossy-button-primary text-white text-xs font-black px-5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Question Palette Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="glossy-card rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Question Palette</h4>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-600 shrink-0" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300 shrink-0" />
                  <span>Unanswered ({questions.length - answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
                  <span>Bookmarked ({Object.values(bookmarked).filter(Boolean).length})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md ring-2 ring-blue-500 shrink-0" />
                  <span>Current Item</span>
                </div>
              </div>

              {/* Grid Palette */}
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isAns = !!answers[q.id.toString()];
                  const isCurrent = currentIndex === idx;
                  const isMarked = !!bookmarked[idx];

                  let style = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (isAns) style = 'bg-blue-600 text-white border-blue-700 font-black shadow-2xs';
                  if (isMarked) style = 'bg-amber-400 text-amber-950 border-amber-500 font-black';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center border relative ${style} ${
                        isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 z-10' : ''
                      }`}
                    >
                      {idx + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-xs"
                >
                  Finish Assessment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION CONFIRMATION MODAL */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <FileCheck2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-950">Confirm Final Submission?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
                </p>
              </div>

              {questions.length - answeredCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-2xs font-bold border border-amber-200 text-left">
                  ⚠️ You still have {questions.length - answeredCount} unanswered questions. Unanswered questions receive 0 marks.
                </div>
              )}

              <div className="pt-2 flex items-center justify-center space-x-3">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Return to Test
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Evaluating...' : 'Yes, Submit Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // =========================================================
  // STAGE: SUBMITTED / SCORECARD
  // =========================================================
  if (stage === 'submitted' && result) {
    const isPass = result.result_status === 'PASS';

    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <AppLogo size="md" />
          <span className="text-xs font-bold text-slate-500">{exam?.college_name}</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg glossy-card rounded-3xl p-8 space-y-6 shadow-xl border border-slate-200/90 text-center animate-in fade-in zoom-in-95">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-md ${
                isPass ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
            >
              {isPass ? <Award className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>

            <div>
              <span
                className={`px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider ${
                  isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                Assessment Completed • {result.result_status}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {isPass ? 'Congratulations!' : 'Assessment Finished'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Candidate: <strong>{student?.name}</strong> ({student?.roll_number})
              </p>
            </div>

            {/* Scorecard Results Matrix */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-2xs text-slate-400 font-bold block">Score</span>
                <strong className="text-base text-slate-900 font-black">
                  {result.obtained_marks} / {result.total_marks}
                </strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-2xs text-slate-400 font-bold block">Percentage</span>
                <strong className="text-base text-blue-600 font-black">{result.percentage}%</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-2xs text-slate-400 font-bold block">Status</span>
                <strong
                  className={`text-base font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {result.result_status}
                </strong>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-600 space-y-1.5 text-left">
              <div className="flex justify-between">
                <span>Correct Answers:</span>
                <strong className="text-emerald-600">{result.correct_answers}</strong>
              </div>
              <div className="flex justify-between">
                <span>Incorrect Answers:</span>
                <strong className="text-rose-600">{result.incorrect_answers}</strong>
              </div>
              <div className="flex justify-between">
                <span>Time Taken:</span>
                <strong>{Math.round((result.time_taken_seconds || 0) / 60)} minutes</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                <span>Institution:</span>
                <strong className="text-slate-900">{exam?.college_name}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Your scorecard has been securely recorded into the institution's results ledger. You may now close this window.
            </p>
          </div>
        </div>

        <footer className="py-3 text-center text-[10px] text-slate-400">
          © {new Date().getFullYear()} {exam?.college_name} • SAP Exam Control
        </footer>
      </main>
    );
  }

  return null;
}
