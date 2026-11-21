'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Check, 
  Copy, 
  KeyRound, 
  ShieldCheck, 
  RefreshCw,
  Award
} from 'lucide-react';
import { StoredStudentWallet } from '@/lib/types';

interface StudentProfileBannerProps {
  wallet: StoredStudentWallet | null;
  activeStudent: {
    studentId: string;
    name: string;
    degree?: string;
    major?: string;
    institution?: string;
    cgpa?: number | string;
    cgpa_above_8?: boolean;
    graduation_year?: number | string;
  };
  availableStudents: any[];
  onSelectStudent: (studentId: string) => void;
  isLoading?: boolean;
}

export function StudentProfileBanner({
  wallet,
  activeStudent,
  availableStudents,
  onSelectStudent,
  isLoading = false,
}: StudentProfileBannerProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : '0x...';

  // Initials for avatar
  const initials = activeStudent.name
    ? activeStudent.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Clean Identity Block */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          {/* Refined Monogram Avatar */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-900 text-white font-semibold text-lg flex items-center justify-center tracking-tight shadow-sm">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Verified Identity">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {activeStudent.name || 'Student Portfolio'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                Identity Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-500 font-normal">
              <span className="text-neutral-700 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                {activeStudent.institution || 'Indian Institute of Technology Bombay'}
              </span>
              <span className="text-neutral-300">•</span>
              <span>ID: <span className="font-mono text-neutral-700">{activeStudent.studentId}</span></span>
              <span className="text-neutral-300">•</span>
              <span>Class of {activeStudent.graduation_year || '2024'}</span>
              {activeStudent.cgpa && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span className="text-neutral-800 font-medium">CGPA {activeStudent.cgpa} / 10.0</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Key Details & Profile Switcher */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 self-start lg:self-center">
          {/* Minimalist In-App Key Utility */}
          <div className="inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-1.5 text-xs">
            <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400 font-mono text-[11px]">Key</span>
            <span className="font-mono font-medium text-neutral-800">{truncatedAddress}</span>
            <button
              onClick={copyAddress}
              className="p-1 rounded hover:bg-neutral-200/70 text-neutral-400 hover:text-neutral-700 transition"
              title="Copy sovereign address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Demo Switcher */}
          {availableStudents.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={activeStudent.studentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="bg-white border border-neutral-200/90 text-neutral-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-neutral-400 transition cursor-pointer font-medium"
                aria-label="Switch student profile"
              >
                {availableStudents.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
              {isLoading && <RefreshCw className="w-3 h-3 text-neutral-400 animate-spin" />}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
