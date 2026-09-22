'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  FolderTree,
  Folder,
  Users,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  Sparkles,
  ChevronRight,
  Loader2,
  UserPlus,
  PlusCircle,
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

export default function CollegeFolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/folders/colleges/${collegeId}`);
        const data = await res.json();
        if (data.success) {
          setCollege(data.college);
        } else {
          router.push('/admin/folders');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (collegeId) load();
  }, [collegeId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar currentRole="Main Super Admin" />
        <div className="flex-1 lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!college) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Glossy Top Bar */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/folders"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Back to Folders"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <span className="text-blue-600 font-extrabold">{college.name}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{college.name}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-2xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Folder ID: {college.folder_id}
            </span>
          </div>
        </header>

        <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
          {/* College Banner Overview */}
          <div className="glossy-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-2xs font-black uppercase tracking-wider text-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>College-Level Isolated Scope</span>
                </div>
                <h2 className="text-2xl font-black">{college.name}</h2>
                <p className="text-xs text-blue-100 leading-relaxed font-medium">
                  {college.description || 'Enterprise Assessment Environment for this institution.'}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-center px-4 py-2.5 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
                  <p className="text-2xs uppercase tracking-wider text-blue-200 font-bold">Students</p>
                  <p className="text-xl font-black">{college.student_count || 0}</p>
                </div>
                <div className="text-center px-4 py-2.5 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/10">
                  <p className="text-2xs uppercase tracking-wider text-blue-200 font-bold">Exams</p>
                  <p className="text-xl font-black">{college.exam_count || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
              Default Auto-Created Folders
            </h3>

            {/* Subfolders Grid (The 2 requested folders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Folder 1: Student Credential Data */}
              <div className="glossy-card rounded-3xl p-6 hover:shadow-xl transition-all duration-200 border border-slate-200/90 flex flex-col justify-between group hover:border-emerald-300">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                      <Users className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-2xs font-black border border-emerald-100">
                      {college.student_count || 0} Records
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center space-x-2">
                      <span>📁 Student Credential Data</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                      Register candidates, manage roll numbers, registration emails, branch/department data, and export student credential rosters.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/admin/folders/${college.id}/students`}
                    className="inline-flex items-center space-x-2 text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all w-full justify-center shadow-2xs"
                  >
                    <span>Open Student Folder</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Folder 2: Exams & Results */}
              <div className="glossy-card rounded-3xl p-6 hover:shadow-xl transition-all duration-200 border border-slate-200/90 flex flex-col justify-between group hover:border-indigo-300">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
                      <FileCheck2 className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-2xs font-black border border-indigo-100">
                      {college.exam_count || 0} Assessments
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center space-x-2">
                      <span>📁 Exams & Results</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                      Create assessment papers, add MCQ questions, publish exam links, track candidate scores, and export detailed evaluation results.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/admin/folders/${college.id}/exams`}
                    className="inline-flex items-center space-x-2 text-xs font-black text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-all w-full justify-center shadow-2xs"
                  >
                    <span>Open Exams & Results</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
