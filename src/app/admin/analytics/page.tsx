'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { BarChart3, TrendingUp, Award, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data.analytics || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Analytics & Insights</h1>
              <p className="text-xs text-slate-500 font-medium">Performance Metrics, Score Distributions & Pass Rates</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl">
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Calculating Analytics Metrics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Attempts</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-slate-950">{stats?.totalAttempts || 0}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pass Rate</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-950">{stats?.passRate || 0}%</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Score</span>
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-slate-950">{stats?.averageScore || 0} / 10</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidates Passed</span>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-slate-950">{stats?.passedCount || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
