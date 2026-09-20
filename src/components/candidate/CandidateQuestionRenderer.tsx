'use client';

import React from 'react';
import { QuestionModel, BaseQuestionConfig } from '@/types/assessment';
import { Check, HelpCircle } from 'lucide-react';

interface CandidateRendererProps {
  question: QuestionModel;
  questionNumber: number;
  userAnswer: any;
  onAnswerChange: (val: any) => void;
}

export default function CandidateQuestionRenderer({
  question,
  questionNumber,
  userAnswer,
  onAnswerChange,
}: CandidateRendererProps) {
  let config: BaseQuestionConfig = {};
  if (typeof question.configuration === 'string') {
    try {
      config = JSON.parse(question.configuration || '{}');
    } catch {
      config = {};
    }
  } else if (question.configuration) {
    config = question.configuration;
  }

  const qType = question.question_type;

  return (
    <div className="space-y-6">
      {/* Question Header & Prompt */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-extrabold text-xs">
            Q{questionNumber}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px]">
            {qType}
          </span>
          <span className="text-xs font-bold text-slate-400">
            ({question.marks} {question.marks === 1 ? 'Mark' : 'Marks'})
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug whitespace-pre-line">
          {question.question_text}
        </h3>
      </div>

      {/* Image Renderer */}
      {config.imageUrl && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg">
          <img src={config.imageUrl} alt="Question Diagram" className="w-full h-auto rounded-xl object-contain" />
          {config.imageCaption && (
            <p className="text-xs text-slate-500 font-medium text-center mt-2">{config.imageCaption}</p>
          )}
        </div>
      )}

      {/* RENDERERS BASED ON QUESTION TYPE */}

      {/* 1. Single Choice */}
      {qType === 'Single Choice' && (
        <div className="space-y-3">
          {(config.options || [
            { id: 'A', text: question.option_a || '' },
            { id: 'B', text: question.option_b || '' },
            { id: 'C', text: question.option_c || '' },
            { id: 'D', text: question.option_d || '' },
          ]).map((opt) => {
            const isSelected = String(userAnswer || '').toUpperCase() === opt.id.toUpperCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onAnswerChange(opt.id)}
                className={`w-full flex items-center space-x-4 p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-500'
                  }`}
                >
                  {opt.id}
                </div>
                <span className="text-sm">{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Multiple Choice */}
      {qType === 'Multiple Choice' && (
        <div className="space-y-3">
          {(config.options || [
            { id: 'A', text: question.option_a || '' },
            { id: 'B', text: question.option_b || '' },
            { id: 'C', text: question.option_c || '' },
            { id: 'D', text: question.option_d || '' },
          ]).map((opt) => {
            const currentArray: string[] = Array.isArray(userAnswer)
              ? userAnswer
              : typeof userAnswer === 'string'
              ? userAnswer.split(',').filter(Boolean)
              : [];
            const isChecked = currentArray.includes(opt.id);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const updated = isChecked
                    ? currentArray.filter((k) => k !== opt.id)
                    : [...currentArray, opt.id];
                  onAnswerChange(updated);
                }}
                className={`w-full flex items-center space-x-4 p-4 rounded-2xl border text-left transition-all ${
                  isChecked
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-medium hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center font-bold text-xs shrink-0 ${
                    isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-500'
                  }`}
                >
                  {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : opt.id}
                </div>
                <span className="text-sm">{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. True / False & 4. Yes / No */}
      {(qType === 'True / False' || qType === 'Yes / No') && (
        <div className="grid grid-cols-2 gap-4">
          {(qType === 'True / False' ? ['True', 'False'] : ['Yes', 'No']).map((val) => {
            const isSelected = String(userAnswer || '').toLowerCase() === val.toLowerCase();
            return (
              <button
                key={val}
                type="button"
                onClick={() => onAnswerChange(val)}
                className={`p-5 rounded-2xl border text-center font-bold text-base transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Fill in the Blank, Code Completion, Code Output */}
      {(qType === 'Fill in the Blank' || qType === 'Code Completion' || qType === 'Code Output') && (
        <div className="space-y-3">
          <input
            type="text"
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
          />
        </div>
      )}

      {/* 6. Short Answer & 7. Long Answer */}
      {(qType === 'Short Answer' || qType === 'Long Answer' || qType === 'Code Writing') && (
        <div className="space-y-3">
          <textarea
            rows={qType === 'Long Answer' || qType === 'Code Writing' ? 6 : 3}
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter your response here..."
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
          />
        </div>
      )}

      {/* 14. Dropdown Selection */}
      {qType === 'Dropdown Selection' && (
        <div className="max-w-md">
          <select
            value={String(userAnswer || '')}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Select Answer --</option>
            {(config.options || [
              { id: 'A', text: question.option_a },
              { id: 'B', text: question.option_b },
              { id: 'C', text: question.option_c },
              { id: 'D', text: question.option_d },
            ]).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.id}: {opt.text}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 15. Numeric Answer */}
      {qType === 'Numeric Answer' && (
        <div className="flex items-center space-x-3 max-w-xs">
          <input
            type="number"
            value={typeof userAnswer === 'string' || typeof userAnswer === 'number' ? userAnswer : ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter number..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 font-bold text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {config.unit && <span className="text-xs font-bold text-slate-500">{config.unit}</span>}
        </div>
      )}
    </div>
  );
}
