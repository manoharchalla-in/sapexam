'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  Copy,
  Check,
  Edit,
  Eye,
  Trash2,
  Share2,
  CheckCircle,
  Clock,
  Award,
  Users,
  ArrowLeft,
  Loader2,
  LogOut,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

interface QuestionPaper {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  passing_marks: number;
  max_marks: number;
  status: 'Draft' | 'Published' | 'Unpublished' | 'Archived';
  public_token: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  attempt_count?: number;
}

import AdminSidebar from '@/components/admin/AdminSidebar';

export default function QuestionPapersListPage() {
  const router = useRouter();
  // ... rest of state ...
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModalPaper, setDeleteModalPaper] = useState<QuestionPaper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/question-papers');
      if (res.status === 401) {
        setAuthError(true);
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch question papers');
      const data = await res.json();
      setPapers(data.questionPapers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleCopyExamLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/exam/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleToggleStatus = async (paper: QuestionPaper, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paper.id, status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to update status');
      } else {
        fetchPapers();
      }
    } catch (err) {
      alert('Error updating question paper status');
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteModalPaper) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModalPaper.id }),
      });
      if (res.ok) {
        setDeleteModalPaper(null);
        fetchPapers();
      } else {
        alert('Failed to delete question paper');
      }
    } catch (err) {
      alert('Error deleting paper');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (authError) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-all"
            title="Back to Admin Panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs tracking-wider shadow-xs flex items-center space-x-1.5">
            <FileCode className="w-4 h-4" />
            <span>Q&P MODULE</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Question Papers Management</h1>
            <p className="text-xs text-slate-500 font-medium">Create, Edit, Publish and Share Exam Links</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/qp/create"
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question Paper</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">All Statuses ({papers.length})</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredPapers.length}</strong> question papers
          </div>
        </div>

        {/* Papers List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading Question Papers...</p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="p-12 text-center">
              <FileCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Question Papers Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium mb-4">
                Get started by creating your first dynamic examination question paper.
              </p>
              <Link
                href="/admin/qp/create"
                className="inline-flex items-center space-x-1.5 bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Question Paper</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="py-3.5 px-4">Question Paper</th>
                    <th className="py-3.5 px-4 text-center">Questions</th>
                    <th className="py-3.5 px-4 text-center">Duration</th>
                    <th className="py-3.5 px-4 text-center">Passing</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Attempts</th>
                    <th className="py-3.5 px-4">Exam Link</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredPapers.map((paper) => {
                    const isCopied = copiedToken === paper.public_token;
                    const dateFormatted = new Date(paper.created_at).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr key={paper.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">{paper.title}</div>
                          <div className="text-2xs text-slate-500 font-medium line-clamp-1">{paper.description || paper.category} • Created {dateFormatted}</div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-black text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                            {paper.question_count || 0} Qs
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {paper.duration_minutes} Mins
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {paper.passing_marks} / {paper.max_marks || 10}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                              paper.status === 'Published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : paper.status === 'Draft'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : paper.status === 'Unpublished'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {paper.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                          {paper.attempt_count || 0}
                        </td>

                        <td className="py-3.5 px-4">
                          {paper.status === 'Published' ? (
                            <button
                              onClick={() => handleCopyExamLink(paper.public_token)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Link Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Exam Link</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Publish to enable link</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <Link
                            href={`/admin/qp/${paper.id}`}
                            className="inline-flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs transition-all"
                            title="Edit Questions & Settings"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit / Questions</span>
                          </Link>

                          {paper.status === 'Published' ? (
                            <button
                              onClick={() => handleToggleStatus(paper, 'Unpublished')}
                              className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs transition-all"
                            >
                              <span>Unpublish</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(paper, 'Published')}
                              className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 text-xs transition-all"
                            >
                              <span>Publish</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteModalPaper(paper)}
                            className="inline-flex items-center p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-xs transition-all"
                            title="Delete Paper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center space-x-3 mb-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Delete Question Paper?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong>{deleteModalPaper.title}</strong>?
            </p>

            {(deleteModalPaper.attempt_count || 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold mb-4">
                ⚠️ Warning: This paper has {deleteModalPaper.attempt_count} assessment attempt records linked to it.
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModalPaper(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaper}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
