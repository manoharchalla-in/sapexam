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
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 sm:px-12 py-3.5 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center space-x-3.5">
          <AppLogo size="md" />
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">{portalSettings.portal_title}</h1>
            <p className="text-xs text-slate-500 font-medium">{portalSettings.portal_subtitle}</p>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-2 bg-blue-600"></div>

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-xs">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{portalSettings.portal_assessment_name}</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">{portalSettings.portal_instructions}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  CAMPUS NAME <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5 pt-1">
                  {campusOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setCampusName(opt);
                        if (campusError) setCampusError('');
                      }}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
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
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mr-3"
                      />
                      <span className="text-sm font-bold tracking-wide">{opt}</span>
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  TRAINER NAME <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2.5 pt-1">
                  {trainerOptions.map((opt) => (
                    <label
                      key={opt}
                      onClick={() => {
                        setTrainerName(opt);
                        if (trainerError) setTrainerError('');
                      }}
                      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
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
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mr-3"
                      />
                      <span className="text-sm font-bold tracking-wide">{opt}</span>
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
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed pt-3"
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
        © {new Date().getFullYear()} {portalSettings.portal_title || 'SAP Online Test System'}. All rights reserved.
      </footer>
    </main>
  );
}
