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
  ChevronDown,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  History as HistoryIcon,
  Sparkles,
  X,
  ExternalLink,
  Search,
  Activity,
  UserCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

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

interface Template {
  id: number;
  title: string;
  description: string;
  category: string;
  total_questions: number;
  duration_minutes: number;
  passing_marks: number;
  max_marks: number;
  difficulty: string;
}

interface HistoryItem {
  id: number;
  question_paper_id: number;
  action: string;
  details: string;
  performed_by: string;
  created_at: string;
}

interface PaperAttemptItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  campus_name?: string;
  trainer_name?: string;
  score: number;
  total_questions: number;
  percentage: number;
  submitted_at: string;
}

export default function QuestionPapersListPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Delete Paper Modal
  const [deleteModalPaper, setDeleteModalPaper] = useState<QuestionPaper | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate Paper Modal
  const [duplicateModalPaper, setDuplicateModalPaper] = useState<QuestionPaper | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Template Generation Wizard Modal
  const [showTemplateWizard, setShowTemplateWizard] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [tplCustomTitle, setTplCustomTitle] = useState('');
  const [tplCustomDuration, setTplCustomDuration] = useState('30');
  const [tplCustomPassing, setTplCustomPassing] = useState('5');
  const [tplCustomStatus, setTplCustomStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isGeneratingFromTemplate, setIsGeneratingFromTemplate] = useState(false);

  // History & Audit Log Slide-over / Modal
  const [historyModalPaper, setHistoryModalPaper] = useState<QuestionPaper | null>(null);
  const [historyData, setHistoryData] = useState<{
    history: HistoryItem[];
    attempts: PaperAttemptItem[];
    stats: {
      totalAttempts: number;
      passedAttempts: number;
      passRate: number;
      avgScore: number;
      highestScore: number;
    };
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'attempts'>('timeline');

  const fetchPapersAndTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [papersRes, templatesRes] = await Promise.all([
        fetch('/api/admin/question-papers'),
        fetch('/api/admin/templates'),
      ]);

      if (papersRes.status === 401) {
        setAuthError(true);
        router.push('/admin/login');
        return;
      }

      if (papersRes.ok) {
        const data = await papersRes.json();
        setPapers(data.questionPapers || []);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPapersAndTemplates();
  }, [fetchPapersAndTemplates]);

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
        fetchPapersAndTemplates();
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
        fetchPapersAndTemplates();
      } else {
        alert('Failed to delete question paper');
      }
    } catch (err) {
      alert('Error deleting paper');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDuplicateModal = (paper: QuestionPaper) => {
    setDuplicateModalPaper(paper);
    setDuplicateTitle(`${paper.title} (Copy)`);
  };

  const handleDuplicatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateModalPaper) return;
    setIsDuplicating(true);

    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate_paper',
          sourcePaperId: duplicateModalPaper.id,
          newTitle: duplicateTitle.trim() || `${duplicateModalPaper.title} (Copy)`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDuplicateModalPaper(null);
        fetchPapersAndTemplates();
        router.push(`/admin/qp/${data.questionPaper.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to duplicate paper');
      }
    } catch (err) {
      alert('Error duplicating paper');
    } finally {
      setIsDuplicating(false);
    }
  };

  const openHistoryModal = async (paper: QuestionPaper) => {
    setHistoryModalPaper(paper);
    setLoadingHistory(true);
    setHistoryData(null);
    setHistoryActiveTab('timeline');

    try {
      const res = await fetch(`/api/admin/question-papers/history?paperId=${paper.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openTemplateWizard = () => {
    setShowTemplateWizard(true);
    if (templates.length > 0) {
      const first = templates[0];
      setSelectedTemplateId(first.id);
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      setTplCustomTitle(`${first.title} - ${dateStr}`);
      setTplCustomDuration(String(first.duration_minutes));
      setTplCustomPassing(String(first.passing_marks));
      setTplCustomStatus('Draft');
    }
  };

  const handleSelectTemplateInWizard = (tpl: Template) => {
    setSelectedTemplateId(tpl.id);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setTplCustomTitle(`${tpl.title} - ${dateStr}`);
    setTplCustomDuration(String(tpl.duration_minutes));
    setTplCustomPassing(String(tpl.passing_marks));
  };

  const handleGenerateFromWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setIsGeneratingFromTemplate(true);

    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_from_template',
          templateId: selectedTemplateId,
          title: tplCustomTitle.trim(),
          duration_minutes: parseInt(tplCustomDuration, 10),
          passing_marks: parseFloat(tplCustomPassing),
          status: tplCustomStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowTemplateWizard(false);
        fetchPapersAndTemplates();
        router.push(`/admin/qp/${data.questionPaper.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate paper from template');
      }
    } catch (err) {
      alert('Error generating paper');
    } finally {
      setIsGeneratingFromTemplate(false);
    }
  };

  const categories = Array.from(new Set(papers.map((p) => p.category || 'General')));

  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.public_token.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
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
              <span>QUESTION PAPERS</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Question Papers Management</h1>
              <p className="text-xs text-slate-500 font-medium">Create, publish, duplicate, and audit exam papers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={openTemplateWizard}
              className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2 px-3.5 rounded-xl text-xs transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>From Template</span>
            </button>

            <Link
              href="/admin/qp/create"
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Paper</span>
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl w-full">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, token, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="unpublished">Unpublished</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Question Papers...</p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Question Papers Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Try adjusting your filters or create a new paper.</p>
              <button
                onClick={openTemplateWizard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all"
              >
                Generate from Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPapers.map((paper) => {
                const isPublished = paper.status === 'Published';
                const isCopied = copiedToken === paper.public_token;

                return (
                  <div
                    key={paper.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
                          {paper.category}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : paper.status === 'Draft'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {paper.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-950 group-hover:text-indigo-600 transition-colors leading-snug">
                        {paper.title}
                      </h3>

                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {paper.description || 'Custom technical screening assessment.'}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {/* Metric pills */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                          <span className="text-xs font-black text-slate-900">{paper.question_count || 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                          <span className="text-xs font-black text-slate-900">{paper.duration_minutes}m</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Attempts</span>
                          <span className="text-xs font-black text-slate-900">{paper.attempt_count || 0}</span>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/qp/${paper.id}`}
                          className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit & Questions</span>
                        </Link>

                        <button
                          onClick={() => openHistoryModal(paper)}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                          title="View History & Audit Log"
                        >
                          <HistoryIcon className="w-4 h-4 text-slate-600" />
                        </button>

                        <button
                          onClick={() => openDuplicateModal(paper)}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                          title="Duplicate / Clone Question Paper"
                        >
                          <Copy className="w-4 h-4 text-slate-600" />
                        </button>

                        <button
                          onClick={() => setDeleteModalPaper(paper)}
                          className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Share link bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                          {paper.public_token}
                        </span>
                        <button
                          onClick={() => handleCopyExamLink(paper.public_token)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* History & Audit Log Modal */}
      {historyModalPaper && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <HistoryIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Question Paper History & Audit Log</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {historyModalPaper.title} • ID #{historyModalPaper.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalPaper(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats summary bar */}
            {historyData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Attempts</span>
                  <span className="text-lg font-black text-slate-900">{historyData.stats.totalAttempts}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase">Pass Rate</span>
                  <span className="text-lg font-black text-emerald-700">{historyData.stats.passRate}%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
                  <span className="block text-[10px] font-bold text-indigo-600 uppercase">Average Score</span>
                  <span className="text-lg font-black text-indigo-700">
                    {historyData.stats.avgScore} / {historyModalPaper.max_marks}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                  <span className="block text-[10px] font-bold text-purple-600 uppercase">Highest Score</span>
                  <span className="text-lg font-black text-purple-700">
                    {historyData.stats.highestScore} / {historyModalPaper.max_marks}
                  </span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
              <button
                onClick={() => setHistoryActiveTab('timeline')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  historyActiveTab === 'timeline'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Activity & Audit Timeline ({historyData?.history.length || 0})
              </button>
              <button
                onClick={() => setHistoryActiveTab('attempts')}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  historyActiveTab === 'attempts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Candidate Attempt Log ({historyData?.attempts.length || 0})
              </button>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">Loading audit history...</p>
                </div>
              ) : historyActiveTab === 'timeline' ? (
                historyData?.history && historyData.history.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {historyData.history.map((item) => {
                      const dateStr = new Date(item.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const isCreation = item.action === 'created' || item.action.includes('cloned');
                      const isPublish = item.action === 'status_changed' || item.action === 'published';

                      return (
                        <div key={item.id} className="relative flex items-start space-x-3 pl-8">
                          <div
                            className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                              isCreation
                                ? 'border-emerald-500'
                                : isPublish
                                ? 'border-indigo-500'
                                : 'border-slate-400'
                            }`}
                          />
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                                {item.action.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">{dateStr}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-900 mt-1">{item.details}</p>
                            <p className="text-[10px] text-slate-500 font-medium">By: {item.performed_by || 'Admin'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">No activity logs recorded yet.</p>
                  </div>
                )
              ) : (
                historyData?.attempts && historyData.attempts.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800">
                        <tr>
                          <th className="py-2.5 px-3.5">Candidate</th>
                          <th className="py-2.5 px-3.5">Campus</th>
                          <th className="py-2.5 px-3.5">Trainer</th>
                          <th className="py-2.5 px-3.5 text-center">Score</th>
                          <th className="py-2.5 px-3.5 text-center">Result</th>
                          <th className="py-2.5 px-3.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyData.attempts.map((att) => {
                          const isPassed = att.score >= historyModalPaper.passing_marks;
                          const dateStr = new Date(att.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={att.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3.5">
                                <span className="font-bold text-slate-900 block">{att.candidate_name}</span>
                                <span className="text-[11px] text-slate-500">{att.candidate_email}</span>
                              </td>
                              <td className="py-2.5 px-3.5 font-semibold text-blue-700">{att.campus_name || '-'}</td>
                              <td className="py-2.5 px-3.5 font-semibold text-indigo-700">{att.trainer_name || '-'}</td>
                              <td className="py-2.5 px-3.5 text-center font-black text-slate-900">
                                {att.score} / {att.total_questions} ({att.percentage}%)
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPassed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isPassed ? 'Passed' : 'Needs Review'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right text-slate-400 font-medium text-[11px]">
                                {dateStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">No candidate attempts taken for this paper yet.</p>
                  </div>
                )
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setHistoryModalPaper(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate / Clone Paper Modal */}
      {duplicateModalPaper && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Copy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Duplicate Question Paper</h3>
                <p className="text-xs text-slate-500 font-medium">Create a complete replica including all questions</p>
              </div>
            </div>

            <form onSubmit={handleDuplicatePaper} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Paper Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={duplicateTitle}
                  onChange={(e) => setDuplicateTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Source Paper:</span> {duplicateModalPaper.title}
                <div className="text-[11px] text-slate-500">
                  Will duplicate {duplicateModalPaper.question_count || 0} questions and generate a new exam token in Draft status.
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicateModalPaper(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDuplicating}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isDuplicating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Duplicating...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Clone Question Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Generation Wizard Modal */}
      {showTemplateWizard && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Paper from Exam Template</h3>
                  <p className="text-xs text-slate-500 font-medium">Select a blueprint template and customize parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateWizard(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateFromWizard} className="space-y-5">
              {/* Template selector cards */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Blueprint Template <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTemplateInWizard(t)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTemplateId === t.id
                          ? 'bg-indigo-50/70 border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{t.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-white border border-slate-200 text-indigo-700">
                          {t.total_questions}Q • {t.duration_minutes}m
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Paper Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tplCustomTitle}
                  onChange={(e) => setTplCustomTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={tplCustomDuration}
                    onChange={(e) => setTplCustomDuration(e.target.value)}
                    min="5"
                    max="300"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    value={tplCustomPassing}
                    onChange={(e) => setTplCustomPassing(e.target.value)}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={tplCustomStatus}
                    onChange={(e) => setTplCustomStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateWizard(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingFromTemplate || !selectedTemplateId}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isGeneratingFromTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Paper...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Open Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalPaper && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Question Paper</h3>
                <p className="text-xs text-slate-500 font-medium">This will permanently delete this question paper and all its questions.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Paper: <strong className="text-slate-900">{deleteModalPaper.title}</strong>
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModalPaper(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePaper}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
