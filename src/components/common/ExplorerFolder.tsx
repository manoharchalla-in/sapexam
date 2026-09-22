'use client';

import React from 'react';
import { MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';

interface ExplorerFolderProps {
  name: string;
  subLabel?: string;
  badge?: string | number;
  badgeLabel?: string;
  iconType?: 'college' | 'students' | 'exams' | 'paper' | 'results' | 'custom';
  innerIcon?: React.ReactNode;
  onClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
}

export default function ExplorerFolder({
  name,
  subLabel,
  badge,
  badgeLabel,
  iconType = 'college',
  innerIcon,
  onClick,
  onRename,
  onDelete,
  isSelected = false,
}: ExplorerFolderProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div
      className={`group relative flex flex-col items-center justify-start p-3.5 rounded-2xl transition-all duration-150 cursor-pointer select-none text-center ${
        isSelected
          ? 'bg-blue-100/70 border border-blue-400/80 shadow-xs'
          : 'hover:bg-sky-50/70 hover:border hover:border-sky-200/80 border border-transparent'
      }`}
      onClick={onClick}
    >
      {/* Top right action trigger (if rename/delete provided) */}
      {(onRename || onDelete) && (
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg bg-white/90 hover:bg-white text-slate-600 shadow-2xs border border-slate-200/80"
              title="Folder Options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1 text-left z-30 animate-in fade-in zoom-in-95">
                {onRename && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRename();
                    }}
                    className="w-full px-3 py-1.5 text-2xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Rename</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full px-3 py-1.5 text-2xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Realistic 3D Yellow Folder Illustration */}
      <div className="relative w-28 h-24 flex items-center justify-center shrink-0 mb-2 transition-transform duration-150 group-hover:scale-105">
        <svg
          viewBox="0 0 110 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_6px_10px_rgba(245,158,11,0.22)]"
        >
          <defs>
            {/* Back folder gradient */}
            <linearGradient id="folderBackGrad" x1="0" y1="0" x2="110" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA000" />
              <stop offset="100%" stopColor="#FF8F00" />
            </linearGradient>

            {/* Front folder flap gradient */}
            <linearGradient id="folderFrontGrad" x1="0" y1="28" x2="110" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFD54F" />
              <stop offset="35%" stopColor="#FFCA28" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>

            {/* Folder Front Highlight Top Border */}
            <linearGradient id="folderHighlight" x1="0" y1="28" x2="110" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFE082" stopOpacity="0.5" />
            </linearGradient>

            {/* Paper Sheet Gradient */}
            <linearGradient id="paperGrad" x1="0" y1="12" x2="70" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            <filter id="folderShadow" x="0" y="24" width="110" height="66" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="-2" stdDeviation="2" floodColor="#B45309" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. Folder Back Body + Tab */}
          <path
            d="M8 12C8 7.58172 11.5817 4 16 4H42C45.5 4 48 6.5 51 10L56 16H94C98.4183 16 102 19.5817 102 24V74C102 78.4183 98.4183 82 94 82H16C11.5817 82 8 78.4183 8 74V12Z"
            fill="url(#folderBackGrad)"
          />

          {/* 2. Inner Document / Paper Sleeve Sticking Out */}
          <g transform="translate(20, 10)">
            <rect
              x="2"
              y="2"
              width="66"
              height="50"
              rx="4"
              fill="url(#paperGrad)"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            {/* Document Lines / Preview Header */}
            <rect x="10" y="10" width="30" height="4" rx="2" fill="#94A3B8" />
            <rect x="10" y="18" width="46" height="2.5" rx="1.2" fill="#CBD5E1" />
            <rect x="10" y="24" width="40" height="2.5" rx="1.2" fill="#E2E8F0" />
            <rect x="10" y="30" width="46" height="2.5" rx="1.2" fill="#E2E8F0" />
          </g>

          {/* 3. Folder Front Pocket (with 3D perspective shadow) */}
          <path
            d="M6 34C6 29.5817 9.58172 26 14 26H96C100.418 26 104 29.5817 104 34V76C104 81.5228 99.5228 86 94 86H16C10.4772 86 6 81.5228 6 76V34Z"
            fill="url(#folderFrontGrad)"
            stroke="url(#folderHighlight)"
            strokeWidth="1"
          />

          {/* 4. Bottom Inner Crease Line */}
          <path d="M7 77C7 81 11 85 16 85H94C99 85 103 81 103 77" stroke="#D97706" strokeWidth="1" strokeOpacity="0.4" />
        </svg>

        {/* Floating Custom Center Badge / Icon */}
        {innerIcon && (
          <div className="absolute bottom-5 inset-x-0 flex items-center justify-center pointer-events-none">
            <div className="p-1.5 rounded-lg bg-white/90 shadow-2xs border border-amber-200/80 text-amber-700">
              {innerIcon}
            </div>
          </div>
        )}
      </div>

      {/* Folder Name Label (Windows Explorer style centered text) */}
      <div className="w-full max-w-[130px] space-y-1">
        <p
          className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 break-words group-hover:text-blue-700 group-hover:underline decoration-blue-500 underline-offset-2"
          title={name}
        >
          {name}
        </p>

        {/* Sub-label / Metadata (e.g. folder ID or student/exam count) */}
        {subLabel && (
          <p className="text-[10px] text-slate-400 font-medium truncate font-mono">
            {subLabel}
          </p>
        )}

        {/* Counter Badge */}
        {badge !== undefined && (
          <div className="inline-flex items-center space-x-1 text-[10px] font-black text-slate-600 bg-slate-100/90 group-hover:bg-blue-100 group-hover:text-blue-800 px-2 py-0.5 rounded-full border border-slate-200/70 transition-colors">
            <span>{badge}</span>
            {badgeLabel && <span>{badgeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
