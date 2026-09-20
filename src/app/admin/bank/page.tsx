'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import QuestionEditor, { QUESTION_TYPES_LIST } from '@/components/admin/QuestionEditor';
import { QuestionType, BaseQuestionConfig } from '@/types/assessment';
import {
  Database,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Copy,
  Loader2,
  X,
  FileCode,
} from 'lucide-react';

interface BankQuestion {
  id: number;
  question_text: string;
  question_type: QuestionType;
  configuration: string | BaseQuestionConfig;
  correct_answer: string;
  marks: number;
  negative_marks?: number;
  difficulty?: string;
  topic?: string;
  explanation?: string;
  created_at: string;
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [qType, setQType] = useState<QuestionType>('Single Choice');
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState('1');
  const [qNegMarks, setQNegMarks] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [config, setConfig] = useState<BaseQuestionConfig>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchBankQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        typeFilter,
        difficultyFilter,
      });
      const res = await fetch(`/api/admin/question-bank?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, difficultyFilter]);

  useEffect(() => {
    fetchBankQuestions();
  }, [fetchBankQuestions]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setQType('Single Choice');
    setQText('');
    setQMarks('1');
    setQNegMarks('0');
    setQExplanation('');
    setQCorrect('A');
    setConfig({});
    setShowModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!qText.trim()) return alert('Question text is required');
    setIsSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/question-bank', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          question_text: qText.trim(),
          question_type: qType,
          configuration: config,
          correct_answer: qCorrect,
          marks: parseFloat(qMarks) || 1,
          negative_marks: parseFloat(qNegMarks) || 0,
          explanation: qExplanation.trim(),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchBankQuestions();
      } else {
        alert('Failed to save question to bank');
      }
    } catch (err) {
      alert('Error saving question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this question from Question Bank?')) return;
    try {
      const res = await fetch('/api/admin/question-bank', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchBankQuestions();
    } catch (err) {
      alert('Error deleting question');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Question Bank</h1>
              <p className="text-xs text-slate-500 font-medium">Global Repository of Reusable Assessment Questions</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Question</span>
          </button>
        </header>

        {/* Content */}
        <div className="p-6 md:p-10 space-y-6 max-w-7xl">
          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by text..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-bold"
              >
                <option value="all">All Question Types</option>
                {QUESTION_TYPES_LIST.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Question Bank Repository...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Database className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Questions Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No questions match your search parameters. Click "Add New Question" above to populate the repository.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {q.question_type}
                      </span>
                      <span className="text-xs font-bold text-slate-400">({q.marks} Marks)</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{q.question_text}</p>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-950">
                {editingId ? 'Edit Bank Question' : 'Add Question to Question Bank'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuestionEditor
              questionType={qType}
              setQuestionType={setQType}
              questionText={qText}
              setQuestionText={setQText}
              marks={qMarks}
              setMarks={setQMarks}
              negativeMarks={qNegMarks}
              setNegativeMarks={setQNegMarks}
              explanation={qExplanation}
              setExplanation={setQExplanation}
              correctAnswer={qCorrect}
              setCorrectAnswer={setQCorrect}
              config={config}
              setConfig={setConfig}
            />

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
