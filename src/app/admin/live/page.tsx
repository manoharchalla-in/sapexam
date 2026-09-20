'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Activity, Clock, UserCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ActiveAttempt {
  id: string;
  candidate_name: string;
  candidate_email: string;
  paper_title: string;
  started_at: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'IDLE';
}

export default function LiveMonitoringPage() {
  const [attempts, setAttempts] = useState<ActiveAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/live');
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAttempts();
    const interval = setInterval(fetchLiveAttempts, 10000);
    return () => clearInterval(interval);
  }, [fetchLiveAttempts]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Live Exam Monitoring</h1>
              <p className="text-xs text-slate-500 font-medium">Real-Time Candidate Active Assessment Progress</p>
            </div>
          </div>

          <button
            onClick={fetchLiveAttempts}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
            title="Refresh Live Candidates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl">
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Polling Active Candidate Sessions...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Activity className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Active Candidates Right Now</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Candidates taking exams in real-time will appear here dynamically.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="p-4">Candidate Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Exam Paper</th>
                    <th className="p-4">Started At</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-4 font-bold text-slate-950">{att.candidate_name}</td>
                      <td className="p-4 text-slate-600">{att.candidate_email}</td>
                      <td className="p-4 font-semibold text-blue-700">{att.paper_title}</td>
                      <td className="p-4 text-slate-500">{new Date(att.started_at).toLocaleTimeString()}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          <span>ACTIVE</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
