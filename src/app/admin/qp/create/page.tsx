'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  Layers,
  Copy,
  PenTool,
  Check,
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
}

interface ExistingPaper {
  id: number;
  title: string;
  category: string;
  question_count?: number;
  duration_minutes: number;
}

export default function CreateQuestionPaperPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'template' | 'scratch' | 'clone'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [existingPapers, setExistingPapers] = useState<ExistingPaper[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form Fields
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedSourcePaperId, setSelectedSourcePaperId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SAP ABAP');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [passingMarks, setPassingMarks] = useState('5');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [tplRes, qpRes] = await Promise.all([
          fetch('/api/admin/templates'),
          fetch('/api/admin/question-papers'),
        ]);

        if (tplRes.ok) {
          const data = await tplRes.json();
          setTemplates(data.templates || []);
          if (data.templates && data.templates.length > 0) {
            const first = data.templates[0];
            setSelectedTemplateId(first.id);
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            setTitle(`${first.title} - ${dateStr}`);
            setDescription(first.description);
            setCategory(first.category);
            setDurationMinutes(String(first.duration_minutes));
            setPassingMarks(String(first.passing_marks));
          }
        }

        if (qpRes.ok) {
          const qpData = await qpRes.json();
          setExistingPapers(qpData.questionPapers || []);
          if (qpData.questionPapers && qpData.questionPapers.length > 0) {
            setSelectedSourcePaperId(qpData.questionPapers[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load templates or papers', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplateId(tpl.id);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setTitle(`${tpl.title} - ${dateStr}`);
    setDescription(tpl.description);
    setCategory(tpl.category);
    setDurationMinutes(String(tpl.duration_minutes));
    setPassingMarks(String(tpl.passing_marks));
  };

  const handleSelectSourcePaper = (p: ExistingPaper) => {
    setSelectedSourcePaperId(p.id);
    setTitle(`${p.title} (Copy)`);
    setCategory(p.category);
    setDurationMinutes(String(p.duration_minutes));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Question Paper Name is required');
      return;
    }

    setSubmitting(true);

    try {
      let res;
      if (mode === 'template') {
        if (!selectedTemplateId) throw new Error('Please select a template');
        res = await fetch('/api/admin/question-papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_from_template',
            templateId: selectedTemplateId,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            duration_minutes: parseInt(durationMinutes, 10) || 30,
            passing_marks: parseFloat(passingMarks) || 5,
            status,
          }),
        });
      } else if (mode === 'clone') {
        if (!selectedSourcePaperId) throw new Error('Please select a paper to duplicate');
        res = await fetch('/api/admin/question-papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'duplicate_paper',
            sourcePaperId: selectedSourcePaperId,
            newTitle: title.trim(),
          }),
        });
      } else {
        res = await fetch('/api/admin/question-papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_paper',
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            duration_minutes: parseInt(durationMinutes, 10) || 30,
            passing_marks: parseFloat(passingMarks) || 5,
            status,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create question paper');
      }

      const data = await res.json();
      router.push(`/admin/qp/${data.questionPaper.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating question paper');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin/qp"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-all"
            title="Back to Question Papers List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs tracking-wider shadow-xs flex items-center space-x-1.5">
            <Plus className="w-4 h-4" />
            <span>NEW QUESTION PAPER</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Create Question Paper</h1>
            <p className="text-xs text-slate-500 font-medium">Create from templates, duplicate existing, or build from scratch</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="h-2 bg-indigo-600"></div>

          <div className="p-8 space-y-6">
            {/* Mode Selection Tabs */}
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMode('template')}
                className={`py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                  mode === 'template'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>From Template</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('scratch')}
                className={`py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                  mode === 'scratch'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>From Scratch</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('clone')}
                className={`py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                  mode === 'clone'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate Paper</span>
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Template Selector if in template mode */}
            {mode === 'template' && (
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Choose Template Blueprint <span className="text-red-500">*</span>
                </label>
                {loadingData ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-500">Loading templates...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedTemplateId === tpl.id
                            ? 'bg-indigo-50/70 border-indigo-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-950">{tpl.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-700 border border-slate-200">
                            {tpl.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                        <div className="mt-2.5 flex items-center space-x-3 text-[11px] font-bold text-slate-600">
                          <span>{tpl.total_questions} Questions</span>
                          <span>•</span>
                          <span>{tpl.duration_minutes} Mins</span>
                          <span>•</span>
                          <span>Pass: {tpl.passing_marks}/{tpl.max_marks}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Existing Paper Selector if in clone mode */}
            {mode === 'clone' && (
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Select Paper to Clone <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {existingPapers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectSourcePaper(p)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedSourcePaperId === p.id
                          ? 'bg-indigo-50/70 border-indigo-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-950 block">{p.title}</span>
                      <div className="mt-1.5 flex items-center space-x-2 text-[11px] font-bold text-slate-500">
                        <span className="text-indigo-700">{p.category}</span>
                        <span>•</span>
                        <span>{p.question_count || 0} Questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {mode === 'scratch' ? 'Question Paper Details' : '2. Customize Configuration'}
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Paper Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SAP ABAP Assessment - Campus Hiring"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Technical assessment for candidate screening and evaluation."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="SAP ABAP"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="25">25 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                    <option value="90">90 Minutes</option>
                    <option value="120">120 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Passing Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(e.target.value)}
                    min="1"
                    max="100"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Draft">Draft (Editable in Q&P)</option>
                    <option value="Published">Published (Active for Testing)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <Link
                  href="/admin/qp"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Paper...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create & Open Editor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
