'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ExplorerFolder from '@/components/common/ExplorerFolder';
import {
  FolderTree,
  FolderPlus,
  Search,
  Users,
  FileCheck2,
  Calendar,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Building2,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  LayoutGrid,
  List,
  ChevronRight,
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
  const [viewMode, setViewMode] = useState<'icons' | 'list'>('icons');

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
              <FolderTree className="w-5 h-5 text-amber-500" />
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
          {/* Windows Explorer Style Path & Action Bar */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Address Bar */}
            <div className="flex items-center space-x-2 w-full md:w-auto bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">📁</span>
              <span className="text-xs font-black text-slate-800">Folders</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">{colleges.length} Colleges Total</span>
            </div>

            {/* Search & View Mode Switcher */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full pl-10 pr-4 py-1.5 text-xs font-bold text-slate-800 glossy-input rounded-xl"
                />
              </div>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  onClick={() => setViewMode('icons')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'icons' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Large Icons View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="List Details View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* College Folders Explorer Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading College Folders...</p>
            </div>
          ) : colleges.length === 0 ? (
            <div className="glossy-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                <FolderTree className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">No College Folders</h3>
              <p className="text-xs text-slate-500 font-medium">
                {search ? 'No folder matches your search.' : 'Create your first College Folder to begin organizing.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Create Folder</span>
              </button>
            </div>
          ) : viewMode === 'icons' ? (
            /* Authentic Windows Explorer Folder Icons Grid */
            <div className="glossy-card rounded-3xl p-8 border border-slate-200/90 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
                {colleges.map((col) => (
                  <ExplorerFolder
                    key={col.id}
                    name={col.name}
                    subLabel={col.code || col.folder_id}
                    badge={`${col.student_count || 0} Students • ${col.exam_count || 0} Exams`}
                    onClick={() => router.push(`/admin/folders/${col.id}`)}
                    onRename={() => {
                      setEditCollege(col);
                      setEditName(col.name);
                      setEditCode(col.code || '');
                      setEditDesc(col.description || '');
                    }}
                    onDelete={() => setDeleteTarget(col)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Table List View */
            <div className="glossy-card rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-2xs uppercase tracking-wider font-black text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Folder Name</th>
                      <th className="py-3.5 px-4">Folder ID</th>
                      <th className="py-3.5 px-4 text-center">Students</th>
                      <th className="py-3.5 px-4 text-center">Exams</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {colleges.map((col) => (
                      <tr
                        key={col.id}
                        onClick={() => router.push(`/admin/folders/${col.id}`)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-5 flex items-center space-x-3">
                          <span className="text-xl">📁</span>
                          <div>
                            <p className="font-black text-slate-900">{col.name}</p>
                            {col.code && <p className="text-[10px] text-slate-400 font-bold">{col.code}</p>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600 font-bold text-2xs">
                          {col.folder_id}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          {col.student_count || 0}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                          {col.exam_count || 0}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(col.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setEditCollege(col);
                                setEditName(col.name);
                                setEditCode(col.code || '');
                                setEditDesc(col.description || '');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(col)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE COLLEGE FOLDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📁</span>
                <div>
                  <h3 className="text-base font-black">New College Folder</h3>
                  <p className="text-xs text-amber-100">Auto-generates Student & Exam subfolders</p>
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
                  Folder / College Name <span className="text-rose-500">*</span>
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
                  College Code / Acronym
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
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Campus notes or department remarks..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
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
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black">Rename College Folder</h3>
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
                  Folder Name
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
                  {updating ? 'Saving...' : 'Save'}
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
              <h3 className="text-base font-black text-slate-950">Delete Folder?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong> and all its contents?
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
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
