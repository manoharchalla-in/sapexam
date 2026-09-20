'use client';

import React from 'react';
import { QuestionType, BaseQuestionConfig } from '@/types/assessment';
import {
  CircleDot,
  CheckSquare,
  CheckCircle2,
  HelpCircle,
  Edit3,
  FileText,
  AlignLeft,
  Code2,
  Terminal,
  Bug,
  GitCompare,
  ListOrdered,
  Move,
  ChevronDown,
  Hash,
  FileCode,
  BookOpen,
  Image as ImageIcon,
  Table,
} from 'lucide-react';

export const QUESTION_TYPES_LIST: { type: QuestionType; icon: any; label: string; desc: string }[] = [
  { type: 'Single Choice', icon: CircleDot, label: 'Single Choice', desc: 'Select one option from multiple choices' },
  { type: 'Multiple Choice', icon: CheckSquare, label: 'Multiple Choice', desc: 'Select multiple correct options' },
  { type: 'True / False', icon: CheckCircle2, label: 'True / False', desc: 'Binary True or False selection' },
  { type: 'Yes / No', icon: HelpCircle, label: 'Yes / No', desc: 'Binary Yes or No selection' },
  { type: 'Fill in the Blank', icon: Edit3, label: 'Fill in the Blank', desc: 'Direct text input into missing blank' },
  { type: 'Short Answer', icon: FileText, label: 'Short Answer', desc: 'Single-line concise text response' },
  { type: 'Long Answer', icon: AlignLeft, label: 'Long Answer', desc: 'Multi-paragraph descriptive explanation' },
  { type: 'Code Completion', icon: Code2, label: 'Code Completion', desc: 'Fill in missing code snippets' },
  { type: 'Code Output', icon: Terminal, label: 'Code Output', desc: 'Determine output of code snippet' },
  { type: 'Code Debugging', icon: Bug, label: 'Code Debugging', desc: 'Identify and fix syntax/logic errors' },
  { type: 'Match the Following', icon: GitCompare, label: 'Match the Following', desc: 'Pair items between two columns' },
  { type: 'Ordering / Sequence', icon: ListOrdered, label: 'Ordering / Sequence', desc: 'Arrange items in logical sequence' },
  { type: 'Drag & Drop', icon: Move, label: 'Drag & Drop', desc: 'Categorize objects into target zones' },
  { type: 'Dropdown Selection', icon: ChevronDown, label: 'Dropdown Selection', desc: 'Choose answer from inline dropdown menu' },
  { type: 'Numeric Answer', icon: Hash, label: 'Numeric Answer', desc: 'Numeric value with range/tolerance' },
  { type: 'Code Writing', icon: FileCode, label: 'Code Writing', desc: 'Write complete program with test cases' },
  { type: 'Case Study', icon: BookOpen, label: 'Case Study', desc: 'Scenario analysis with problem statement' },
  { type: 'Image Based', icon: ImageIcon, label: 'Image Based', desc: 'Visual diagram or screenshot based question' },
  { type: 'Table Based', icon: Table, label: 'Table Based', desc: 'Data matrix grid based evaluation' },
];

interface QuestionEditorProps {
  questionType: QuestionType;
  setQuestionType: (t: QuestionType) => void;
  questionText: string;
  setQuestionText: (t: string) => void;
  marks: string;
  setMarks: (m: string) => void;
  negativeMarks: string;
  setNegativeMarks: (nm: string) => void;
  explanation: string;
  setExplanation: (e: string) => void;
  correctAnswer: string;
  setCorrectAnswer: (c: string) => void;
  config: BaseQuestionConfig;
  setConfig: React.Dispatch<React.SetStateAction<BaseQuestionConfig>>;
}

