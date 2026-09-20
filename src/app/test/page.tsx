'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2, User, Mail, HelpCircle, Clock } from 'lucide-react';
import CandidateQuestionRenderer from '@/components/candidate/CandidateQuestionRenderer';

interface ClientQuestion {
  id: number;
  question: string;
  marks?: number;
  options: { key: string; text: string }[];
}

export default function AssessmentTestPage() {
  const router = useRouter();
  const [session, setSession] = useState<{
    name: string;
    email: string;
    campusName?: string;
    trainerName?: string;
    token?: string;
    paperId?: number;
    paperTitle?: string;
    durationMinutes?: number;
    startedAt?: string;
    sessionId: string;
  } | null>(null);

  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirmSubmit = useCallback(async (isAutoSubmit = false) => {
    const rawSession = sessionStorage.getItem('sap_assessment_session');
    if (!rawSession) return;
    const sess = JSON.parse(rawSession);

    setIsSubmitting(true);
    setSubmitError(null);

    // Get current answers
    const draft = sessionStorage.getItem('sap_draft_answers');
    const answersToSend = draft ? JSON.parse(draft) : userAnswers;

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: sess.name,
          candidate_email: sess.email,
          campus_name: sess.campusName || '',
          trainer_name: sess.trainerName || '',
          question_paper_id: sess.paperId || 1,
          session_id: sess.sessionId,
          answers: answersToSend,
          isAutoSubmit,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit assessment.');
      }

      const result = await res.json();
      sessionStorage.removeItem('sap_draft_answers');
      router.push(`/result/${result.id}`);
    } catch (err: any) {
      setSubmitError(err.message || "We couldn't submit your assessment. Your answers are still available. Please try again.");
      setIsSubmitting(false);
    }
  }, [userAnswers, router]);

  useEffect(() => {
    const rawSession = sessionStorage.getItem('sap_assessment_session');
    if (!rawSession) {
      router.push('/');
      return;
    }
    let parsed: any;
    try {
      parsed = JSON.parse(rawSession);
      if (!parsed.name || !parsed.email) {
        router.push('/');
        return;
      }
      setSession(parsed);
    } catch {
      router.push('/');
      return;
    }

    const savedAnswers = sessionStorage.getItem('sap_draft_answers');
    if (savedAnswers) {
      try {
        setUserAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error('Failed to parse draft answers');
      }
    }

    fetchQuestions(parsed.token);
  }, [router]);

  // Setup Exam Timer
  useEffect(() => {
    if (!session || !session.durationMinutes) return;

    const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const durationMs = session.durationMinutes * 60 * 1000;
    const expiresAt = startedAt + durationMs;

    const timer = setInterval(() => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(timer);
        handleConfirmSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, handleConfirmSubmit]);

  const fetchQuestions = async (examToken?: string) => {
    setIsLoadingQuestions(true);
    setFetchError(null);
    try {
      const url = examToken
        ? `/api/assessment/questions?token=${encodeURIComponent(examToken)}`
        : '/api/assessment/questions?token=sap-abap-assessment-01';

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load questions from server');
      }
      const data = await res.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid question format received');
      }
      setQuestions(data.questions);
    } catch (err: any) {
      setFetchError(err.message || 'Error loading assessment question paper.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSelectOption = (questionId: number, optionKey: string) => {
    const updated = { ...userAnswers, [questionId]: optionKey };
    setUserAnswers(updated);
    sessionStorage.setItem('sap_draft_answers', JSON.stringify(updated));
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) setCurrentIndex(index);
  };



  if (isLoadingQuestions) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Loading Assessment Paper</h2>
          <p className="text-sm text-slate-500 mt-2">Preparing your 10 SAP ABAP questions...</p>
        </div>
      </main>
    );
  }

  if (fetchError || questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Question Loading Error</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">{fetchError || 'No questions available.'}</p>
          <button
            onClick={() => fetchQuestions(session?.token)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all"
          >
            Retry Loading
          </button>
        </div>
      </main>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const filledBlocks = Math.round((progressPercent / 100) * 10);
  const progressBarAscii = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-xs">
              SAP ABAP
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {session?.paperTitle || 'SAP ABAP Assessment'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5 font-medium">
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <strong className="text-slate-700">{session?.name}</strong>
                </span>
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{session?.email}</span>
                </span>
                {session?.campusName && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px]">
                    Campus: {session.campusName}
                  </span>
                )}
                {session?.trainerName && (
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
                    Trainer: {session.trainerName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            {secondsRemaining !== null && (
              <div className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center space-x-1.5 shadow-xs">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>
                  TIME REMAINING: {Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:{(secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            <div className="text-right">
              <div className="text-xs font-bold text-slate-700">
                Question {currentIndex + 1} of {totalQuestions}
              </div>
              <div className="text-xs text-slate-500 font-mono tracking-wider mt-0.5">
                {progressBarAscii} {progressPercent}%
              </div>
            </div>
            <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner hidden sm:block">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Question Navigator */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Question Navigator</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Answered: <strong className="text-blue-600">{answeredCount}</strong> / {totalQuestions}
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = Boolean(userAnswers[q.id]);

              let btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200';
              if (isCurrent) {
                btnClass = 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 ring-offset-1 border-blue-600 shadow-xs';
              } else if (isAnswered) {
                btnClass = 'bg-emerald-100 text-emerald-800 font-semibold border-emerald-300';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`h-9 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-center ${btnClass}`}
                  title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {userAnswers[currentQ.id] ? (
                <span className="text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 inline" />
                  <span>Answer Selected</span>
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Unanswered</span>
              )}
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <CandidateQuestionRenderer
              question={{
                id: currentQ.id,
                question_text: currentQ.question,
                question_type: (currentQ as any).question_type || 'Single Choice',
                configuration: (currentQ as any).configuration || {
                  options: currentQ.options.map((o) => ({ id: o.key, text: o.text })),
                },
                correct_answer: '',
                marks: currentQ.marks || 1,
                option_a: currentQ.options[0]?.text || '',
                option_b: currentQ.options[1]?.text || '',
                option_c: currentQ.options[2]?.text || '',
                option_d: currentQ.options[3]?.text || '',
              }}
              questionNumber={currentIndex + 1}
              userAnswer={userAnswers[currentQ.id]}
              onAnswerChange={(val) => handleSelectOption(currentQ.id, val)}
            />
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center space-x-1 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center space-x-1 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200">
            <div className="flex items-center space-x-3 mb-4 text-slate-900">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Submit Assessment?</h3>
                <p className="text-xs text-slate-500 font-medium">Final Confirmation</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              You have answered <strong className="text-slate-900 font-bold">{answeredCount} of {totalQuestions}</strong> questions.
              {unansweredCount > 0 && (
                <span className="block mt-2 font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs">
                  ⚠️ Note: You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}.
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Once submitted, your answers cannot be changed.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) setShowSubmitModal(false);
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md flex items-center space-x-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Assessment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © 2026 SAP ABAP Online Test System.
      </footer>
    </main>
  );
}
