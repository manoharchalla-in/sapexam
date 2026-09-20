'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  Mail,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
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

interface ResultData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  submitted_at: string;
  review: ReviewItem[];
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.id;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState<boolean>(false);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessment/result/${resultId}`);
      if (!res.ok) throw new Error('Assessment result not found or failed to load.');
      const resultData = await res.json();
      setData(resultData);
    } catch (err: any) {
      setError(err.message || 'Unable to display result.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Loading Result</h2>
          <p className="text-sm text-slate-500 mt-2">Retrieving assessment record...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Result Unavailable</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">{error || 'Result not found.'}</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
        </div>
      </main>
    );
  }

  const isPassed = data.score >= 5;
  const formattedDate = new Date(data.submitted_at).toLocaleString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Main White Result Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-8">
          <div className={`h-3 ${isPassed ? 'bg-emerald-600' : 'bg-amber-600'}`}></div>

          <div className="p-6 sm:p-10">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border ${
                isPassed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Award className="w-8 h-8" />
              </div>

              <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Assessment Completed
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {isPassed ? `Congratulations, ${data.candidate_name}!` : `Assessment Finished, ${data.candidate_name}`}
              </h1>
              <p className="text-sm text-slate-600 mt-1">Your SAP ABAP Assessment Result</p>
            </div>

            {/* Candidate Details Badge */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 mb-8">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">{data.candidate_name}</span>
                {data.attempt_number > 1 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-xs">
                    Attempt #{data.attempt_number}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{data.candidate_email}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Score Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 text-center shadow-md mb-8">
              <div className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-2">
                Final Assessment Score
              </div>
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white mb-1">
                {data.score} <span className="text-2xl sm:text-3xl font-normal text-slate-400">/ {data.total_questions}</span>
              </div>
              <div className="inline-block bg-blue-600 text-white font-bold text-base px-4 py-1 rounded-full mt-2">
                {data.percentage}% Marks
              </div>
            </div>

            {/* Metric Boxes */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                <div className="flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-5 h-5 mr-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Correct</span>
                </div>
                <div className="text-2xl font-black text-emerald-900">{data.correct_answers}</div>
                <div className="text-xs text-emerald-700 font-medium">Answers</div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
                <div className="flex items-center justify-center text-red-600 mb-1">
                  <XCircle className="w-5 h-5 mr-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Incorrect</span>
                </div>
                <div className="text-2xl font-black text-red-900">{data.incorrect_answers}</div>
                <div className="text-xs text-red-700 font-medium">Answers</div>
              </div>

              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 text-center">
                <div className="flex items-center justify-center text-slate-500 mb-1">
                  <HelpCircle className="w-5 h-5 mr-1" />
                  <span className="text-xs font-bold uppercase tracking-wider">Unanswered</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{data.unanswered_answers}</div>
                <div className="text-xs text-slate-600 font-medium">Questions</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowReview(!showReview)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>{showReview ? 'Hide Answer Review' : 'View Answer Review'}</span>
                {showReview ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl border border-slate-300 transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Take Another Test</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Review Section */}
        {showReview && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Detailed Answer Review</span>
            </h2>

            <div className="space-y-6">
              {data.review.map((item, idx) => {
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
                let statusLabel = 'Unanswered';

                if (item.status === 'correct') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  statusLabel = '✓ Correct';
                } else if (item.status === 'incorrect') {
                  badgeClass = 'bg-red-100 text-red-800 border-red-300';
                  statusLabel = '✗ Incorrect';
                }

                return (
                  <div key={item.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200/90 text-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="font-bold text-slate-900 text-base">Question {idx + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-slate-800 font-semibold mb-4 leading-relaxed">{item.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-slate-200 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-500 font-semibold block mb-1">Your Answer:</span>
                        <span className={`font-bold ${
                          item.status === 'correct' ? 'text-emerald-700' : item.status === 'incorrect' ? 'text-red-600' : 'text-slate-400 italic'
                        }`}>
                          {item.userAnswerText}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 font-semibold block mb-1">Correct Answer:</span>
                        <span className="font-bold text-emerald-700">{item.correctAnswerText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white mt-12">
        © 2026 SAP ABAP Online Test System. All rights reserved.
      </footer>
    </main>
  );
}
