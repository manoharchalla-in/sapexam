'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { validateCandidateInput } from '@/lib/validation';
import { User, Mail, ArrowRight, BookOpenCheck, AlertCircle, Clock, Award, FileText } from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

const CAMPUS_OPTIONS = ['CITY', 'CIET'];

export default function ExamLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token || '';
  const router = useRouter();

  const [paper, setPaper] = useState<{
    id: number;
    title: string;
    description: string;
    category: string;
    duration_minutes: number;
    passing_marks: number;
    max_marks: number;
    total_questions: number;
  } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [campusName, setCampusName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [campusOptions, setCampusOptions] = useState<string[]>(['CITY', 'CIET']);
  const [trainerOptions, setTrainerOptions] = useState<string[]>(['APPALARAJU', 'NOOKARAJU', 'DAKSHAYINI', 'NANI']);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [campusError, setCampusError] = useState('');
  const [trainerError, setTrainerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unavailableError, setUnavailableError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPaperAndTrainers() {
      setLoading(true);
      try {
        // Fetch Question Paper info
        const qpRes = await fetch(`/api/assessment/questions?token=${encodeURIComponent(token)}`);
        if (!qpRes.ok) {
          const errData = await qpRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Assessment link is invalid or expired.');
        }
        const qpData = await qpRes.json();
        setPaper(qpData.questionPaper);

        // Fetch Trainers
        const trRes = await fetch('/api/admin/trainers');
        if (trRes.ok) {
          const trData = await trRes.json();
          if (trData.trainers && trData.trainers.length > 0) {
            setTrainerOptions(trData.trainers.map((t: any) => t.display_name));
          }
        }

        // Fetch Campuses
        const cpRes = await fetch('/api/admin/campuses');
        if (cpRes.ok) {
          const cpData = await cpRes.json();
          if (cpData.campuses && cpData.campuses.length > 0) {
            setCampusOptions(cpData.campuses.map((c: any) => c.name));
          }
        }
      } catch (err: any) {
        setUnavailableError(err.message || 'This assessment is currently unavailable.');
      } finally {
        setLoading(false);
      }
    }
    loadPaperAndTrainers();
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setCampusError('');
    setTrainerError('');

    let valid = true;
    const validation = validateCandidateInput(name, email);

    if (!validation.isValid) {
      if (validation.nameError) setNameError(validation.nameError);
      if (validation.emailError) setEmailError(validation.emailError);
      valid = false;
    }

    if (!campusName) {
      setCampusError('Please select Campus Name');
      valid = false;
    }

    if (!trainerName) {
      setTrainerError('Please select Trainer Name');
      valid = false;
    }

    if (!valid || !paper) return;

    setIsSubmitting(true);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionData = {
      name: validation.cleanName,
      email: validation.cleanEmail,
      campusName: campusName,
      trainerName: trainerName,
      token: token,
      paperId: paper.id,
      paperTitle: paper.title,
      durationMinutes: paper.duration_minutes,
      sessionId,
      startedAt: new Date().toISOString(),
    };

    sessionStorage.setItem('sap_assessment_session', JSON.stringify(sessionData));
    router.push('/test');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <BookOpenCheck className="w-10 h-10 text-blue-600 animate-pulse mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Assessment...</p>
        </div>
      </main>
    );
  }

  if (unavailableError || !paper) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Assessment Unavailable</h2>
          <p className="text-sm text-slate-600 font-medium">
            {unavailableError || 'This assessment link is invalid, expired, or unpublished by the administrator.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-slate-800 transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 sm:px-12 py-3.5 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center space-x-3.5">
          <AppLogo size="md" />
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">SAP Learning Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Skill Assessment System</p>
          </div>
        </div>
      </header>

      {/* Landing Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-2 bg-blue-600"></div>

          <div className="p-8 sm:p-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-100 shadow-xs">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{paper.title}</h2>
              {paper.description && (
                <p className="text-xs text-slate-500 mt-1 font-medium">{paper.description}</p>
              )}
            </div>

            {/* Exam Meta Badge Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-6 text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold flex items-center justify-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Questions</span>
                </span>
                <span className="font-bold text-slate-900 text-sm">{paper.total_questions} Qs</span>
              </div>

              <div className="space-y-0.5 border-x border-slate-200">
                <span className="text-slate-400 font-semibold flex items-center justify-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Duration</span>
                </span>
                <span className="font-bold text-slate-900 text-sm">{paper.duration_minutes} Mins</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold flex items-center justify-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pass Mark</span>
                </span>
                <span className="font-bold text-slate-900 text-sm">{paper.passing_marks} / {paper.max_marks}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder=""
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none transition-all duration-200 ${
                      nameError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {nameError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="emailAddress" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="emailAddress"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder=""
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none transition-all duration-200 ${
                      emailError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {emailError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* CAMPUS NAME * Radio Group */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  CAMPUS NAME <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {campusOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setCampusName(opt);
                        if (campusError) setCampusError('');
                      }}
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                        campusName === opt
                          ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="campusNameGroup"
                        value={opt}
                        checked={campusName === opt}
                        onChange={() => {
                          setCampusName(opt);
                          if (campusError) setCampusError('');
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mr-2"
                      />
                      <span className="text-xs font-bold tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
                {campusError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{campusError}</span>
                  </p>
                )}
              </div>

              {/* TRAINER NAME * Radio Group */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  TRAINER NAME <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {trainerOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setTrainerName(opt);
                        if (trainerError) setTrainerError('');
                      }}
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                        trainerName === opt
                          ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trainerNameGroup"
                        value={opt}
                        checked={trainerName === opt}
                        onChange={() => {
                          setTrainerName(opt);
                          if (trainerError) setTrainerError('');
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mr-2"
                      />
                      <span className="text-xs font-bold tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
                {trainerError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{trainerError}</span>
                  </p>
                )}
              </div>

              {/* Start Assessment Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed pt-3"
              >
                <span>{isSubmitting ? 'Starting Assessment...' : 'Start Assessment'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © 2026 SAP ABAP Online Test System. All rights reserved.
      </footer>
    </main>
  );
}
