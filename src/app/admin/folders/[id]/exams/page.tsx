'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ExplorerFolder from '@/components/common/ExplorerFolder';
import {
  FileCheck2,
  PlusCircle,
  ArrowLeft,
  ChevronRight,
  Copy,
  Check,
  Edit2,
  Trash2,
  Users,
  Eye,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Building2,
  LayoutGrid,
  List,
} from 'lucide-react';

interface College {
  id: number;
  folder_id: string;
  name: string;
  code: string;
}

interface CollegeExam {
  id: number;
  college_id: number;
  college_name?: string;
  name: string;
  code: string;
  subject: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  passing_marks: number;
  instructions: string;
  status: 'Draft' | 'Published' | 'Closed';
  public_token: string;
  created_at: string;
  question_count?: number;
  attempt_count?: number;
  pass_count?: number;
  fail_count?: number;
  avg_score?: number;
}

export default function ExamsAndResultsFolderPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [exams, setExams] = useState<CollegeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'icons' | 'cards'>('icons');

  // Modals
  const [isNewExamOpen, setIsNewExamOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    code: '',
    subject: 'SAP ABAP Programming',
    description: '',
    duration_minutes: 30,
    total_questions: 10,
    total_marks: 10,
    passing_marks: 5,
    instructions: 'Answer all questions. Multiple attempts are not allowed.',
    status: 'Published' as 'Draft' | 'Published',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Share Modal / Copied state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollegeExam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`);
      const data = await res.json();
      if (data.success) {
        setCollege(data.college);
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) fetchExams();
  }, [collegeId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) {
      setCreateError('Exam Name is required');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewExamOpen(false);
        setExamForm({
          name: '',
          code: '',
          subject: 'SAP ABAP Programming',
          description: '',
          duration_minutes: 30,
          total_questions: 10,
          total_marks: 10,
          passing_marks: 5,
          instructions: 'Answer all questions. Multiple attempts are not allowed.',
          status: 'Published',
        });
        fetchExams();
      } else {
        setCreateError(data.message || 'Failed to create exam');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating exam');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams?examId=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchExams();
      } else {
        alert(data.message || 'Failed to delete exam');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const copyExamLink = (examItem: CollegeExam) => {
    const colSlug = (college?.name || 'college')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const exSlug = (examItem.name || 'exam')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const link = `${window.location.origin}/exam/${colSlug}/${exSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(examItem.public_token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/folders/${collegeId}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{college?.name || 'College'}</Link>
                <span>/</span>
                <span className="text-indigo-600 font-extrabold">Exam Papers</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Exam Papers</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsNewExamOpen(true)}
              className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Exam Paper</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Quick Subfolder Switcher Bar */}
          <div className="glossy-panel p-2 rounded-2xl flex items-center space-x-2">
            <Link
              href={`/admin/folders/${collegeId}/students`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center space-x-2"
            >
              <span>📁</span>
              <span>Student Credential Data</span>
            </Link>
            <div className="px-3.5 py-2 rounded-xl text-xs font-black text-indigo-900 bg-indigo-100/70 border border-indigo-200 shadow-2xs flex items-center space-x-2">
              <span>📁</span>
              <span>Exam Papers</span>
            </div>
            <Link
              href={`/admin/folders/${collegeId}/results`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors flex items-center space-x-2"
            >
              <span>📁</span>
              <span>Results Folder</span>
            </Link>
          </div>

          {/* Windows Explorer Style Address & View Bar */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">📁</span>
              <Link href="/admin/folders" className="text-xs font-bold text-slate-600 hover:text-blue-600">Folders</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/admin/folders/${collegeId}`} className="text-xs font-bold text-slate-600 hover:text-blue-600">{college?.name}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black text-slate-900">Exam Papers</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setViewMode('icons')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'icons' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Folder Icons View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Cards Details View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Exams Folder Explorer View */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading Assessments...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="glossy-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No Exams Created</h3>
              <p className="text-xs text-slate-500 font-medium">
                Create a new exam to automatically generate the <strong>Exam Paper</strong> and <strong>Results</strong> folders.
              </p>
              <button
                onClick={() => setIsNewExamOpen(true)}
                className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create First Exam</span>
              </button>
            </div>
          ) : viewMode === 'icons' ? (
            /* Authentic Folder Explorer Icons Grid */
            <div className="glossy-card rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Assessment Folders ({exams.length})
                </h3>
                <span className="text-2xs text-slate-400">Click folder to open Exam Paper & Results</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center pt-2">
                {exams.map((exam) => (
                  <ExplorerFolder
                    key={exam.id}
                    name={exam.name}
                    subLabel={exam.code || `${exam.duration_minutes} Mins`}
                    badge={`${exam.question_count || 0} Qs • ${exam.attempt_count || 0} Submissions`}
                    innerIcon={<FileCode className="w-4 h-4 text-amber-600" />}
                    onClick={() => router.push(`/admin/folders/${collegeId}/exams/${exam.id}`)}
                    onDelete={() => setDeleteTarget(exam)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Cards Details View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="glossy-card rounded-3xl p-6 border border-slate-200/90 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider border ${
                              exam.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {exam.status}
                          </span>
                          {exam.code && (
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {exam.code}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                          {exam.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{exam.subject}</p>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => setDeleteTarget(exam)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-800">
                          <span className="text-base">📁</span>
                          <span>Exam Paper ({exam.question_count || 0} Questions)</span>
                        </div>
                        <Link
                          href={`/admin/folders/${collegeId}/exams/${exam.id}?tab=paper`}
                          className="text-2xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Manage Questions →
                        </Link>
                      </div>

                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200/90 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-800">
                          <span className="text-base">📁</span>
                          <span>Results ({exam.attempt_count || 0} Submissions)</span>
                        </div>
                        <Link
                          href={`/admin/folders/${collegeId}/exams/${exam.id}?tab=results`}
                          className="text-2xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          View Results →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => copyExamLink(exam)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-2xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/80"
                    >
                      {copiedToken === exam.public_token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/admin/folders/${collegeId}/exams/${exam.id}`}
                      className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl"
                    >
                      Open Exam Folder →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* NEW EXAM CREATION MODAL */}
      {isNewExamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📁</span>
                <div>
                  <h3 className="text-base font-black">New Assessment Exam Folder</h3>
                  <p className="text-xs text-amber-100">Auto-generates Exam Paper & Results subfolders</p>
                </div>
              </div>
              <button onClick={() => setIsNewExamOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4 overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Exam Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  placeholder="e.g. SAP ABAP Assessment 2026, Core Java Screening"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Code
                  </label>
                  <input
                    type="text"
                    value={examForm.code}
                    onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                    placeholder="e.g. SAP-ABAP-101"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    placeholder="e.g. SAP ABAP Programming"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium glossy-input text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value, 10) || 30 })}
                    min={5}
                    max={180}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={examForm.total_marks}
                    onChange={(e) => setExamForm({ ...examForm, total_marks: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={examForm.passing_marks}
                    onChange={(e) => setExamForm({ ...examForm, passing_marks: parseFloat(e.target.value) || 5 })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Instructions for Students
                </label>
                <textarea
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewExamOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50 shadow-md"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{creating ? 'Creating...' : 'Create Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EXAM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Delete Exam Folder?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
