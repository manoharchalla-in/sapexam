'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Settings,
  Sparkles,
  FolderTree,
} from 'lucide-react';
import AppLogo from '@/components/common/AppLogo';

interface SidebarProps {
  currentRole?: string;
}

export default function AdminSidebar({ currentRole = 'Main Super Admin' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard & Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Folders', href: '/admin/folders', icon: FolderTree },
    { label: 'Trainer Panels & Credentials', href: '/admin/trainers', icon: UserCheck },
    { label: 'Live Monitoring', href: '/admin/live', icon: Activity },
    { label: 'Analytics & Pass Rates', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Landing Page & Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden glossy-header py-3 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <AppLogo size="sm" />
          <div>
            <h2 className="text-xs font-black text-slate-950">SAP ABAP Control</h2>
            <p className="text-[10px] text-slate-500 font-medium">Enterprise Assessment Portal</p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/80"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-slate-100/90 flex items-center space-x-3 bg-gradient-to-b from-slate-50/50 to-transparent">
            <div className="p-1.5 bg-white rounded-xl shadow-2xs border border-slate-100">
              <AppLogo size="md" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-950 tracking-tight">Main Admin Panel</h1>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 border border-emerald-100">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Enterprise Mode</span>
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="p-3.5 space-y-1">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Navigation
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/90 shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer / Account Actions */}
        <div className="p-4 border-t border-slate-100/90 space-y-2.5 bg-gradient-to-t from-slate-50/70 to-transparent">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center space-x-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Super Admin</p>
              <p className="text-[10px] text-emerald-600 truncate font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>System Active</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border border-red-200/90 text-red-600 bg-red-50/40 hover:bg-red-50 hover:text-red-700 text-xs font-bold transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
