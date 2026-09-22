'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  UserCheck,
  Clock,
  XCircle,
  Loader2,
  FileText,
  Award,
  CheckCircle2,
  HelpCircle,
  BookOpenCheck,
} from 'lucide-react';

interface ReviewItem {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  userAnswerKey: string | null;
  userAnswerText: string;
  correctAnswerKey: string;
  correctAnswerText: string;
  explanation?: string;
  status: 'correct' | 'incorrect' | 'unanswered';
}

interface AdminDetailData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  campus_name: string;
  trainer_name: string;
  question_paper_title: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  submitted_at: string;
  created_at: string;
  review: ReviewItem[];
}

export default function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<AdminDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [resultId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/results/${resultId}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Candidate assessment attempt record not found');
      }
      const record = await res.json();
      setData(record);
    } catch (err: any) {
      setError(err.message || 'Error fetching record');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Loading Candidate Attempt Details...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-rose-200 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-extrabold text-slate-900">Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">{error || 'Attempt record missing.'}</p>
          <Link
            href="/admin/records"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Records</span>
          </Link>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(data.submitted_at).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isPassed = data.percentage >= 50;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/records"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all"
            title="Back to Records"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">Candidate Assessment Attempt Detail</h1>
            <p className="text-xs text-slate-400 font-medium">Record ID: {data.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/records"
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Records</span>
          </Link>
          <Link
            href="/admin/results"
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-all"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Results Ledger</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Candidate & Assessment Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Candidate Information
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-base font-black text-slate-900">{data.candidate_name}</span>
                  {data.attempt_number > 1 && (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-2xs font-extrabold border border-blue-200">
                      Attempt #{data.attempt_number}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{data.candidate_email}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-slate-700">
                  <span className="inline-flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Campus: <strong className="text-slate-900">{data.campus_name}</strong></span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Trainer: <strong className="text-slate-900">{data.trainer_name}</strong></span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium pt-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Submitted: <strong className="text-slate-700">{formattedDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Score & Paper Summary */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Question Paper</div>
                  <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <BookOpenCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{data.question_paper_title}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-2xs font-black uppercase tracking-wider ${
                  isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{isPassed ? 'Passed' : 'Below 5'}</span>
                </span>
              </div>

              <div className="flex items-center justify-around border-t border-slate-200 pt-3">
                <div className="text-center">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Score</div>
                  <div className="text-3xl font-black text-slate-950">
                    {data.score} <span className="text-xs font-bold text-slate-400">/ {data.total_questions}</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Percentage</div>
                  <div className={`text-3xl font-black ${data.percentage >= 80 ? 'text-amber-600' : data.percentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.percentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 text-center text-xs">
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <div className="text-emerald-700 font-bold uppercase tracking-wider text-2xs">Correct</div>
              <div className="text-xl font-black text-emerald-900 mt-0.5">{data.correct_answers}</div>
            </div>

            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200">
              <div className="text-rose-700 font-bold uppercase tracking-wider text-2xs">Incorrect</div>
              <div className="text-xl font-black text-rose-900 mt-0.5">{data.incorrect_answers}</div>
            </div>

            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
              <div className="text-slate-600 font-bold uppercase tracking-wider text-2xs">Unanswered</div>
              <div className="text-xl font-black text-slate-800 mt-0.5">{data.unanswered_answers}</div>
            </div>
          </div>
        </div>

        {/* Detailed Question Responses */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              <span>Candidate Answers Breakdown ({data.review.length} Questions)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {data.review.map((q, idx) => {
              let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
              let statusText = 'Unanswered';

              if (q.status === 'correct') {
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                statusText = '✓ Correct';
              } else if (q.status === 'incorrect') {
                badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                statusText = '✗ Incorrect';
              }

              return (
                <div key={q.id || idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Question #{idx + 1}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold border ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 text-xs leading-relaxed">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-2xs block mb-1">
                        Candidate Answer:
                      </span>
                      <span className={`font-black ${
                        q.status === 'correct' ? 'text-emerald-700' : q.status === 'incorrect' ? 'text-rose-600' : 'text-slate-400 italic'
                      }`}>
                        {q.userAnswerText}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-2xs block mb-1">
                        Correct Answer:
                      </span>
                      <span className="font-black text-emerald-700">
                        {q.correctAnswerText}
                      </span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="text-2xs text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100 font-medium">
                      <strong className="text-blue-900 font-bold">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
