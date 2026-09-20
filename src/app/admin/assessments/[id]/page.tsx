'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Building2,
  Clock,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface ReviewItem {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  userAnswerKey: string | null;
  userAnswerText: string;
  correctAnswerKey: string;
  correctAnswerText: string;
  status: 'correct' | 'incorrect' | 'unanswered';
}

interface AdminDetailData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_city: string;
  candidate_ciet: string;
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
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">Loading Candidate Attempt Details...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Record Not Found</h2>
          <p className="text-xs text-slate-600 mt-1 mb-6">{error || 'Attempt record missing.'}</p>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Panel</span>
          </Link>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(data.submitted_at).toLocaleString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-all"
            title="Back to Admin Panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Candidate Result Detail</h1>
            <p className="text-xs text-slate-500">ID: {data.id}</p>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to List</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Candidate & Assessment Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Candidate Information
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-extrabold text-slate-900">{data.candidate_name}</span>
                  {data.attempt_number > 1 && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                      Attempt #{data.attempt_number}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{data.candidate_email}</span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>City: <strong>{data.candidate_city}</strong></span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>CIET: <strong>{data.candidate_ciet}</strong></span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Submitted: <strong>{formattedDate}</strong></span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-around">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Score</div>
                <div className="text-4xl font-black text-slate-900">{data.score} <span className="text-lg font-normal text-slate-400">/ 10</span></div>
              </div>

              <div className="h-12 w-px bg-slate-200"></div>

              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Percentage</div>
                <div className="text-4xl font-black text-blue-600">{data.percentage}%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs sm:text-sm">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <div className="text-emerald-700 font-bold uppercase tracking-wider text-xs">Correct Answers</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{data.correct_answers}</div>
            </div>

            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <div className="text-red-700 font-bold uppercase tracking-wider text-xs">Incorrect Answers</div>
              <div className="text-2xl font-black text-red-900 mt-1">{data.incorrect_answers}</div>
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-600 font-bold uppercase tracking-wider text-xs">Unanswered</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{data.unanswered_answers}</div>
            </div>
          </div>
        </div>

        {/* Detailed Responses */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Submitted Question Breakdown</span>
          </h2>

          <div className="space-y-6">
            {data.review.map((q, idx) => {
              let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
              let statusText = 'Unanswered';

              if (q.status === 'correct') {
                badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                statusText = '✓ Correct';
              } else if (q.status === 'incorrect') {
                badgeClass = 'bg-red-100 text-red-800 border-red-300';
                statusText = '✗ Incorrect';
              }

              return (
                <div key={q.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="font-extrabold text-slate-900 text-base">Q{idx + 1}.</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>

                  <p className="font-bold text-slate-800 mb-3 text-sm leading-snug">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block mb-1">
                        Candidate Answer:
                      </span>
                      <span className={`font-extrabold ${
                        q.status === 'correct' ? 'text-emerald-700' : q.status === 'incorrect' ? 'text-red-600' : 'text-slate-400 italic'
                      }`}>
                        {q.userAnswerText}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block mb-1">
                        Correct Answer:
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {q.correctAnswerText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
