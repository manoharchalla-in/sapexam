'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Layers, Plus, Copy, Trash2, CheckCircle, Loader2, Sparkles } from 'lucide-react';

interface Template {
  id: number;
  title: string;
  description: string;
  category: string;
  total_questions: number;
  duration_minutes: number;
  passing_marks: number;
  created_at: string;
}

export default function ExamTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

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
              <p className="text-xs text-slate-500 font-medium">Reusable Question Paper Structure Presets</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl">
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Exam Templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                      DEFAULT TEMPLATE
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-950">SAP ABAP Technical Screening</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    10 Objective & Code Output Questions, 30 Minutes Duration, Passing score 5/10.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>10 Questions</span>
                  <span>30 Mins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
