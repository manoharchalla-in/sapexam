'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLogo from '@/components/common/AppLogo';
import {
  UserPlus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CollegeMeta {
  id: number;
  folder_id: string;
  name: string;
  code: string;
  description: string;
}

export default function PublicStudentRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const collegeSlug = params.college as string;

  const [college, setCollege] = useState<CollegeMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    registration_number: '',
    email: '',
    mobile: '',
    department: 'Computer Science & Engineering',
    branch: 'CSE',
    year: '4th Year',
    section: 'A',
    gender: 'Male',
    dob: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [registeredStudent, setRegisteredStudent] = useState<any>(null);

  useEffect(() => {
    async function loadCollege() {
      try {
        setLoading(true);
        const res = await fetch(`/api/register/${collegeSlug}`);
        const data = await res.json();
        if (data.success && data.college) {
          setCollege(data.college);
        } else {
          setLoadError(data.message || 'Institutional registration link not found');
        }
      } catch (err: any) {
        setLoadError('Failed to load institution registration details.');
      } finally {
        setLoading(false);
      }
    }
    if (collegeSlug) loadCollege();
  }, [collegeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.roll_number.trim() || !formData.email.trim()) {
      setFormError('Please fill in all mandatory fields (Name, Roll Number, Email).');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/register/${collegeSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.student) {
        setRegisteredStudent(data.student);
      } else {
        setFormError(data.message || 'Registration failed. Please check your information.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading Registration Portal...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md glossy-card rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Registration Link Unavailable</h2>
          <p className="text-xs text-slate-500 font-medium">{loadError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="glossy-header px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <AppLogo size="md" />
          <div>
            <h1 className="text-sm font-black text-slate-900">{college?.name}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Candidate Registration Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-2xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Self-Registration Open</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl glossy-card rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 relative">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />

          {registeredStudent ? (
            /* SUCCESS SCREEN */
            <div className="p-8 sm:p-12 text-center space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Registration Successful
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  Welcome, {registeredStudent.name}!
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                  Your credentials are now registered in the <strong>{college?.name}</strong> database.
                </p>
              </div>

              {/* Registration Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-900">{registeredStudent.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Roll Number:</span>
                  <span className="font-mono font-black text-slate-900">{registeredStudent.roll_number}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-medium">Registered Email:</span>
                  <span className="font-bold text-slate-900">{registeredStudent.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Institution:</span>
                  <span className="font-bold text-emerald-800">{college?.name}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                You can now use your Roll Number (<strong>{registeredStudent.roll_number}</strong>) to access any assessments or exams shared by your college.
              </p>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <div className="p-6 sm:p-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs mb-1">
                  <UserPlus className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Student Credential Registration
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  Register your student profile for <strong>{college?.name}</strong> to gain access to upcoming assessments and exams.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Manohar Challa"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 glossy-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Roll Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
                      placeholder="e.g. 23HT1A0501"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 glossy-input"
                      required
                    />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Registration / Hall Ticket No
                    </label>
                    <input
                      type="text"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      placeholder="e.g. REG2024001"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                        placeholder="student@college.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 glossy-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Branch / Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. CSE, AI&ML, IT"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase text-slate-900 glossy-input"
                    />
                  </div>

                  {/* Year & Section */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                      placeholder="e.g. A, B, C"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase text-slate-900 glossy-input"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-900 glossy-input"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full glossy-button-primary text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{submitting ? 'Registering...' : 'Register Student Credentials'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-400 bg-white/60 border-t border-slate-200/80">
        © {new Date().getFullYear()} {college?.name} • SAP Enterprise Assessment Portal
      </footer>
    </main>
  );
}
