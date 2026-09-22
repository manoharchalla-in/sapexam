'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  FolderTree,
  Folder,
  FolderPlus,
  Search,
  Users,
  FileCheck2,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
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

export default function FoldersDashboardPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit/Rename Modal
  const [editCollege, setEditCollege] = useState<College | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<College | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/folders/colleges?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setColleges(data.colleges || []);
      }
    } catch (err) {
      console.error('Error fetching colleges', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('College Name is required');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/folders/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim(),
          description: newDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        setNewName('');
        setNewCode('');
        setNewDesc('');
        fetchColleges();
      } else {
        setCreateError(data.message || 'Failed to create college');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCollege || !editName.trim()) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${editCollege.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim(),
          description: editDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditCollege(null);
        fetchColleges();
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchColleges();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const totalStudents = colleges.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const totalExams = colleges.reduce((sum, c) => sum + (c.exam_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Glossy Header Bar */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div>
            <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <span>Admin</span>
              <span>/</span>
              <span className="text-blue-600 font-extrabold">Folders Management</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
              <FolderTree className="w-5 h-5 text-blue-600" />
              <span>College Folders Hub</span>
            </h1>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Create College Folder</span>
          </button>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glossy-card p-4 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-bold text-slate-400 uppercase">College Folders</p>
                <p className="text-2xl font-black text-slate-900">{colleges.length}</p>
              </div>
            </div>

            <div className="glossy-card p-4 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-bold text-slate-400 uppercase">Registered Students</p>
                <p className="text-2xl font-black text-slate-900">{totalStudents}</p>
              </div>
            </div>

            <div className="glossy-card p-4 rounded-2xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xs font-bold text-slate-400 uppercase">Assessment Exams</p>
                <p className="text-2xl font-black text-slate-900">{totalExams}</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="glossy-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colleges by name or folder ID..."
                className="w-full pl-10 pr-4 py-2 text-xs font-bold text-slate-800 glossy-input rounded-xl"
              />
            </div>
            <p className="text-xs font-bold text-slate-500">
              Showing <span className="text-blue-600">{colleges.length}</span> college folder{colleges.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* College Folders Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading College Folders...</p>
            </div>
          ) : colleges.length === 0 ? (
            <div className="glossy-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <FolderTree className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No College Folders Found</h3>
              <p className="text-xs text-slate-500 font-medium">
                {search ? 'No college matches your search query.' : 'Get started by creating your first College Folder.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Create First College</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {colleges.map((col) => (
                <div
                  key={col.id}
                  className="glossy-card rounded-2xl p-5 hover:shadow-lg transition-all duration-200 border border-slate-200/90 flex flex-col justify-between group hover:border-blue-300"
                >
                  <div className="space-y-4">
                    {/* Top folder title & action menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Folder className="w-6 h-6 fill-white/20" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-sm font-black text-slate-950 truncate group-hover:text-blue-600 transition-colors">
                            {col.name}
                          </h2>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {col.folder_id}
                            </span>
                            {col.code && (
                              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                {col.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditCollege(col);
                            setEditName(col.name);
                            setEditCode(col.code || '');
                            setEditDesc(col.description || '');
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Rename / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(col)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {col.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                        {col.description}
                      </p>
                    )}

                    {/* Auto-created subfolders preview */}
                    <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between text-2xs font-extrabold text-slate-700">
                        <span className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>📁 Student Credential Data</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-100">
                          {col.student_count || 0} Students
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-2xs font-extrabold text-slate-700">
                        <span className="flex items-center space-x-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>📁 Exams & Results</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black border border-indigo-100">
                          {col.exam_count || 0} Exams
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Created {new Date(col.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <Link
                      href={`/admin/folders/${col.id}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      <span>Open Folder</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE COLLEGE FOLDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <FolderPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Create College Folder</h3>
                  <p className="text-xs text-blue-100">Auto-generates Student & Exam subfolders</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  College Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. KL University, Vignan University"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  College Code / Acronym (Optional)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. KLU, VU, ANU"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief notes regarding campus, batches, or location..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-2xs font-bold text-blue-900 space-y-1">
                <p className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Automatic Subfolder Generation:</span>
                </p>
                <p className="text-slate-600 font-medium">
                  • 📁 <span className="font-bold">Student Credential Data</span> (Registration & Records)<br />
                  • 📁 <span className="font-bold">Exams & Results</span> (Exam Papers & Attempt Analytics)
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50 shadow-md"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                  <span>{creating ? 'Creating...' : 'Create Folder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME / EDIT MODAL */}
      {editCollege && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black">Edit College Folder</h3>
              </div>
              <button
                onClick={() => setEditCollege(null)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  College Code
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditCollege(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">Delete College Folder?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-900">{deleteTarget.name}</strong>?
                This will delete all contained student credentials, exams, questions, and attempt records.
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
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
