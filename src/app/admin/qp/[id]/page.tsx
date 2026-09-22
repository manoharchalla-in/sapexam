'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Layers,
  Share2,
  History as HistoryIcon,
  X,
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

interface Question {
  id: number;
  question_paper_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  question_order: number;
}

export default function QuestionPaperEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = parseInt(resolvedParams.id, 10);
  const router = useRouter();

  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Paper Settings State
  const [editPaperTitle, setEditPaperTitle] = useState('');
  const [editPaperDescription, setEditPaperDescription] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editPassingMarks, setEditPassingMarks] = useState(5);
  const [isSavingPaperSettings, setIsSavingPaperSettings] = useState(false);

  // Question Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState('1');
  const [explanation, setExplanation] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // History & Audit Log Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{
    history: any[];
    attempts: any[];
    stats: any;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'attempts'>('timeline');

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setHistoryData(null);
    setHistoryActiveTab('timeline');
    try {
      const res = await fetch(`/api/admin/question-papers/history?paperId=${paperId}`);
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

  const fetchPaperAndQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/question-papers?id=${paperId}`);
      if (res.status === 401) {
        setAuthError(true);
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Question paper not found');

      const data = await res.json();
      setPaper(data.questionPaper);
      setQuestions(data.questions || []);

      if (data.questionPaper) {
        setEditPaperTitle(data.questionPaper.title);
        setEditPaperDescription(data.questionPaper.description || '');
        setEditDuration(data.questionPaper.duration_minutes || 30);
        setEditPassingMarks(data.questionPaper.passing_marks || 5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [paperId, router]);

  useEffect(() => {
    fetchPaperAndQuestions();
  }, [fetchPaperAndQuestions]);

  const handleCopyLink = () => {
    if (!paper) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/exam/${paper.public_token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSavePaperSettings = async () => {
    if (!paper) return;
    setIsSavingPaperSettings(true);
    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paper.id,
          title: editPaperTitle,
          description: editPaperDescription,
          duration_minutes: editDuration,
          passing_marks: editPassingMarks,
        }),
      });

      if (res.ok) {
        fetchPaperAndQuestions();
      } else {
        alert('Failed to update paper settings');
      }
    } catch (err) {
      alert('Error updating settings');
    } finally {
      setIsSavingPaperSettings(false);
    }
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
    setMarks('1');
    setExplanation('');
    setQuestionError('');
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQText(q.question_text);
    setOptA(q.option_a);
    setOptB(q.option_b);
    setOptC(q.option_c);
    setOptD(q.option_d);
    setCorrectAnswer(q.correct_answer.toUpperCase());
    setMarks(String(q.marks || 1));
    setExplanation(q.explanation || '');
    setQuestionError('');
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError('');

    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setQuestionError('All question text and 4 options (A, B, C, D) are required.');
      return;
    }

    setIsSavingQuestion(true);

    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_question',
          id: editingQuestionId,
          question_paper_id: paperId,
          question_text: qText.trim(),
          option_a: optA.trim(),
          option_b: optB.trim(),
          option_c: optC.trim(),
          option_d: optD.trim(),
          correct_answer: correctAnswer,
          marks: parseFloat(marks) || 1,
          explanation: explanation.trim(),
          question_order: editingQuestionId ? undefined : questions.length + 1,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save question');
      }

      setShowQuestionModal(false);
      fetchPaperAndQuestions();
    } catch (err: any) {
      setQuestionError(err.message || 'Error saving question');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'question', id: qId, paperId }),
      });
      if (res.ok) {
        fetchPaperAndQuestions();
      } else {
        alert('Failed to delete question');
      }
    } catch (err) {
      alert('Error deleting question');
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;

    setQuestions(newQuestions);

    // Save order in backend
    try {
      await fetch('/api/admin/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder_questions',
          paperId,
          questionIds: newQuestions.map((q) => q.id),
        }),
      });
    } catch (err) {
      console.error('Failed to save question reorder', err);
    }
  };

  const handlePublishPaper = async () => {
    if (!paper) return;
    setValidationError(null);

    try {
      const res = await fetch('/api/admin/question-papers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paper.id, status: 'Published' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setValidationError(errData.error || 'Cannot publish paper.');
      } else {
        setPublishModal(false);
        fetchPaperAndQuestions();
      }
    } catch (err: any) {
      setValidationError('Error publishing question paper.');
    }
  };

  if (authError) return null;

  if (loading || !paper) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading Question Paper Details...</p>
        </div>
      </main>
    );
  }

  const examLink = typeof window !== 'undefined' ? `${window.location.origin}/exam/${paper.public_token}` : `/exam/${paper.public_token}`;

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/admin/qp"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-all"
            title="Back to Question Papers List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs tracking-wider shadow-xs flex items-center space-x-1.5">
            <FileCode className="w-4 h-4" />
            <span>EDITOR</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">{paper.title}</h1>
            <p className="text-xs text-slate-500 font-medium">Status: <strong className="text-slate-800">{paper.status}</strong> • {questions.length} Questions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openHistoryModal}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2 px-3.5 rounded-xl text-xs transition-all"
          >
            <HistoryIcon className="w-4 h-4 text-slate-600" />
            <span>History & Attempts</span>
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2 px-3.5 rounded-xl text-xs transition-all"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Preview Exam</span>
          </button>

          {paper.status === 'Published' ? (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Exam Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Exam Link</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setPublishModal(true)}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Publish Question Paper</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Prominent Share Link Banner if Published */}
        {paper.status === 'Published' && (
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-5 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 text-3xs font-extrabold uppercase tracking-wider">
                LIVE EXAM LINK GENERATED
              </span>
              <h3 className="text-base font-extrabold mt-1">Share this exam link with candidates to begin assessment</h3>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">{examLink}</p>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center space-x-2 bg-white text-indigo-950 hover:bg-indigo-50 font-black py-3 px-5 rounded-2xl text-xs shadow-md transition-all self-start md:self-auto"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>✓ Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <span>Copy Exam Link</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Settings & Summary Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Paper Settings & Evaluation Parameters
            </h3>
            <button
              onClick={handleSavePaperSettings}
              disabled={isSavingPaperSettings}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              {isSavingPaperSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">Paper Title</label>
              <input
                type="text"
                value={editPaperTitle}
                onChange={(e) => setEditPaperTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(parseInt(e.target.value, 10) || 30)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">Passing Marks</label>
              <input
                type="number"
                step="0.5"
                value={editPassingMarks}
                onChange={(e) => setEditPassingMarks(parseFloat(e.target.value) || 5)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">Total Max Marks</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-black text-slate-900">
                {paper.max_marks || questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Marks ({questions.length} Qs)
              </div>
            </div>
          </div>
        </div>

        {/* Questions Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Questions List ({questions.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Add, reorder, edit correct answers, and assign marks per question</p>
          </div>

          <button
            onClick={handleOpenAddQuestion}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Question</span>
          </button>
        </div>

        {/* Questions Cards List */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <FileCode className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Questions Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the <strong>+ Add Question</strong> button above to start adding questions to this paper.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs border border-indigo-100 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</h4>
                      <div className="flex items-center space-x-3 text-2xs text-slate-500 mt-1 font-semibold">
                        <span className="text-indigo-600 font-bold">Marks: {q.marks || 1}</span>
                        <span>• Type: {q.question_type || 'Single Choice'}</span>
                        <span className="text-emerald-700 font-bold">• Correct: Option {q.correct_answer.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold"
                      title="Edit Question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className={`p-3 rounded-xl border ${q.correct_answer.toUpperCase() === 'A' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-extrabold mr-2">A.</span> {q.option_a}
                  </div>
                  <div className={`p-3 rounded-xl border ${q.correct_answer.toUpperCase() === 'B' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-extrabold mr-2">B.</span> {q.option_b}
                  </div>
                  <div className={`p-3 rounded-xl border ${q.correct_answer.toUpperCase() === 'C' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-extrabold mr-2">C.</span> {q.option_c}
                  </div>
                  <div className={`p-3 rounded-xl border ${q.correct_answer.toUpperCase() === 'D' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <span className="font-extrabold mr-2">D.</span> {q.option_d}
                  </div>
                </div>

                {q.explanation && (
                  <div className="text-2xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</span>
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {questionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {questionError}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter the question text..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Option A <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Option B <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Option C <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Option D <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correct Answer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marks for this Question
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Explanation (Optional)
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Optional hint or explanation..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  disabled={isSavingQuestion}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                >
                  {isSavingQuestion ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Publish Question Paper?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Once published, candidates with the public exam link will be able to access and complete this assessment.
            </p>

            {validationError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {validationError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setPublishModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishPaper}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Exam Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-2xs font-extrabold uppercase">
                  CANDIDATE PREVIEW
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{paper.title}</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">
                    Q{idx + 1}. {q.question_text} <span className="text-indigo-600 font-normal">({q.marks || 1} mark)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 font-medium">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">A. {q.option_a}</div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">B. {q.option_b}</div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">C. {q.option_c}</div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">D. {q.option_d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History & Audit Log Modal */}
      {showHistoryModal && (
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
                    {paper.title} • ID #{paper.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
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
                    {historyData.stats.avgScore} / {paper.max_marks}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                  <span className="block text-[10px] font-bold text-purple-600 uppercase">Highest Score</span>
                  <span className="text-lg font-black text-purple-700">
                    {historyData.stats.highestScore} / {paper.max_marks}
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
                          const isPassed = att.score >= paper.passing_marks;
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
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
