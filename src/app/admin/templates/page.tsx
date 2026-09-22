'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  BookOpen,
  Edit,
  Sliders,
  Check,
  X,
  FileCode,
} from 'lucide-react';

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
  config_json?: string;
  created_at: string;
}

export default function ExamTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate Paper Modal
  const [generateModalTemplate, setGenerateModalTemplate] = useState<Template | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDuration, setCustomDuration] = useState('30');
  const [customPassingMarks, setCustomPassingMarks] = useState('5');
  const [customStatus, setCustomStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isGenerating, setIsGenerating] = useState(false);

  // Create / Edit Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplCategory, setTplCategory] = useState('SAP ABAP');
  const [tplTotalQ, setTplTotalQ] = useState('10');
  const [tplDuration, setTplDuration] = useState('30');
  const [tplPassing, setTplPassing] = useState('5');
  const [tplMax, setTplMax] = useState('10');
  const [tplDifficulty, setTplDifficulty] = useState('Intermediate');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Delete Template Modal
  const [deleteModalTemplate, setDeleteModalTemplate] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openGenerateModal = (tpl: Template) => {
    setGenerateModalTemplate(tpl);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setCustomTitle(`${tpl.title} - ${dateStr}`);
    setCustomDuration(String(tpl.duration_minutes));
    setCustomPassingMarks(String(tpl.passing_marks));
    setCustomStatus('Draft');
  };

  const handleGeneratePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateModalTemplate) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_paper',
          templateId: generateModalTemplate.id,
          title: customTitle.trim() || generateModalTemplate.title,
          duration_minutes: parseInt(customDuration, 10) || generateModalTemplate.duration_minutes,
          passing_marks: parseFloat(customPassingMarks) || generateModalTemplate.passing_marks,
          status: customStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGenerateModalTemplate(null);
        router.push(`/admin/qp/${data.questionPaper.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate question paper');
      }
    } catch (err) {
      alert('Error generating question paper');
    } finally {
      setIsGenerating(false);
    }
  };

  const openCreateTemplateModal = () => {
    setEditingTemplate(null);
    setTplTitle('');
    setTplDesc('');
    setTplCategory('SAP ABAP');
    setTplTotalQ('10');
    setTplDuration('30');
    setTplPassing('5');
    setTplMax('10');
    setTplDifficulty('Intermediate');
    setIsTemplateModalOpen(true);
  };

  const openEditTemplateModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setTplTitle(tpl.title);
    setTplDesc(tpl.description || '');
    setTplCategory(tpl.category || 'SAP ABAP');
    setTplTotalQ(String(tpl.total_questions || 10));
    setTplDuration(String(tpl.duration_minutes || 30));
    setTplPassing(String(tpl.passing_marks || 5));
    setTplMax(String(tpl.max_marks || 10));
    setTplDifficulty(tpl.difficulty || 'Intermediate');
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim()) return;
    setIsSavingTemplate(true);

    try {
      const payload = {
        title: tplTitle.trim(),
        description: tplDesc.trim(),
        category: tplCategory.trim(),
        total_questions: parseInt(tplTotalQ, 10) || 10,
        duration_minutes: parseInt(tplDuration, 10) || 30,
        passing_marks: parseFloat(tplPassing) || 5,
        max_marks: parseFloat(tplMax) || 10,
        difficulty: tplDifficulty,
      };

      let res;
      if (editingTemplate) {
        res = await fetch('/api/admin/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTemplate.id, ...payload }),
        });
      } else {
        res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsTemplateModalOpen(false);
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save template');
      }
    } catch (err) {
      alert('Error saving template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteModalTemplate) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModalTemplate.id }),
      });

      if (res.ok) {
        setDeleteModalTemplate(null);
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete template');
      }
    } catch (err) {
      alert('Error deleting template');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Exam Templates</h1>
              <p className="text-xs text-slate-500 font-medium">Configurable blueprints for rapid question paper generation</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={openCreateTemplateModal}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl w-full">
          {/* Quick Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Configurable Exam Blueprints</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select a template below to instantly create a new Question Paper with pre-configured questions, timings, and passing marks.
              </p>
            </div>

            <Link
              href="/admin/qp"
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 transition-all self-start md:self-auto"
            >
              <FileCode className="w-4 h-4" />
              <span>View Active Question Papers</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Exam Templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Templates Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Create your first exam template to standardize question papers.</p>
              <button
                onClick={openCreateTemplateModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
                        {tpl.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        tpl.difficulty === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tpl.difficulty === 'Advanced'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tpl.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {tpl.description || 'Configurable technical assessment template.'}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                        <span className="text-xs font-black text-slate-900">{tpl.total_questions}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                        <span className="text-xs font-black text-slate-900">{tpl.duration_minutes}m</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Pass Mark</span>
                        <span className="text-xs font-black text-slate-900">{tpl.passing_marks}/{tpl.max_marks}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => openGenerateModal(tpl)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Paper</span>
                      </button>

                      <button
                        onClick={() => openEditTemplateModal(tpl)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                        title="Edit Template"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteModalTemplate(tpl)}
                        className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Question Paper Modal */}
      {generateModalTemplate && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Generate Question Paper</h3>
                  <p className="text-xs text-slate-500 font-medium">From Template: {generateModalTemplate.title}</p>
                </div>
              </div>
              <button
                onClick={() => setGenerateModalTemplate(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePaper} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Paper Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
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
                    value={customPassingMarks}
                    onChange={(e) => setCustomPassingMarks(e.target.value)}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Draft">Draft (Editable in Q&P)</option>
                  <option value="Published">Published (Immediate Candidate Access)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Instant Question Seeding</span>
                </span>
                <p className="text-[11px] text-indigo-700">
                  Will automatically populate {generateModalTemplate.total_questions} questions configured in this template blueprint.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setGenerateModalTemplate(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Paper...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create & Open Editor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingTemplate ? 'Edit Exam Template' : 'Create Custom Exam Template'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Configure template structure and blueprint</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  placeholder="e.g. SAP ABAP Advanced Assessment"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                  placeholder="Assessment blueprint details..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category / Subject
                  </label>
                  <input
                    type="text"
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value)}
                    placeholder="SAP ABAP"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Difficulty Tier
                  </label>
                  <select
                    value={tplDifficulty}
                    onChange={(e) => setTplDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    value={tplTotalQ}
                    onChange={(e) => setTplTotalQ(e.target.value)}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={tplDuration}
                    onChange={(e) => setTplDuration(e.target.value)}
                    min="5"
                    max="300"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pass Mark
                  </label>
                  <input
                    type="number"
                    value={tplPassing}
                    onChange={(e) => setTplPassing(e.target.value)}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSavingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Template...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTemplate && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Template</h3>
                <p className="text-xs text-slate-500 font-medium">Are you sure you want to delete this template?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Template: <strong className="text-slate-900">{deleteModalTemplate.title}</strong>
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteModalTemplate(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
