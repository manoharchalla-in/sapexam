'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ExplorerFolder from '@/components/common/ExplorerFolder';
import {
  FolderTree,
  Users,
  FileCheck2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  Sparkles,
  Loader2,
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
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!college) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
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
                <span className="text-amber-600 font-extrabold">{college.name}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-500" />
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

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Windows Explorer Style Address Bar */}
          <div className="glossy-panel p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">📁</span>
              <Link href="/admin/folders" className="text-xs font-bold text-slate-600 hover:text-blue-600">Folders</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black text-slate-900">{college.name}</span>
            </div>

            <div className="text-2xs font-bold text-slate-400">
              2 subfolders automatically created
            </div>
          </div>

          {/* Windows Explorer Folder View Area */}
          <div className="glossy-card rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Institutional Subfolders
              </h3>
              <span className="text-2xs text-slate-400 font-medium">Double-click or click to open</span>
            </div>

            {/* Folder Icons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-start">
              {/* Folder 1: Student Credential Data */}
              <ExplorerFolder
                name="Student Credential Data"
                subLabel="Candidate Registrations"
                badge={`${college.student_count || 0} Records`}
                innerIcon={<Users className="w-4 h-4 text-emerald-600" />}
                onClick={() => router.push(`/admin/folders/${college.id}/students`)}
              />

              {/* Folder 2: Exams & Results */}
              <ExplorerFolder
                name="Exams & Results"
                subLabel="Assessments & Scorecards"
                badge={`${college.exam_count || 0} Assessments`}
                innerIcon={<FileCheck2 className="w-4 h-4 text-indigo-600" />}
                onClick={() => router.push(`/admin/folders/${college.id}/exams`)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
