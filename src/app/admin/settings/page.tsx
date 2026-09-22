'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  Settings,
  Building,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Loader2,
  FileText,
  Layout,
  Globe,
  ExternalLink,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

interface CampusItem {
  id: number;
  name: string;
  created_at: string;
}

export default function LandingPageSettingsAdmin() {
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [newCampusName, setNewCampusName] = useState('');
  const [isAddingCampus, setIsAddingCampus] = useState(false);
  const [campusSuccessMsg, setCampusSuccessMsg] = useState('');
  const [campusErrorMsg, setCampusErrorMsg] = useState('');

  // Portal texts
  const [portalTitle, setPortalTitle] = useState('SAP Learning Portal');
  const [portalSubtitle, setPortalSubtitle] = useState('Enterprise Skill Assessment System');
  const [portalAssessmentName, setPortalAssessmentName] = useState('SAP ABAP Assessment');
  const [portalInstructions, setPortalInstructions] = useState('Enter your details to begin the assessment.');
  const [portalLogoUrl, setPortalLogoUrl] = useState('/logo.png');

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Purge database state
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState('');

  const fetchSettingsAndCampuses = useCallback(async () => {
    setLoading(true);
    try {
      const [campusesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/campuses'),
        fetch('/api/admin/settings'),
      ]);

      if (campusesRes.ok) {
        const data = await campusesRes.json();
        setCampuses(data.campuses || []);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setPortalTitle(data.settings.portal_title || 'SAP Learning Portal');
          setPortalSubtitle(data.settings.portal_subtitle || 'Enterprise Skill Assessment System');
          setPortalAssessmentName(data.settings.portal_assessment_name || 'SAP ABAP Assessment');
          setPortalInstructions(data.settings.portal_instructions || 'Enter your details to begin the assessment.');
          setPortalLogoUrl(data.settings.portal_logo_url || '/logo.png');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndCampuses();
  }, [fetchSettingsAndCampuses]);

  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCampusName.trim().toUpperCase();
    if (!trimmed) return;
    setIsAddingCampus(true);
    setCampusErrorMsg('');
    setCampusSuccessMsg('');

    try {
      const res = await fetch('/api/admin/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewCampusName('');
        setCampusSuccessMsg(`Campus "${trimmed}" added successfully!`);
        if (data.campus) {
          setCampuses((prev) => {
            const filtered = prev.filter((c) => c.name.toUpperCase() !== trimmed);
            return [...filtered, data.campus].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
        setTimeout(() => setCampusSuccessMsg(''), 3500);
        fetchSettingsAndCampuses();
      } else if (res.status === 401) {
        setCampusErrorMsg('Session expired or unauthorized. Please login at /admin/login');
      } else {
        const err = await res.json();
        setCampusErrorMsg(err.error || 'Failed to add campus');
      }
    } catch (err) {
      setCampusErrorMsg('Error communicating with server to add campus');
    } finally {
      setIsAddingCampus(false);
    }
  };

  const handleDeleteCampus = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete campus "${name}" from candidate selection options?`)) return;
    setCampusErrorMsg('');
    setCampusSuccessMsg('');

    setCampuses((prev) => prev.filter((c) => c.id !== id && c.name.toUpperCase() !== name.toUpperCase()));

    try {
      const res = await fetch('/api/admin/campuses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });

      if (res.ok) {
        setCampusSuccessMsg(`Campus "${name}" deleted.`);
        setTimeout(() => setCampusSuccessMsg(''), 3000);
        fetchSettingsAndCampuses();
      } else if (res.status === 401) {
        setCampusErrorMsg('Session expired or unauthorized. Please login at /admin/login');
        fetchSettingsAndCampuses();
      } else {
        const err = await res.json();
        setCampusErrorMsg(err.error || 'Failed to delete campus');
        fetchSettingsAndCampuses();
      }
    } catch (err) {
      setCampusErrorMsg('Error deleting campus');
      fetchSettingsAndCampuses();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            portal_title: portalTitle,
            portal_subtitle: portalSubtitle,
            portal_assessment_name: portalAssessmentName,
            portal_instructions: portalInstructions,
            portal_logo_url: portalLogoUrl,
          },
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePurgeAllRecords = async () => {
    const confirmation = window.prompt(
      '⚠️ WARNING: This will permanently delete ALL candidate assessment records, answers, and scores from the database.\n\nTo confirm, type "DELETE ALL" below:'
    );
    if (confirmation !== 'DELETE ALL') {
      if (confirmation !== null) {
        alert('Action canceled. You must type "DELETE ALL" exactly.');
      }
      return;
    }

    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'ALL' }),
      });

      if (res.ok) {
        const data = await res.json();
        setPurgeSuccessMsg(data.message || 'All assessment records purged successfully!');
        setTimeout(() => setPurgeSuccessMsg(''), 5000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to purge database records');
      }
    } catch (err) {
      alert('Error purging database records');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen min-w-0">
        <header className="glossy-header py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-2xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">Portal Configuration & Settings</h1>
              <p className="text-xs text-slate-500 font-medium">Configure branding, campuses, and system maintenance</p>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 glossy-card hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Landing Page</span>
          </a>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-5xl">
          {loading ? (
            <div className="p-12 text-center glossy-card rounded-3xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Configuration Settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dynamic Campus Management */}
              <div className="glossy-card rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Building className="w-4.5 h-4.5 text-blue-600" />
                      <span>Dynamic Campus Options (Radio Buttons on Landing Page)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add or remove campus options that candidates can select during login.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddCampus} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newCampusName}
                    onChange={(e) => setNewCampusName(e.target.value)}
                    placeholder="Enter new campus name (e.g., CITY, CIET, VIZAG)"
                    className="flex-1 px-4 py-2.5 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isAddingCampus}
                    className="inline-flex items-center space-x-1.5 glossy-button-primary font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingCampus ? 'Adding...' : 'Add Campus'}</span>
                  </button>
                </form>

                {campusSuccessMsg && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{campusSuccessMsg}</span>
                  </div>
                )}

                {campusErrorMsg && (
                  <div className="p-3 bg-rose-50/90 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-2xs">
                    <span>✕</span>
                    <span>{campusErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {campuses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-900 shadow-2xs hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
                        <span>{c.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCampus(c.id, c.name)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                        title="Delete Campus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Landing Page Text & Branding */}
              <div className="glossy-card rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Layout className="w-4.5 h-4.5 text-blue-600" />
                    <span>Landing Page Branding & Headings</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize titles, assessment banners, and instructions presented to students.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Portal Header Title
                      </label>
                      <input
                        type="text"
                        value={portalTitle}
                        onChange={(e) => setPortalTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Portal Subtitle
                      </label>
                      <input
                        type="text"
                        value={portalSubtitle}
                        onChange={(e) => setPortalSubtitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Main Assessment Box Title
                    </label>
                    <input
                      type="text"
                      value={portalAssessmentName}
                      onChange={(e) => setPortalAssessmentName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Instructions / Tagline
                    </label>
                    <textarea
                      rows={2}
                      value={portalInstructions}
                      onChange={(e) => setPortalInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/90 border border-slate-300/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Logo Configuration & Live Preview */}
                  <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="block text-2xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Corporate Logo Image URL & Live Preview</span>
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={portalLogoUrl}
                          onChange={(e) => setPortalLogoUrl(e.target.value)}
                          placeholder="/logo.svg or https://example.com/logo.png"
                          className="w-full px-4 py-2.5 bg-white border border-slate-300/80 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">
                          Use local path (e.g. <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/logo.png</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/logo.svg</code>) or any external image URL.
                        </p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 flex items-center justify-center min-w-[130px] shadow-2xs">
                        <AppLogo customUrl={portalLogoUrl} size="md" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {savedSuccess ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Settings Saved Successfully!</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">All changes apply instantly to the candidate landing page.</span>
                    )}

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center space-x-1.5 glossy-button-primary font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger Zone: Database Records Purge */}
              <div className="glossy-card rounded-3xl p-6 md:p-8 border border-red-200/80 shadow-sm space-y-4 bg-gradient-to-b from-white to-red-50/20">
                <div className="border-b border-red-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h2 className="text-sm font-black uppercase tracking-wider">Danger Zone & Database Maintenance</h2>
                  </div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-red-700 bg-red-100/80 px-2.5 py-1 rounded-full border border-red-200">
                    Admin Only
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Purge All Candidate Assessment Records</h3>
                    <p className="text-2xs text-slate-500 mt-0.5 max-w-xl font-medium">
                      Permanently wipes all historical candidate submissions, responses, and score records from the SQLite database. Questions, templates, and campuses are kept intact.
                    </p>
                  </div>

                  <button
                    onClick={handlePurgeAllRecords}
                    disabled={isPurging}
                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0"
                  >
                    {isPurging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Purging Records...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Purge All Assessment Records</span>
                      </>
                    )}
                  </button>
                </div>

                {purgeSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{purgeSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
