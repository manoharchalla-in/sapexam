'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import {
  UserCheck,
  Plus,
  Copy,
  Check,
  KeyRound,
  Trash2,
  ExternalLink,
  ArrowRight,
  Search,
  Users,
  Award,
  TrendingUp,
  Loader2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface TrainerItem {
  id: number;
  username: string;
  display_name: string;
  password: string;
  created_at: string;
}

interface Stats {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  passedCount: number;
  trainerStats?: Record<string, { total: number; avgScore: number; passed: number }>;
}

export default function TrainersAdminPage() {
  const router = useRouter();

  const [trainersList, setTrainersList] = useState<TrainerItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Trainer Form State
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerPassword, setNewTrainerPassword] = useState('123');
  const [isCreatingTrainer, setIsCreatingTrainer] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Password Modal State
  const [editingTrainer, setEditingTrainer] = useState<TrainerItem | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete Trainer Modal State
  const [deleteTrainerModal, setDeleteTrainerModal] = useState<TrainerItem | null>(null);
  const [isDeletingTrainer, setIsDeletingTrainer] = useState(false);

  // Password visibility map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});

  // Copied Link Feedback
  const [copiedUsername, setCopiedUsername] = useState<string | null>(null);

  const fetchTrainersAndStats = useCallback(async () => {
    setLoading(true);
    try {
      const [trainersRes, resultsRes] = await Promise.all([
        fetch('/api/admin/trainers'),
        fetch('/api/admin/results?limit=1'),
      ]);

      if (trainersRes.status === 401 || resultsRes.status === 401) {
        setAuthError(true);
        router.push('/admin/login');
        return;
      }

      if (trainersRes.ok) {
        const data = await trainersRes.json();
        setTrainersList(data.trainers || []);
      }

      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch trainers', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTrainersAndStats();
  }, [fetchTrainersAndStats]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerName.trim()) return;
    setIsCreatingTrainer(true);
    setCreateError('');

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newTrainerName.trim(),
          password: newTrainerPassword.trim() || '123',
        }),
      });

      if (res.ok) {
        setNewTrainerName('');
        setNewTrainerPassword('123');
        setShowAddTrainerModal(false);
        fetchTrainersAndStats();
      } else {
        const errData = await res.json();
        setCreateError(errData.error || 'Failed to create trainer');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating trainer');
    } finally {
      setIsCreatingTrainer(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer || !editPasswordValue.trim()) return;
    setIsSavingPassword(true);

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editingTrainer.username,
          password: editPasswordValue.trim(),
        }),
      });

      if (res.ok) {
        setEditingTrainer(null);
        setEditPasswordValue('');
        fetchTrainersAndStats();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update password');
      }
    } catch (err) {
      alert('Error saving password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!deleteTrainerModal) return;
    setIsDeletingTrainer(true);

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: deleteTrainerModal.username,
        }),
      });

      if (res.ok) {
        setDeleteTrainerModal(null);
        fetchTrainersAndStats();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete trainer');
      }
    } catch (err) {
      alert('Error deleting trainer');
    } finally {
      setIsDeletingTrainer(false);
    }
  };

  const handleCopyTrainerLogin = (trainer: TrainerItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const textToCopy = `Trainer Portal: ${origin}/admin/trainer/${trainer.username}\nUsername: ${trainer.username}\nPassword: ${trainer.password}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedUsername(trainer.username);
    setTimeout(() => setCopiedUsername(null), 2500);
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTrainers = trainersList.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.display_name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q);
  });

  const totalTrainerAttempts = trainersList.reduce((acc, t) => {
    const trainerData = stats?.trainerStats?.[t.display_name] || { total: 0 };
    return acc + trainerData.total;
  }, 0);

  if (authError) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 leading-tight">
                Dedicated Trainer Admin Panels & Credentials
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage trainer accounts, set custom passwords, and access dedicated evaluation dashboards
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddTrainerModal(true);
              setCreateError('');
            }}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Trainer</span>
          </button>
        </header>

        <div className="p-6 md:p-10 space-y-6 max-w-7xl w-full">
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Trainers</span>
                <span className="text-2xl font-black text-slate-900">{trainersList.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Attempts Tracked</span>
                <span className="text-2xl font-black text-slate-900">{totalTrainerAttempts}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Trainer Security</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                  Dedicated Isolation Active
                </span>
              </div>
            </div>
          </div>

          {/* Search toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search trainers by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredTrainers.length} of {trainersList.length} Trainers
            </span>
          </div>

          {/* Trainers Cards Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Loading Trainer Panels & Credentials...</p>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Trainers Found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Add a new trainer to generate credentials and dedicated panels.</p>
              <button
                onClick={() => setShowAddTrainerModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all"
              >
                Create Trainer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTrainers.map((trainerItem) => {
                const trainerNameUpper = trainerItem.display_name;
                const trainerData = stats?.trainerStats?.[trainerNameUpper] || { total: 0, avgScore: 0, passed: 0 };
                const isCopied = copiedUsername === trainerItem.username;
                const isPasswordRevealed = showPasswordMap[trainerItem.id];

                return (
                  <div
                    key={trainerItem.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top badge & options */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                          TRAINER
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingTrainer(trainerItem);
                              setEditPasswordValue(trainerItem.password);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Change Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTrainerModal(trainerItem)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Trainer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display name */}
                      <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {trainerItem.display_name}
                      </h3>

                      {/* Credentials box */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600 font-medium">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Username:</span>
                          <span className="font-bold text-slate-800 font-mono">{trainerItem.username}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 font-medium">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Password:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-800 font-mono">
                              {isPasswordRevealed ? trainerItem.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(trainerItem.id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                            >
                              {isPasswordRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stats numbers */}
                      <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-100">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Attempts</span>
                          <span className="text-xs font-black text-slate-900">{trainerData.total}</span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
                          <span className="text-xs font-black text-slate-900">{trainerData.avgScore}</span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Passed</span>
                          <span className="text-xs font-black text-emerald-600">{trainerData.passed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => handleCopyTrainerLogin(trainerItem)}
                        className={`w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{isCopied ? 'Credentials Copied!' : 'Copy Direct Credentials'}</span>
                      </button>

                      <Link
                        href={`/admin/trainer/${trainerItem.username}`}
                        className="w-full inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-xs transition-all"
                      >
                        <span>Open Dedicated Panel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Trainer Modal */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Dedicated Trainer</h3>
                  <p className="text-xs text-slate-500 font-medium">Add trainer and generate credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTrainer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trainer Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTrainerName}
                  onChange={(e) => setNewTrainerName(e.target.value)}
                  placeholder="e.g. SITA RAMA RAJU"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={newTrainerPassword}
                  onChange={(e) => setNewTrainerPassword(e.target.value)}
                  placeholder="123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTrainer}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isCreatingTrainer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Trainer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {editingTrainer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Change Trainer Password</h3>
                  <p className="text-xs text-slate-500 font-medium">Trainer: {editingTrainer.display_name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTrainer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPasswordValue}
                  onChange={(e) => setEditPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Trainer Confirmation Modal */}
      {deleteTrainerModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Trainer Account</h3>
                <p className="text-xs text-slate-500 font-medium">Remove trainer from assessment options</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Are you sure you want to remove <strong className="text-slate-900">{deleteTrainerModal.display_name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteTrainerModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrainer}
                disabled={isDeletingTrainer}
                className="inline-flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isDeletingTrainer ? 'Deleting...' : 'Delete Trainer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
