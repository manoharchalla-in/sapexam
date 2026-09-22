'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ExplorerFolder from '@/components/common/ExplorerFolder';
import {
  FolderTree,
  Building2,
  Users,
  FileCheck2,
  Award,
  Search,
  PlusCircle,
  ArrowRight,
  LogOut,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface College {
  id: number;
  folder_id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
  student_count?: number;
  exam_count?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New College Modal
  const [isNewCollegeOpen, setIsNewCollegeOpen] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [collegeDescription, setCollegeDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/folders/colleges', window.location.origin);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setColleges(data.colleges || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim()) {
      setCreateError('Institution / College Name is required');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/folders/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collegeName.trim(),
          code: collegeCode.trim() || undefined,
          description: collegeDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.college) {
        setIsNewCollegeOpen(false);
        setCollegeName('');
        setCollegeCode('');
        setCollegeDescription('');
        fetchColleges();
        router.push(`/admin/folders/${data.college.id}`);
      } else {
        setCreateError(data.message || 'Failed to create college folder');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating college folder');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const totalStudents = colleges.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const totalExams = colleges.reduce((acc, c) => acc + (c.exam_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black text-slate-950 leading-tight">
                  Institutional Folders Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>Enterprise Workspaces</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Centralized College Workspaces • Student Credential Data • Exam Papers (Q&P) • Results
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsNewCollegeOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New College Folder</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <div className="w-full px-6 md:px-8 py-6 space-y-6 min-w-0">
          {/* Institutional Stats Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glossy-card rounded-3xl p-5 border border-slate-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Institutional Folders
                </span>
                <div className="text-3xl font-black text-slate-950 mt-1 tracking-tight">
                  {colleges.length}
                </div>
                <span className="text-[11px] text-blue-600 font-bold mt-0.5 inline-block">
                  Active College Workspaces
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                <FolderTree className="w-6 h-6" />
              </div>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-emerald-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800 block">
                  Candidate Credentials
                </span>
                <div className="text-3xl font-black text-emerald-700 mt-1 tracking-tight">
                  {totalStudents}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold mt-0.5 inline-block">
                  Enrolled Students
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glossy-card rounded-3xl p-5 border border-indigo-200/80 shadow-2xs bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 flex items-center justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-800 block">
                  Question Papers (Q&P)
                </span>
                <div className="text-3xl font-black text-indigo-700 mt-1 tracking-tight">
                  {totalExams}
                </div>
                <span className="text-[11px] text-indigo-600 font-bold mt-0.5 inline-block">
                  Authored Assessments
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Windows Explorer Style Institutional Folders Hub */}
          <div className="glossy-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                  <span>📁</span>
                  <span>Institutional Workspaces Directory</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Click any college folder to manage candidate credentials, question papers, and results.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search college folder name..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-bold text-slate-800 glossy-input rounded-xl"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-slate-500">Loading Institutional Folders...</p>
              </div>
            ) : colleges.length === 0 ? (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                  <FolderTree className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-slate-900">No College Folders Found</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Create your first institutional workspace to begin managing students and question papers.
                </p>
                <button
                  onClick={() => setIsNewCollegeOpen(true)}
                  className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Create College Folder</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center pt-2">
                {colleges.map((col) => (
                  <ExplorerFolder
                    key={col.id}
                    name={col.name}
                    subLabel={col.folder_id}
                    badge={`${col.student_count || 0} Students • ${col.exam_count || 0} Exams`}
                    innerIcon={<Building2 className="w-4 h-4 text-amber-600" />}
                    onClick={() => router.push(`/admin/folders/${col.id}`)}
                  />
                ))}

                {/* Add New College Tile */}
                <div
                  onClick={() => setIsNewCollegeOpen(true)}
                  className="group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer text-center w-32 h-36 space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">
                    + New Folder
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE COLLEGE FOLDER MODAL */}
      {isNewCollegeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black">Create Institutional Folder</h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Creates an isolated folder with Students, Exams, and Results
                  </p>
                </div>
              </div>
              <button onClick={() => setIsNewCollegeOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollege} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  College / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. Acharya Nagarjuna University"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Institution Code / Short Name
                </label>
                <input
                  type="text"
                  value={collegeCode}
                  onChange={(e) => setCollegeCode(e.target.value)}
                  placeholder="e.g. ANU"
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase glossy-input text-slate-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={collegeDescription}
                  onChange={(e) => setCollegeDescription(e.target.value)}
                  placeholder="Optional institutional notes or department details..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewCollegeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{creating ? 'Creating...' : 'Create Folder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
