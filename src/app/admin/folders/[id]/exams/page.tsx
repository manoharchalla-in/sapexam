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
  Database,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Filter,
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

interface BankQuestion {
  id: number;
  question_text: string;
  question_type: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  difficulty: string;
  topic: string;
  explanation: string;
}

interface ExamTemplate {
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

export default function ExamsAndQuestionPapersFolderPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [exams, setExams] = useState<CollegeExam[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);

  const [folderSubView, setFolderSubView] = useState<'qp' | 'bank' | 'templates'>('qp');
  const [viewMode, setViewMode] = useState<'icons' | 'cards'>('icons');
  const [loading, setLoading] = useState(true);

  // Bank Filter
  const [bankSearch, setBankSearch] = useState('');
  const [bankTopic, setBankTopic] = useState('all');
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);

  // Modals
  const [isNewExamOpen, setIsNewExamOpen] = useState(false);
  const [creationSource, setCreationSource] = useState<'template' | 'bank' | 'blank'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const [examForm, setExamForm] = useState({
    name: '',
    code: '',
    subject: 'SAP ABAP Programming',
    description: '',
    duration_minutes: 30,
    total_questions: 10,
    total_marks: 10,
    passing_marks: 5,
    instructions: 'Answer all questions within the allocated time. Multiple attempts are not allowed.',
    status: 'Published' as 'Draft' | 'Published',
    templateId: undefined as number | undefined,
    questionBankIds: [] as number[],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Share Modal / Copied state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollegeExam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch College Exams
      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`);
      const data = await res.json();
      if (data.success) {
        setCollege(data.college);
        setExams(data.exams || []);
      }

      // Fetch Question Bank
      const bankRes = await fetch(`/api/admin/question-bank`);
      const bankData = await bankRes.json();
      if (bankData.questions) {
        setBankQuestions(bankData.questions || []);
      }

      // Fetch Exam Templates
      const tplRes = await fetch(`/api/admin/templates`);
      const tplData = await tplRes.json();
      if (tplData.templates) {
        setTemplates(tplData.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collegeId) fetchAllData();
  }, [collegeId]);

  const openCreateModalWithTemplate = (tpl: ExamTemplate) => {
    setSelectedTemplateId(tpl.id);
    setCreationSource('template');
    setExamForm({
      name: `${tpl.title} - ${college?.name || 'Assessment'}`,
      code: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: tpl.category || 'SAP ABAP Programming',
      description: tpl.description || '',
      duration_minutes: tpl.duration_minutes || 30,
      total_questions: tpl.total_questions || 10,
      total_marks: tpl.max_marks || 10,
      passing_marks: tpl.passing_marks || 5,
      instructions: 'Answer all questions. Multiple attempts are not permitted.',
      status: 'Published',
      templateId: tpl.id,
      questionBankIds: [],
    });
    setIsNewExamOpen(true);
  };

  const openCreateModalWithSelectedBank = () => {
    if (selectedBankIds.length === 0) {
      alert('Please select at least one question from the Question Bank.');
      return;
    }
    setCreationSource('bank');
    setExamForm({
      name: `SAP Assessment (${selectedBankIds.length} Qs) - ${college?.name || 'College'}`,
      code: `QB-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: 'SAP ABAP Core Technical',
      description: `Assessment created from ${selectedBankIds.length} selected Question Bank questions.`,
      duration_minutes: Math.max(15, selectedBankIds.length * 3),
      total_questions: selectedBankIds.length,
      total_marks: selectedBankIds.length,
      passing_marks: Math.ceil(selectedBankIds.length * 0.4),
      instructions: 'Answer all questions within the allocated time.',
      status: 'Published',
      templateId: undefined,
      questionBankIds: selectedBankIds,
    });
    setIsNewExamOpen(true);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) {
      setCreateError('Exam Paper Name is required');
      return;
    }
    setCreateError('');
    setCreating(true);

    try {
      const payload: any = {
        name: examForm.name,
        code: examForm.code,
        subject: examForm.subject,
        description: examForm.description,
        duration_minutes: examForm.duration_minutes,
        total_questions: examForm.total_questions,
        total_marks: examForm.total_marks,
        passing_marks: examForm.passing_marks,
        instructions: examForm.instructions,
        status: examForm.status,
      };

      if (creationSource === 'template' && examForm.templateId) {
        payload.templateId = examForm.templateId;
      } else if (creationSource === 'bank' && examForm.questionBankIds.length > 0) {
        payload.questionBankIds = examForm.questionBankIds;
      }

      const res = await fetch(`/api/admin/folders/colleges/${collegeId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.exam) {
        setIsNewExamOpen(false);
        setSelectedBankIds([]);
        router.push(`/admin/folders/${collegeId}/exams/${data.exam.id}`);
      } else {
        setCreateError(data.message || 'Failed to create exam paper');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating exam paper');
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
        fetchAllData();
      } else {
        alert(data.message || 'Failed to delete exam paper');
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

  const filteredBankQuestions = bankQuestions.filter((q) => {
    const matchesSearch =
      q.question_text.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchesTopic = bankTopic === 'all' || q.topic === bankTopic;
    return matchesSearch && matchesTopic;
  });

  const allTopics = Array.from(new Set(bankQuestions.map((q) => q.topic).filter(Boolean)));

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
              title="Back to College Folder"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-2xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                <Link href="/admin/folders" className="hover:text-blue-600">Folders</Link>
                <span>/</span>
                <Link href={`/admin/folders/${collegeId}`} className="hover:text-blue-600">{college?.name || 'College'}</Link>
                <span>/</span>
                <span className="text-indigo-600 font-extrabold">Exam Papers (Q&P)</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Question Papers & Assessments</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                setCreationSource('template');
                setExamForm({
                  name: `SAP Technical Exam - ${college?.name || 'Assessment'}`,
                  code: `EX-${Math.floor(1000 + Math.random() * 9000)}`,
                  subject: 'SAP ABAP Programming',
                  description: 'Technical evaluation covering core ABAP syntax and database procedures.',
                  duration_minutes: 30,
                  total_questions: 10,
                  total_marks: 10,
                  passing_marks: 5,
                  instructions: 'Answer all questions. Multiple attempts are not allowed.',
                  status: 'Published',
                  templateId: templates[0]?.id,
                  questionBankIds: [],
                });
                setIsNewExamOpen(true);
              }}
              className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Exam Paper</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Institutional Subfolder Bar */}
          <div className="glossy-panel p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Link
                href={`/admin/folders/${collegeId}/students`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center space-x-1.5 transition-all"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Student Credential Data</span>
              </Link>

              <span className="px-3.5 py-1.5 rounded-xl text-xs font-black text-indigo-700 bg-white shadow-2xs border border-indigo-100 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Exam Papers (Q&P)</span>
              </span>

              <Link
                href={`/admin/folders/${collegeId}/results`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center space-x-1.5 transition-all"
              >
                <span className="text-amber-500">📁</span>
                <span>Results Folder</span>
              </Link>
            </div>

            {/* Sub-view switcher inside Exam Papers */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFolderSubView('qp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                  folderSubView === 'qp' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Question Papers ({exams.length})</span>
              </button>

              <button
                onClick={() => setFolderSubView('templates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                  folderSubView === 'templates' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Exam Templates ({templates.length})</span>
              </button>

              <button
                onClick={() => setFolderSubView('bank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                  folderSubView === 'bank' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Question Bank ({bankQuestions.length})</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEW 1: QUESTION PAPERS (Q&P) LIST */}
          {/* ========================================================= */}
          {folderSubView === 'qp' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Institutional Question Papers</h3>
                  <p className="text-xs text-slate-500 font-medium">Click any paper to construct questions or share student links.</p>
                </div>

                <div className="flex items-center space-x-2">
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

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Loading Question Papers...</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="glossy-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                    <FileCheck2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">No Exam Papers Created</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Create a new exam paper from ready-made <strong>Exam Templates</strong> or build one from the <strong>Question Bank</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setCreationSource('template');
                      setIsNewExamOpen(true);
                    }}
                    className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl inline-flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Create First Exam Paper</span>
                  </button>
                </div>
              ) : viewMode === 'icons' ? (
                <div className="glossy-card rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Assessment Folders ({exams.length})
                    </h3>
                    <span className="text-2xs text-slate-400">Click folder to open Exam Paper Builder</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center pt-2">
                    {exams.map((exam) => (
                      <ExplorerFolder
                        key={exam.id}
                        name={exam.name}
                        subLabel={exam.code || `${exam.duration_minutes} Mins`}
                        badge={`${exam.question_count || 0} Qs • ${exam.attempt_count || 0} Subs`}
                        innerIcon={<FileCode className="w-4 h-4 text-amber-600" />}
                        onClick={() => router.push(`/admin/folders/${collegeId}/exams/${exam.id}`)}
                        onDelete={() => setDeleteTarget(exam)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
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

                            <h3 className="text-base font-black text-slate-900 mt-1.5 group-hover:text-indigo-600 transition-colors">
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
                              href={`/admin/folders/${collegeId}/exams/${exam.id}`}
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
                              href={`/admin/folders/${collegeId}/results?examId=${exam.id}`}
                              className="text-2xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Open Results Folder →
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
                          Open Paper Builder →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: EXAM TEMPLATES */}
          {/* ========================================================= */}
          {folderSubView === 'templates' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>Curated Exam Templates</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pre-configured blueprints with pre-filled duration, marks, and auto-populated question banks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="glossy-card rounded-3xl p-6 border border-slate-200/90 flex flex-col justify-between space-y-4 hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {tpl.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {tpl.difficulty}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {tpl.title}
                      </h4>

                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {tpl.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/80 rounded-xl p-2.5 text-center text-xs border border-slate-200/60">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Questions</span>
                          <span className="font-black text-slate-900">{tpl.total_questions} Qs</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Duration</span>
                          <span className="font-black text-indigo-600">{tpl.duration_minutes} Mins</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Pass Marks</span>
                          <span className="font-black text-emerald-600">{tpl.passing_marks}/{tpl.max_marks}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openCreateModalWithTemplate(tpl)}
                      className="glossy-button-primary text-white text-xs font-black w-full py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Exam from Template</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: QUESTION BANK REPOSITORY */}
          {/* ========================================================= */}
          {folderSubView === 'bank' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Database className="w-5 h-5 text-amber-600" />
                    <span>SAP ABAP Question Bank ({bankQuestions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Browse and select questions to instantly construct a new examination paper for this college.
                  </p>
                </div>

                {selectedBankIds.length > 0 && (
                  <button
                    onClick={openCreateModalWithSelectedBank}
                    className="glossy-button-primary text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm animate-pulse"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Exam from Selected ({selectedBankIds.length})</span>
                  </button>
                )}
              </div>

              {/* Filter Strip */}
              <div className="glossy-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Search question text or explanations..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl glossy-input text-slate-900"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={bankTopic}
                    onChange={(e) => setBankTopic(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl glossy-input text-slate-800"
                  >
                    <option value="all">All Topics ({bankQuestions.length})</option>
                    {allTopics.map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedBankIds.length === filteredBankQuestions.length) {
                        setSelectedBankIds([]);
                      } else {
                        setSelectedBankIds(filteredBankQuestions.map((q) => q.id));
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                  >
                    {selectedBankIds.length === filteredBankQuestions.length ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {filteredBankQuestions.map((q) => {
                  const isSelected = selectedBankIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedBankIds(selectedBankIds.filter((id) => id !== q.id));
                        } else {
                          setSelectedBankIds([...selectedBankIds, q.id]);
                        }
                      }}
                      className={`glossy-card rounded-2xl p-5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                          : 'border-slate-200/90 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 text-indigo-600 rounded mt-0.5 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                {q.topic}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {q.difficulty} • {q.marks || 1} Mark
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 leading-relaxed">
                              {q.question_text}
                            </h4>
                          </div>
                        </div>

                        <span className="text-2xs font-extrabold uppercase px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Key: {q.correct_answer}
                        </span>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3 pl-7">
                        {[
                          { key: 'A', text: q.option_a },
                          { key: 'B', text: q.option_b },
                          { key: 'C', text: q.option_c },
                          { key: 'D', text: q.option_d },
                        ].map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-lg text-2xs flex items-center space-x-2 border ${
                              q.correct_answer.toUpperCase() === opt.key
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200/60 text-slate-600'
                            }`}
                          >
                            <span className="w-4 h-4 rounded text-[10px] font-black flex items-center justify-center bg-slate-200 text-slate-700">
                              {opt.key}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE EXAM PAPER MODAL */}
      {isNewExamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl glossy-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-base font-black">Create New Exam Paper</h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Configure question paper parameters for {college?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsNewExamOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creation Source Switcher */}
            <div className="p-3 bg-slate-100 border-b border-slate-200/80 flex items-center justify-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCreationSource('template');
                  if (templates[0]) openCreateModalWithTemplate(templates[0]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all ${
                  creationSource === 'template' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>From Template</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationSource('blank')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all ${
                  creationSource === 'blank' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Blank Paper</span>
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4 overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {creationSource === 'template' && (
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Select Base Exam Template <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={examForm.templateId || ''}
                    onChange={(e) => {
                      const tId = parseInt(e.target.value, 10);
                      const found = templates.find((t) => t.id === tId);
                      if (found) openCreateModalWithTemplate(found);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-blue-700 bg-blue-50/40"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title} ({tpl.duration_minutes} Mins, {tpl.total_questions} Questions)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Exam Paper Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  placeholder="e.g. SAP ABAP Technical Assessment - Sem 6"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold glossy-input text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Code
                  </label>
                  <input
                    type="text"
                    value={examForm.code}
                    onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                    placeholder="e.g. ABAP-101"
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono glossy-input text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                    Subject / Domain
                  </label>
                  <input
                    type="text"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    placeholder="e.g. SAP ABAP Programming"
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-bold glossy-input text-slate-800"
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
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
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
                    min={1}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
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
                    min={1}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-center glossy-input text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                  Candidate Instructions
                </label>
                <textarea
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-medium glossy-input text-slate-800"
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
                  className="glossy-button-primary text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{creating ? 'Creating Paper...' : 'Create & Open Builder'}</span>
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
              <h3 className="text-base font-black text-slate-950">Delete Exam Paper?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong> and all associated questions?
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