export default function QuestionEditor({
  questionType,
  setQuestionType,
  questionText,
  setQuestionText,
  marks,
  setMarks,
  negativeMarks,
  setNegativeMarks,
  explanation,
  setExplanation,
  correctAnswer,
  setCorrectAnswer,
  config,
  setConfig,
}: QuestionEditorProps) {
  return (
    <div className="space-y-6">
      {/* Type Selector Dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Question Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {QUESTION_TYPES_LIST.map((item) => {
            const Icon = item.icon;
            const selected = questionType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setQuestionType(item.type)}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 text-blue-900 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50/50 font-medium'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Text */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Question Text / Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter question text here..."
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 font-medium bg-white"
        />
      </div>

      {/* DYNAMIC FIELDS BASED ON QUESTION TYPE */}

      {/* 1. Single Choice & 14. Dropdown Selection */}
      {(questionType === 'Single Choice' || questionType === 'Dropdown Selection') && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Options & Correct Answer Selection
          </label>
          {['A', 'B', 'C', 'D'].map((key) => {
            const optVal =
              config.options?.find((o) => o.id === key)?.text ||
              (key === 'A' ? (config as any).option_a : key === 'B' ? (config as any).option_b : key === 'C' ? (config as any).option_c : (config as any).option_d) ||
              '';
            return (
              <div key={key} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctAnswer === key}
                  onChange={() => setCorrectAnswer(key)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="w-7 text-xs font-bold text-slate-700 text-center">Option {key}</span>
                <input
                  type="text"
                  value={optVal}
                  onChange={(e) => {
                    const text = e.target.value;
                    setConfig((prev) => {
                      const opts = prev.options || [
                        { id: 'A', text: '' },
                        { id: 'B', text: '' },
                        { id: 'C', text: '' },
                        { id: 'D', text: '' },
                      ];
                      const updated = opts.map((o) => (o.id === key ? { ...o, text } : o));
                      return { ...prev, options: updated };
                    });
                  }}
                  placeholder={`Enter Option ${key} text...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Multiple Choice */}
      {questionType === 'Multiple Choice' && (
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Options & Multiple Correct Answers
            </label>
            <select
              value={config.scoringMethod || 'All-or-nothing'}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, scoringMethod: e.target.value as any }))
              }
              className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700"
            >
              <option value="All-or-nothing">All-or-nothing</option>
              <option value="Partial scoring">Partial scoring</option>
            </select>
          </div>

          {['A', 'B', 'C', 'D'].map((key) => {
            const selected = config.correctAnswers?.includes(key);
            const optVal = config.options?.find((o) => o.id === key)?.text || '';
            return (
              <div key={key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setConfig((prev) => {
                      const current = prev.correctAnswers || [];
                      const updated = checked
                        ? [...current, key]
                        : current.filter((k) => k !== key);
                      return { ...prev, correctAnswers: updated };
                    });
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="w-7 text-xs font-bold text-slate-700 text-center">{key}</span>
                <input
                  type="text"
                  value={optVal}
                  onChange={(e) => {
                    const text = e.target.value;
                    setConfig((prev) => {
                      const opts = prev.options || [
                        { id: 'A', text: '' },
                        { id: 'B', text: '' },
                        { id: 'C', text: '' },
                        { id: 'D', text: '' },
                      ];
                      const updated = opts.map((o) => (o.id === key ? { ...o, text } : o));
                      return { ...prev, options: updated };
                    });
                  }}
                  placeholder={`Enter Option ${key} text...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 3. True / False & 4. Yes / No */}
      {(questionType === 'True / False' || questionType === 'Yes / No') && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Correct Answer
          </label>
          <div className="flex items-center space-x-6">
            {(questionType === 'True / False' ? ['True', 'False'] : ['Yes', 'No']).map((opt) => (
              <label key={opt} className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="binaryCorrect"
                  checked={correctAnswer.toLowerCase() === opt.toLowerCase()}
                  onChange={() => setCorrectAnswer(opt)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 5. Fill in the Blank & 8. Code Completion */}
      {(questionType === 'Fill in the Blank' || questionType === 'Code Completion') && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Accepted Answers (comma separated)
            </label>
            <input
              type="text"
              value={config.acceptedAnswers?.join(', ') || correctAnswer}
              onChange={(e) => {
                const val = e.target.value;
                setCorrectAnswer(val);
                setConfig((prev) => ({
                  ...prev,
                  acceptedAnswers: val.split(',').map((s) => s.trim()).filter(Boolean),
                }));
              }}
              placeholder="e.g. SE38, se38, ABAP Editor"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={config.caseSensitive || false}
              onChange={(e) => setConfig((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Case Sensitive Matching</span>
          </label>
        </div>
      )}

      {/* 15. Numeric Answer */}
      {questionType === 'Numeric Answer' && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Exact Numeric Value
            </label>
            <input
              type="number"
              value={config.numericAnswer || correctAnswer}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCorrectAnswer(e.target.value);
                setConfig((prev) => ({ ...prev, numericAnswer: val }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tolerance (±)
            </label>
            <input
              type="number"
              value={config.tolerance || 0}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, tolerance: parseFloat(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Unit (Optional)
            </label>
            <input
              type="text"
              value={config.unit || ''}
              placeholder="e.g. ms, KB, records"
              onChange={(e) => setConfig((prev) => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-900"
            />
          </div>
        </div>
      )}

      {/* 18. Image Based */}
      {questionType === 'Image Based' && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Image URL / Path
          </label>
          <input
            type="text"
            value={config.imageUrl || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/screenshot.png or /images/abap.png"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
          />
          {config.imageUrl && (
            <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 max-w-xs">
              <img src={config.imageUrl} alt="Preview" className="w-full h-auto rounded-lg object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Settings Row: Marks, Negative Marks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Marks for Correct Answer
          </label>
          <input
            type="number"
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Negative Marks for Wrong Answer
          </label>
          <input
            type="number"
            step="0.25"
            value={negativeMarks}
            onChange={(e) => setNegativeMarks(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-bold"
          />
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Explanation / Solution Notes
        </label>
        <textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Provide rationale displayed to candidate after test evaluation..."
          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium bg-white"
        />
      </div>
    </div>
  );
}
