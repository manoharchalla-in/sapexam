'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  FileCheck2,
  FileCode,
  Award,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

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
}

interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  explanation: string;
  order_index: number;
}

export default function ExamPaperDetailPage() {
  const params = useParams();
  const router = useRouter();

  const collegeId = params.id as string;
  const examId = params.examId as string;

  const [exam, setExam] = useState<CollegeExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultsCount, setResultsCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Question Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: undefined as number | undefined,
    question_text: '',
    question_type: 'Single Choice',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    marks: 1,
    explanation: '',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'question'; id: any; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Fetch Questions & Exam Info
      const qRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`);
      const qData = await qRes.json();
      if (qData.success) {
        setExam(qData.exam);
        setQuestions(qData.questions || []);
      }

      // Fetch Results Count
      const rRes = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/results`);
      const rData = await rRes.json();
      if (rData.success) {
        setResultsCount((rData.results || []).length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId && examId) loadAllData();
  }, [collegeId, examId]);

  const handleStatusToggle = async (newStatus: 'Draft' | 'Published') => {
    if (!exam) return;
    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExam({ ...exam, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) return;
    setSavingQuestion(true);

    try {
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsQuestionModalOpen(false);
        setQuestionForm({
          id: undefined,
          question_text: '',
          question_type: 'Single Choice',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          marks: 1,
          explanation: '',
        });
        loadAllData();
      } else {
        alert(data.message || 'Error saving question');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === 'question') {
        const res = await fetch(
          `/api/admin/folders/colleges/${collegeId}/exams/${examId}/questions?questionId=${deleteTarget.id}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (data.success) {
          setDeleteTarget(null);
          loadAllData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const getExamPathUrl = () => {
    if (!exam) return '';
    const colSlug = (exam.college_name || 'college')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const exSlug = (exam.name || 'exam')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/exam/${colSlug}/${exSlug}`;
  };

  const copyPublicExamLink = () => {
    if (!exam) return;
    const link = getExamPathUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading && !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar currentRole="Main Super Admin" />
        <div className="flex-1 lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar currentRole="Main Super Admin" />

      <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glossy-header px-6 py-4 sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center space-x-3">
            <Link
              href={`/admin/folders/${collegeId}/exams`}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Back to Exam Papers Folder"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{exam?.college_name || 'College'}</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}/exams`} className="hover:text-blue-600">Exam Papers</Link>
                <span>/</span>
                <span className="text-indigo-600 font-extrabold">{exam?.name}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>{exam?.name}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={copyPublicExamLink}
              className="glossy-button-secondary text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Share Exam Link</span>
                </>
              )}
            </button>

            <Link
              href={getExamPathUrl()}
              target="_blank"
              className="glossy-button-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Exam View</span>
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Windows Explorer Style Address Bar & Quick Switcher */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-amber-500">📁</span>
              <Link href="/admin/folders" className="text-xs font-bold text-slate-600 hover:text-blue-600">Folders</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/admin/folders/${collegeId}`} className="text-xs font-bold text-slate-600 hover:text-blue-600">{exam?.college_name}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href={`/admin/folders/${collegeId}/exams`} className="text-xs font-bold text-slate-600 hover:text-blue-600">Exam Papers</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black text-indigo-900">{exam?.name}</span>
            </div>

            {/* Direct Link to Results Folder */}
            <Link
              href={`/admin/folders/${collegeId}/results?examId=${exam?.id}`}
              className="glossy-panel px-4 py-2 rounded-xl text-xs font-black text-amber-800 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200 flex items-center space-x-2 transition-all group"
            >
              <span className="text-base">📁</span>
              <span>Open Results Folder ({resultsCount} Submissions)</span>
              <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Exam Specs & Status Strip */}
          <div className="glossy-card rounded-2xl p-5 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div className="space-y-0.5">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Subject</span>
                <p className="font-bold text-slate-800">{exam?.subject || 'General'}</p>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              <div className="space-y-0.5">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Duration</span>
                <p className="font-bold text-slate-800">{exam?.duration_minutes} Minutes</p>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              <div className="space-y-0.5">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Total Questions</span>
                <p className="font-bold text-indigo-700">{questions.length} Questions</p>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              <div className="space-y-0.5">
                <span className="text-2xs font-extrabold uppercase text-slate-400">Passing Criteria</span>
                <p className="font-bold text-emerald-700">{exam?.passing_marks} / {exam?.total_marks} Marks</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xs font-extrabold uppercase text-slate-400">Exam Mode:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                <button
                  onClick={() => handleStatusToggle('Draft')}
                  className={`px-3 py-1 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${
                    exam?.status === 'Draft' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Draft
                </button>
                <button
                  onClick={() => handleStatusToggle('Published')}
                  className={`px-3 py-1 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${
                    exam?.status === 'Published' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Published
                </button>
              </div>
            </div>
          </div>

          {/* Exam Question Paper Workspace */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  <span>Exam Paper Questions ({questions.length})</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Construct and manage multiple-choice questions for this examination paper.
                </p>
              </div>

              <button
                onClick={() => {
                  setQuestionForm({
                    id: undefined,
                    question_text: '',
                    question_type: 'Single Choice',
                    option_a: '',
                    option_b: '',
                    option_c: '',
                    option_d: '',
                    correct_answer: 'A',
                    marks: 1,
                    explanation: '',
                  });
                  setIsQuestionModalOpen(true);
                }}
                className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="glossy-card rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                  <FileCode className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-700">No Questions Added to this Paper Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Add Question" to start building this exam paper with multiple choice options and answer keys.
                </p>
                <button
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add First Question</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="glossy-card rounded-2xl p-5 border border-slate-200/90 space-y-3 hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                          Q{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-relaxed">
                            {q.question_text}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {q.marks || 1} Mark{q.marks !== 1 ? 's' : ''} • Single Choice
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setQuestionForm({
                              id: q.id,
                              question_text: q.question_text,
                              question_type: q.question_type,
                              option_a: q.option_a,
                              option_b: q.option_b,
                              option_c: q.option_c,
                              option_d: q.option_d,
                              correct_answer: q.correct_answer,
                              marks: q.marks,
                              explanation: q.explanation,
                            });
                            setIsQuestionModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: `Question #${idx + 1}` })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {[
                        { key: 'A', text: q.option_a },
                        { key: 'B', text: q.option_b },
                        { key: 'C', text: q.option_c },
                        { key: 'D', text: q.option_d },
                      ].map((opt) => {
                        const isCorrect = q.correct_answer.toUpperCase() === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-center space-x-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-lg text-2xs font-black flex items-center justify-center ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="truncate">{opt.text}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-medium">
                        💡 <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ADD / EDIT QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-5 h-5 text-white" />
                <h3 className="text-base font-black">
                  {questionForm.id ? 'Edit Question' : 'Add MCQ Question'}
                </h3>
              </div>
              <button onClick={() => setIsQuestionModalOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows={3}
                  placeholder="Enter the complete question here..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700">
                  Multiple Choice Options (A - D) <span className="text-rose-500">*</span>
                </label>

                {[
                  { key: 'A', field: 'option_a' },
                  { key: 'B', field: 'option_b' },
                  { key: 'C', field: 'option_c' },
                  { key: 'D', field: 'option_d' },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-200">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={(questionForm as any)[opt.field]}
                      onChange={(e) => setQuestionForm({ ...questionForm, [opt.field]: e.target.value })}
                      placeholder={`Option ${opt.key} text`}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Correct Answer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-black glossy-input text-emerald-700 bg-emerald-50/50"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Marks Awarded
                  </label>
                  <input
                    type="number"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: parseFloat(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Explanation / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Optional technical rationale..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{savingQuestion ? 'Saving...' : 'Save Question'}</span>
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
              <h3 className="text-base font-black text-slate-950">Delete {deleteTarget.name || 'Item'}?</h3>
              <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
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
                onClick={handleDeleteConfirmed}
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
