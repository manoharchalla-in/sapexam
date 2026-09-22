'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateCandidateInput } from '@/lib/validation';
import { User, Mail, ArrowRight, BookOpenCheck } from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

const CAMPUS_OPTIONS = ['CITY', 'CIET'];

export default function CandidateLoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [campusName, setCampusName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  
  const [campusOptions, setCampusOptions] = useState<string[]>(['CITY', 'CIET']);
  const [trainerOptions, setTrainerOptions] = useState<string[]>(['APPALARAJU', 'NOOKARAJU', 'DAKSHAYINI', 'NANI']);
  const [portalSettings, setPortalSettings] = useState({
    portal_title: 'SAP Learning Portal',
    portal_subtitle: 'Enterprise Skill Assessment System',
    portal_assessment_name: 'SAP ABAP Assessment',
    portal_instructions: 'Enter your details to begin the assessment.',
  });

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [campusError, setCampusError] = useState('');
  const [trainerError, setTrainerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        // Load Trainers
        const trRes = await fetch('/api/admin/trainers');
        if (trRes.ok) {
          const data = await trRes.json();
          if (data.trainers && data.trainers.length > 0) {
            setTrainerOptions(data.trainers.map((t: any) => t.display_name));
          }
        }

        // Load Campuses
        const cpRes = await fetch('/api/admin/campuses');
        if (cpRes.ok) {
          const data = await cpRes.json();
          if (data.campuses && data.campuses.length > 0) {
            setCampusOptions(data.campuses.map((c: any) => c.name));
          }
        }

        // Load Portal Settings
        const stRes = await fetch('/api/admin/settings');
        if (stRes.ok) {
          const data = await stRes.json();
          if (data.settings) {
            setPortalSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (err) {
        console.error('Failed to load landing page options', err);
      }
    }
    loadData();
  }, []);

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

    if (!valid) return;

    setIsSubmitting(true);

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionData = {
      name: validation.cleanName,
      email: validation.cleanEmail,
      campusName: campusName,
      trainerName: trainerName,
      sessionId,
      startedAt: new Date().toISOString(),
      paperTitle: portalSettings.portal_assessment_name || 'SAP ABAP Assessment',
    };

    sessionStorage.setItem('sap_assessment_session', JSON.stringify(sessionData));
    router.push('/test');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 flex flex-col justify-between font-sans antialiased text-slate-800">
      {/* Glossy Top Header */}
      <header className="glossy-header px-6 sm:px-12 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3.5">
          <AppLogo size="md" />
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">{portalSettings.portal_title}</h1>
            <p className="text-xs text-slate-500 font-medium">{portalSettings.portal_subtitle}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-2xs font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Candidate Portal Active</span>
        </div>
      </header>

      {/* Main Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg glossy-card rounded-3xl overflow-hidden relative">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"></div>

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/50 text-blue-600 mb-4 border border-blue-100/80 shadow-xs">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">{portalSettings.portal_assessment_name}</h2>
              <p className="text-xs text-slate-500 mt-2 font-medium max-w-md mx-auto">{portalSettings.portal_instructions}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Enter candidate full name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 glossy-input ${
                      nameError
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                        : ''
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {nameError && (
                  <p className="text-2xs font-bold text-rose-600 mt-1.5 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="emailAddress" className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="emailAddress"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="candidate@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 glossy-input ${
                      emailError
                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                        : ''
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {emailError && (
                  <p className="text-2xs font-bold text-rose-600 mt-1.5 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* CAMPUS NAME * Radio Group */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <label className="block text-2xs font-black text-slate-900 uppercase tracking-wider">
                  Campus Name <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {campusOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setCampusName(opt);
                        if (campusError) setCampusError('');
                      }}
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                        campusName === opt
                          ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-black shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50'
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
                        className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mr-2.5"
                      />
                      <span className="text-xs tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
                {campusError && (
                  <p className="text-2xs font-bold text-rose-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{campusError}</span>
                  </p>
                )}
              </div>

              {/* TRAINER NAME * Radio Group */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <label className="block text-2xs font-black text-slate-900 uppercase tracking-wider">
                  Trainer Name <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {trainerOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setTrainerName(opt);
                        if (trainerError) setTrainerError('');
                      }}
                      className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                        trainerName === opt
                          ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 font-black shadow-xs ring-1 ring-indigo-500/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50'
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
                        className="w-3.5 h-3.5 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer mr-2.5"
                      />
                      <span className="text-xs tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
                {trainerError && (
                  <p className="text-2xs font-bold text-rose-600 mt-1 flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{trainerError}</span>
                  </p>
                )}
              </div>

              {/* Start Assessment Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full glossy-button-primary text-white font-black py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                <span>{isSubmitting ? 'Starting Assessment...' : 'Start Assessment'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
        © {new Date().getFullYear()} {portalSettings.portal_title || 'SAP Online Test System'}. All rights reserved.
      </footer>
    </main>
  );
}
